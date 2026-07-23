import { db } from "./db";
import { analysisJobs, embeddingChunks, files, repositories, symbols } from "./db/schema";
import { eq, sql } from "drizzle-orm";
import { extractSymbols, type ExtractedSymbol } from "./services/symbols";
import { computeChunkRanges, sliceChunkText } from "./services/embeddingChunker";
import { generateEmbeddings } from "./services/embeddings";

// Scope limit (stated, not silently dropped): function kind only covers
// top-level function declarations, top-level const/let arrow-function and
// function-expression assignments, and class methods. Deeply nested or
// inline anonymous functions are intentionally not extracted.
export async function runAnalysisPhases(jobId: string): Promise<void> {
  const [job] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, jobId));
  if (!job) {
    console.error(`[poller] runAnalysisPhases: job ${jobId} not found`);
    return;
  }

  const repositoryId = job.repositoryId;
  if (!repositoryId) {
    console.error(`[poller] runAnalysisPhases: job ${jobId} has no repositoryId`);
    return;
  }

  const jobFiles = await db.select().from(files).where(
    sql`${files.repositoryId} = ${repositoryId} AND ${files.skipped} = false AND ${files.content} IS NOT NULL AND ${files.language} IN ('typescript', 'javascript')`
  ).orderBy(files.path);

  const allSymbols: Array<{ fileId: string; kind: "function" | "export" | "class" | "interface" | "import"; name: string; startLine: number; endLine: number }> = [];

  for (const file of jobFiles) {
    try {
      const extracted = await extractSymbols(file.content, file.path, file.language!);
      for (const s of extracted) {
        allSymbols.push({
          fileId: file.id,
          kind: s.kind,
          name: s.name,
          startLine: s.startLine,
          endLine: s.endLine
        });
      }
    } catch (e) {
      console.error(`[poller] extractSymbols failed for file ${file.path} in job ${jobId}:`, e);
    }
  }

  if (allSymbols.length > 0) {
    await db.insert(symbols).values(allSymbols);
  }

  await db.update(analysisJobs).set({ parsingCompletedAt: new Date() }).where(eq(analysisJobs.id, jobId));

  await runEmbeddingPhase(jobId, repositoryId);
}

async function runEmbeddingPhase(jobId: string, repositoryId: string): Promise<void> {
  const allFiles = await db.select().from(files).where(
    sql`${files.repositoryId} = ${repositoryId} AND ${files.skipped} = false AND ${files.content} IS NOT NULL`
  ).orderBy(files.path);

  let embeddingCompletedAt = new Date();

  for (const file of allFiles) {
    try {
      const symbolRows = await db.select().from(symbols).where(eq(symbols.fileId, file.id));
      const ranges = computeChunkRanges(file.content!, symbolRows as Array<ExtractedSymbol & { kind: string }>);

      const chunkTexts = ranges.map((range) => sliceChunkText(file.content!, range.startLine, range.endLine));
      const embeddings = await generateEmbeddings(chunkTexts);

      const rows = ranges.map((range, idx) => ({
        repositoryId: file.repositoryId,
        fileId: file.id,
        startLine: range.startLine,
        endLine: range.endLine,
        embedding: embeddings[idx]
      }));

      if (rows.length > 0) {
        await db.insert(embeddingChunks).values(rows);
      }
    } catch (e) {
      console.error(`[poller] embedding failed for file ${file.path} in job ${jobId}:`, e);
    }
  }

  await db.update(analysisJobs).set({ embeddingCompletedAt }).where(eq(analysisJobs.id, jobId));

  // Known gap: Reanalysis is not yet implemented. When it is built, this
  // pipeline must first delete all existing EmbeddingChunk (and File/Symbol)
  // rows for this repository before inserting new ones, otherwise stale
  // chunks from a prior successful job will coexist with new ones.
  const [updatedJob] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, jobId));
  if (updatedJob && updatedJob.parsingCompletedAt && updatedJob.embeddingCompletedAt) {
    await db.update(analysisJobs).set({ status: "completed" }).where(eq(analysisJobs.id, jobId));
    await db.update(repositories).set({ status: "ready" }).where(eq(repositories.id, repositoryId));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pollOnce(scopeRepositoryId?: string): Promise<void> {
  try {
    const [job] = await db.execute(
      sql`
        UPDATE ${analysisJobs}
        SET status = 'running', updated_at = now()
        WHERE id = (
          SELECT id FROM ${analysisJobs}
           WHERE status = 'queued'
             ${scopeRepositoryId ? sql`AND repository_id = ${scopeRepositoryId}` : sql``}
           ORDER BY created_at ASC
           LIMIT 1
           FOR UPDATE SKIP LOCKED
        )
        RETURNING id
      `
    );

    if (!job) return;

    const jobId = job.id as string;

    try {
      await runAnalysisPhases(jobId);
    } catch (e) {
      console.error(`[poller] runAnalysisPhases failed for job ${jobId}:`, e);
      await db.update(analysisJobs).set({ status: "failed" }).where(eq(analysisJobs.id, jobId));
    }
  } catch (e) {
    console.error("[poller] pollOnce error:", e);
  }
}

export function startPoller(intervalMs = 10000): (() => void) | null {
  if (typeof window !== "undefined") return null;

  console.log(`[poller] started with interval ${intervalMs}ms`);
  let running = true;
  let timer: NodeJS.Timeout | undefined;

  async function tick() {
    if (!running) return;
    await pollOnce();
    timer = setTimeout(tick, intervalMs);
  }

  tick();

  return () => {
    running = false;
    if (timer) clearTimeout(timer);
  };
}
