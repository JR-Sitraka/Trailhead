import { sql } from "drizzle-orm";
import { db } from "@/server/db";

export interface SearchResult {
  fileId: string;
  path: string;
  line: number;
  snippet: string;
}

export async function searchFiles(
  repositoryId: string,
  query: string,
  fileType?: string,
  pathPrefix?: string
): Promise<SearchResult[]> {
  const escapedQuery = query.replace(/%/g, "\\%").replace(/_/g, "\\_");

  const pathFilter = pathPrefix ? sql`f.path LIKE ${pathPrefix + "%"}` : sql`TRUE`;
  const ext = fileType ? (fileType.startsWith(".") ? fileType : "." + fileType) : null;
  const typeFilter = ext ? sql`f.path LIKE '%' || ${ext}` : sql`TRUE`;

  const exactRows = await db.execute(sql`
    SELECT f.id, f.path, f.content
    FROM files f
    WHERE f.repository_id = ${repositoryId}
      AND f.skipped = false
      AND f.content IS NOT NULL
      AND f.content ILIKE '%' || ${escapedQuery} || '%'
      AND ${pathFilter}
      AND ${typeFilter}
    LIMIT 50
  `);

  const ftsRows = await db.execute(sql`
    SELECT f.id, f.path, f.content,
      ts_headline('english', f.content, plainto_tsquery('english', ${escapedQuery}), 'MinWords=15, MaxWords=40') AS headline,
      ts_rank(f.content_search_vector, plainto_tsquery('english', ${escapedQuery})) AS rank
    FROM files f
    WHERE f.repository_id = ${repositoryId}
      AND f.skipped = false
      AND f.content IS NOT NULL
      AND f.content_search_vector @@ plainto_tsquery('english', ${escapedQuery})
      AND NOT EXISTS (
        SELECT 1 FROM files fe
        WHERE fe.id = f.id
          AND fe.repository_id = ${repositoryId}
          AND fe.skipped = false
          AND fe.content IS NOT NULL
          AND fe.content ILIKE '%' || ${escapedQuery} || '%'
          AND ${pathFilter}
          AND ${typeFilter}
      )
      AND ${pathFilter}
      AND ${typeFilter}
    ORDER BY rank DESC
    LIMIT 50
  `);

  const results: SearchResult[] = [];

  for (const row of exactRows) {
    const content = String(row.content ?? "");
    const lowerContent = content.toLowerCase();
    const lowerQuery = escapedQuery.toLowerCase();
    const matchIndex = lowerContent.indexOf(lowerQuery);
    const line = matchIndex >= 0
      ? content.substring(0, matchIndex).split("\n").length
      : 1;

    const snippet = extractExactSnippet(content, matchIndex, escapedQuery);
    results.push({
      fileId: String(row.id),
      path: String(row.path),
      line,
      snippet,
    });
  }

  const queryWords = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

  for (const row of ftsRows) {
    const content = String(row.content ?? "");
    const headline = String(row.headline ?? "");
    const line = findFtsLineNumber(content, queryWords);

    results.push({
      fileId: String(row.id),
      path: String(row.path),
      line,
      snippet: headline,
    });
  }

  return results.slice(0, 50);
}

function extractExactSnippet(content: string, matchIndex: number, query: string): string {
  const maxLen = 120;
  if (content.length <= maxLen) return content.replace(/\s+/g, " ").trim();

  const start = Math.max(0, matchIndex - maxLen / 2);
  let snippet = content.slice(start, matchIndex + query.length + maxLen / 2);

  if (start > 0) snippet = "..." + snippet;
  if (snippet.length < content.length && start + snippet.length < content.length) {
    snippet = snippet + "...";
  }

  return snippet.replace(/\s+/g, " ").trim();
}

function findFtsLineNumber(content: string, queryWords: string[]): number {
  if (queryWords.length === 0) return 1;

  const lowerContent = content.toLowerCase();
  for (const word of queryWords) {
    const index = lowerContent.indexOf(word);
    if (index >= 0) {
      return content.substring(0, index).split("\n").length;
    }
  }

  return 1;
}