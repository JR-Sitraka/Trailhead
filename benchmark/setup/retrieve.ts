// Retrieval against trailhead_bench, reusing the exact same query
// pattern as src/server/services/chat.ts's retrieveChunks (cosine_distance
// ASC, id ASC — the documented pgvector index gotcha, KNOWN-GOOD
// 2026-07-22). Reimplemented against benchDb rather than calling
// chat.ts's version directly, since that function is bound to the
// app's shared db client (src/server/db, DATABASE_URL/TEST_DATABASE_URL
// only) — calling it here would require changing src/, which is
// prohibited. The SQL is identical; only the connection differs.
import { sql } from "drizzle-orm";
import { benchDb } from "./db";
import { embeddingChunks } from "../../src/server/db/schema";

function formatVectorForQuery(embedding: number[]): string {
  return `[${embedding.map((v) => Number(v.toFixed(6))).join(",")}]`;
}

export interface RetrievedChunk {
  id: string;
  fileId: string;
  startLine: number;
  endLine: number;
  cosineDistance: number;
}

export async function retrieveChunksFromBench(
  questionEmbedding: number[],
  repositoryId: string,
  k: number
): Promise<RetrievedChunk[]> {
  const vectorStr = formatVectorForQuery(questionEmbedding);

  const rows = await benchDb.execute(
    sql`
      SELECT id, file_id, start_line, end_line, cosine_distance(embedding, ${vectorStr}::vector) AS cosine_distance
      FROM ${embeddingChunks}
      WHERE repository_id = ${repositoryId}
      ORDER BY cosine_distance ASC, id ASC
      LIMIT ${k}
    `
  );

  return rows.map((r) => ({
    id: r.id as string,
    fileId: r.file_id as string,
    startLine: r.start_line as number,
    endLine: r.end_line as number,
    cosineDistance: r.cosine_distance as number
  }));
}
