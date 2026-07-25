import { db } from "@/server/db";
import { repositories, files, symbols, embeddingChunks } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { embedQuestion, retrieveChunks } from "@/server/services/chat";
import { generateEmbeddings } from "./embeddings";
import Groq from "groq-sdk";

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

export interface ContextSummaryResponse {
  content: string;
  generatedVia: "llm" | "deterministic-fallback";
  citations: Array<{ label: number; fileId: string; path: string; startLine: number; endLine: number }>;
}

const GROQ_MODEL = "llama-3.3-70b-versatile";

const CONTEXT_SUMMARY_K = 8;

export async function retrieveEntryPointChunks(repositoryId: string) {
  const entrypointFileRows = await db.select({ id: files.id })
    .from(files)
    .where(and(
      eq(files.repositoryId, repositoryId),
      eq(files.category, "entrypoint")
    ));

  const entrypointFileIds = entrypointFileRows.map(r => r.id);

  let chunks: Array<{ id: string; fileId: string; startLine: number; endLine: number }> = [];

  if (entrypointFileIds.length > 0) {
    const epChunks = await db.select({
      id: embeddingChunks.id,
      fileId: embeddingChunks.fileId,
      startLine: embeddingChunks.startLine,
      endLine: embeddingChunks.endLine,
    })
      .from(embeddingChunks)
      .innerJoin(files, eq(embeddingChunks.fileId, files.id))
      .where(and(
        eq(embeddingChunks.repositoryId, repositoryId),
        eq(files.category, "entrypoint")
      ))
      .limit(CONTEXT_SUMMARY_K);

    chunks = epChunks;
  }

  if (chunks.length < 5) {
    const importSymbolRows = await db.select({ fileId: symbols.fileId, count: sql<number>`COUNT(*)` })
      .from(symbols)
      .innerJoin(files, eq(symbols.fileId, files.id))
      .where(and(
        eq(files.repositoryId, repositoryId),
        eq(symbols.kind, "import")
      ))
      .groupBy(symbols.fileId)
      .orderBy(sql`count DESC`)
      .limit(1);

    if (importSymbolRows.length > 0) {
      const centralFileId = importSymbolRows[0].fileId;
      const existingFileIds = new Set(chunks.map(c => c.fileId));
      if (!existingFileIds.has(centralFileId)) {
        const extraChunks = await db.select({
          id: embeddingChunks.id,
          fileId: embeddingChunks.fileId,
          startLine: embeddingChunks.startLine,
          endLine: embeddingChunks.endLine,
        })
          .from(embeddingChunks)
          .where(and(
            eq(embeddingChunks.repositoryId, repositoryId),
            eq(embeddingChunks.fileId, centralFileId)
          ))
          .limit(CONTEXT_SUMMARY_K - chunks.length);

        chunks = [...chunks, ...extraChunks];
      }
    }
  }

  return chunks.map(c => ({
    id: c.id,
    fileId: c.fileId,
    startLine: c.startLine,
    endLine: c.endLine,
  }));
}

export function buildDeterministicFallback(contextJson: ExportJsonResponse): string {
  const lines: string[] = [];

  lines.push(`# ${contextJson.repository.name}`);
  lines.push("");
  lines.push(`> **Source:** ${contextJson.repository.source}${contextJson.repository.sourceUrl ? ` — ${contextJson.repository.sourceUrl}` : ""}`);
  if (contextJson.repository.commitSha) {
    lines.push(`> **Commit:** ${contextJson.repository.commitSha}`);
  }
  lines.push("");

  const stackParts: string[] = [];
  if (contextJson.stack.primaryLanguage) {
    stackParts.push(`primary language is **${contextJson.stack.primaryLanguage}**`);
  } else {
    stackParts.push(`primary language is not specified`);
  }
  if (contextJson.stack.framework) {
    stackParts.push(`uses the **${contextJson.stack.framework}** framework`);
  } else {
    stackParts.push(`framework is not specified`);
  }
  if (contextJson.stack.packageManager) {
    stackParts.push(`package manager is **${contextJson.stack.packageManager}**`);
  } else {
    stackParts.push(`package manager is not specified`);
  }
  if (contextJson.stack.buildTool) {
    stackParts.push(`build tool is **${contextJson.stack.buildTool}**`);
  } else {
    stackParts.push(`build tool is not specified`);
  }
  if (contextJson.stack.testFrameworkSummary) {
    stackParts.push(`test framework summary: **${contextJson.stack.testFrameworkSummary}**`);
  } else {
    stackParts.push(`test framework summary is not specified`);
  }

  lines.push("## Stack");
  lines.push("");
  lines.push(`This is a repository ${stackParts.join("; ")}.`);
  lines.push("");

  if (contextJson.entryPoints.length > 0) {
    lines.push("## Entry Points");
    lines.push("");
    for (const ep of contextJson.entryPoints) {
      lines.push(`- \`${ep.path}\``);
    }
    lines.push("");
  }

  if (contextJson.configFiles.length > 0) {
    lines.push("## Configuration Files");
    lines.push("");
    for (const cf of contextJson.configFiles) {
      lines.push(`- \`${cf.path}\``);
    }
    lines.push("");
  }

  if (contextJson.symbols.count > 0) {
    lines.push("## Symbols");
    lines.push("");
    const byKind = contextJson.symbols.byKind;
    const parts: string[] = [];
    for (const [kind, count] of Object.entries(byKind)) {
      parts.push(`${count} ${kind}(s)`);
    }
    lines.push(`Total symbols: **${contextJson.symbols.count}** (${parts.join(", ")}).`);
    lines.push("");
  }

  if (contextJson.notAnalyzed.length > 0) {
    lines.push("## Not Analyzed");
    lines.push("");
    for (const na of contextJson.notAnalyzed) {
      const reason = na.reason ? ` (${na.reason})` : "";
      lines.push(`- \`${na.path}\`${reason}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

export async function generateContextSummary(repositoryId: string): Promise<ContextSummaryResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const contextJson = await getExportJson(repositoryId);
    return { content: buildDeterministicFallback(contextJson), generatedVia: "deterministic-fallback", citations: [] };
  }

  const chunks = await retrieveEntryPointChunks(repositoryId);

  if (chunks.length === 0) {
    const contextJson = await getExportJson(repositoryId);
    return { content: buildDeterministicFallback(contextJson), generatedVia: "deterministic-fallback", citations: [] };
  }

  const contextJson = await getExportJson(repositoryId);

  const chunksWithText = await Promise.all(
    chunks.map(async (chunk) => {
      const text = await reSliceChunkText(chunk.fileId, chunk.startLine, chunk.endLine);
      const [fileRow] = await db.select({ path: files.path }).from(files).where(eq(files.id, chunk.fileId));
      return { ...chunk, text, path: fileRow?.path ?? "" };
    })
  );

  const labeledEvidence = chunksWithText
    .map((chunk, i) => `[CHUNK ${i + 1}] file=${chunk.fileId} lines ${chunk.startLine}-${chunk.endLine}:\n${chunk.text}`)
    .join("\n\n");

  const prompt =
    `You are a strict repository documentation assistant. Synthesize a concise, evidence-grounded prose summary of this repository from the provided evidence chunks. ` +
    `Place each citation label in square brackets IMMEDIATELY after the relevant claim in your prose. ` +
    `Do NOT collect citations into a separate list at the end. Every bracket label that appears in your answer text MUST also appear in the citations array. ` +
    `The labels are 1-indexed mapping to the chunks in order.\n\n` +
    `Respond with JSON in exactly this shape:\n` +
    `{ "status": "answered", "answer": "<your prose summary with inline bracket citations>", "citations": [<integer labels of chunks you cited>] }\n` +
    `OR, if you cannot produce a grounded summary from the evidence: ` +
    `{ "status": "no_evidence", "answer": "<explanation>", "citations": [] }\n\n` +
    `Evidence chunks:\n${labeledEvidence}\n\nRespond now with only a JSON object.`;

  const ai = new Groq({ apiKey });

  try {
    const chatResponse = (await ai.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    })) as any;

    const rawText = chatResponse.choices?.[0]?.message?.content;
    if (typeof rawText !== "string" || !rawText.trim()) {
      return { content: buildDeterministicFallback(contextJson), generatedVia: "deterministic-fallback", citations: [] };
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText) as { status: string; answer: string; citations: number[] };
    } catch {
      return { content: buildDeterministicFallback(contextJson), generatedVia: "deterministic-fallback", citations: [] };
    }

    if (!parsed || parsed.status !== "answered") {
      return { content: buildDeterministicFallback(contextJson), generatedVia: "deterministic-fallback", citations: [] };
    }

    const citations: number[] = parsed.citations ?? [];
    const validLabels = new Set(Array.from({ length: chunks.length }, (_, i) => i + 1));
    const allValid = citations.every(label => Number.isInteger(label) && validLabels.has(label));

    if (!allValid) {
      return { content: buildDeterministicFallback(contextJson), generatedVia: "deterministic-fallback", citations: [] };
    }

    const resolvedCitations = citations
      .map(label => ({ label, chunk: chunksWithText[label - 1] }))
      .filter(({ chunk }) => chunk)
      .map(({ label, chunk }) => ({
        label,
        fileId: chunk.fileId,
        path: chunk.path,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
      }));

    return { content: parsed.answer ?? "", generatedVia: "llm", citations: resolvedCitations };
  } catch {
    return { content: buildDeterministicFallback(contextJson), generatedVia: "deterministic-fallback", citations: [] };
  }
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
