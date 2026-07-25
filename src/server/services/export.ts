import { db } from "@/server/db";
import { repositories, files, symbols, embeddingChunks } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { embedQuestion, retrieveChunks } from "@/server/services/chat";
import { generateEmbeddings } from "./embeddings";

export interface ExportJsonResponse {
  repository: {
    name: string;
    source: string;
    sourceUrl: string | null;
    commitSha: string | null;
    createdAt: string;
  };
  stack: {
    primaryLanguage: string | null;
    framework: string | null;
    packageManager: string | null;
    buildTool: string | null;
    testFrameworkSummary: string | null;
  };
  entryPoints: Array<{ path: string }>;
  configFiles: Array<{ path: string }>;
  symbols: {
    count: number;
    byKind: Record<string, number>;
  };
  notAnalyzed: Array<{ path: string; reason: string | null }>;
}

export interface TaskPacketRequest {
  task: string;
}

export interface TaskPacketResult {
  fileId: string;
  path: string;
  startLine: number;
  endLine: number;
  content: string;
}

const TASK_PACKET_MAX_CHARS = 1000;
export const TASK_PACKET_K = 15;

export function validateTask(task: string): void {
  const trimmed = task.trim();
  if (!trimmed) {
    throw new Error("Task description is required");
  }
  if (trimmed.length > TASK_PACKET_MAX_CHARS) {
    throw new Error(`Task description must be at most ${TASK_PACKET_MAX_CHARS} characters`);
  }
}

function formatVectorForQuery(embedding: number[]): string {
  return `[${embedding.map(v => Number(v.toFixed(6))).join(",")}]`;
}

async function reSliceChunkText(fileId: string, startLine: number, endLine: number): Promise<string> {
  const [fileRow] = await db.select().from(files).where(eq(files.id, fileId));
  if (!fileRow || !fileRow.content) {
    return "";
  }

  const lines = fileRow.content.split("\n");
  const start = Math.max(startLine - 1, 0);
  const end = Math.min(endLine, lines.length);
  return lines.slice(start, end).join("\n");
}

export async function getExportJson(repositoryId: string): Promise<ExportJsonResponse> {
  const repo = await db.select().from(repositories).where(eq(repositories.id, repositoryId)).then((r) => r[0]);
  if (!repo) {
    throw new Error("Repository not found");
  }

  const entryPointsRows = await db.select({ path: files.path })
    .from(files)
    .where(and(
      eq(files.repositoryId, repositoryId),
      eq(files.category, "entrypoint")
    ));

  const configFilesRows = await db.select({ path: files.path })
    .from(files)
    .where(and(
      eq(files.repositoryId, repositoryId),
      eq(files.category, "config")
    ));

  const symbolRows = await db.select({ kind: symbols.kind })
    .from(symbols)
    .innerJoin(files, eq(symbols.fileId, files.id))
    .where(eq(files.repositoryId, repositoryId));

  const byKind: Record<string, number> = {};
  for (const row of symbolRows) {
    byKind[row.kind] = (byKind[row.kind] || 0) + 1;
  }

  const notAnalyzedRows = await db.select({ path: files.path, skipReason: files.skipReason })
    .from(files)
    .where(and(
      eq(files.repositoryId, repositoryId),
      eq(files.skipped, true)
    ));

  return {
    repository: {
      name: repo.name,
      source: repo.source,
      sourceUrl: repo.sourceUrl,
      commitSha: repo.commitSha,
      createdAt: repo.createdAt.toISOString(),
    },
    stack: {
      primaryLanguage: repo.primaryLanguage,
      framework: repo.framework,
      packageManager: repo.packageManager,
      buildTool: repo.buildTool,
      testFrameworkSummary: repo.testFrameworkSummary,
    },
    entryPoints: entryPointsRows.map(r => ({ path: r.path })),
    configFiles: configFilesRows.map(r => ({ path: r.path })),
    symbols: {
      count: symbolRows.length,
      byKind,
    },
    notAnalyzed: notAnalyzedRows.map(r => ({ path: r.path, reason: r.skipReason })),
  };
}

export async function getTaskPacket(repositoryId: string, task: string): Promise<TaskPacketResult[]> {
  validateTask(task);

  const repo = await db.select().from(repositories).where(eq(repositories.id, repositoryId)).then((r) => r[0]);
  if (!repo) {
    throw new Error("Repository not found");
  }

  const [embedding] = await generateEmbeddings([task.trim()]);
  const vectorStr = formatVectorForQuery(embedding);

  const rows = await db.execute(
    sql`
      SELECT id, file_id, start_line, end_line, cosine_distance(embedding, ${vectorStr}::vector) AS cosine_distance
      FROM ${embeddingChunks}
      WHERE repository_id = ${repositoryId}
      ORDER BY cosine_distance ASC, id ASC
      LIMIT ${TASK_PACKET_K}
    `
  );

  const chunks = rows.map(r => ({
    id: r.id as string,
    fileId: r.file_id as string,
    startLine: r.start_line as number,
    endLine: r.end_line as number,
    cosineDistance: r.cosine_distance as number,
  }));

  const results: TaskPacketResult[] = [];
  for (const chunk of chunks) {
    const content = await reSliceChunkText(chunk.fileId, chunk.startLine, chunk.endLine);
    const [fileRow] = await db.select({ path: files.path }).from(files).where(eq(files.id, chunk.fileId));

    results.push({
      fileId: chunk.fileId,
      path: fileRow?.path ?? "",
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      content,
    });
  }

  return results;
}
