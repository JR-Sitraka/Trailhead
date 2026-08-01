import { db } from "./db";
import { analysisJobs, embeddingChunks, files, repositories, symbols } from "./db/schema";
import { eq, sql } from "drizzle-orm";
import { extractSymbols, type ExtractedSymbol } from "./services/symbols";
import { computeChunkRanges, sliceChunkText } from "./services/embeddingChunker";
import { generateEmbeddings } from "./services/embeddings";
import { detectStackFacts } from "./services/stackFacts";

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

  await db.delete(symbols).where(
    sql`${symbols.fileId} IN (SELECT ${files.id} FROM ${files} WHERE ${files.repositoryId} = ${repositoryId})`
  );
  await db.delete(embeddingChunks).where(eq(embeddingChunks.repositoryId, repositoryId));

  const jobFiles = await db.select().from(files).where(
    sql`${files.repositoryId} = ${repositoryId} AND ${files.skipped} = false AND ${files.content} IS NOT NULL AND ${files.language} IN ('typescript', 'javascript')`
  ).orderBy(files.path);

  const allFiles = await db.select().from(files).where(
    sql`${files.repositoryId} = ${repositoryId}`
  );

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

  const stackFacts = detectStackFacts(
    allFiles.map(f => ({
      path: f.path,
      language: f.language,
      skipped: f.skipped,
      content: f.content
    }))
  );

  await db.update(repositories).set({
    primaryLanguage: stackFacts.primaryLanguage,
    framework: stackFacts.framework,
    packageManager: stackFacts.packageManager,
    buildTool: stackFacts.buildTool,
    testFrameworkSummary: stackFacts.testFrameworkSummary
  }).where(eq(repositories.id, repositoryId));

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
  // Zero-file guard: a repository with no analyzable File rows has nothing to
  // report on, and marking it 'ready' is a false success (sindresorhus/boxen
  // reached 'ready' with zero files this way after a failed import). Fail the
  // job instead — 'ready' must mean real, queryable content exists.
  const analyzableFiles = await db.select().from(files).where(
    sql`${files.repositoryId} = ${repositoryId} AND ${files.skipped} = false AND ${files.content} IS NOT NULL`
  );
  if (analyzableFiles.length === 0) {
    console.error(`[poller] job ${jobId}: zero analyzable files for repo ${repositoryId} — marking failed instead of ready`);
    await db.update(analysisJobs).set({ status: "failed" }).where(eq(analysisJobs.id, jobId));
    await db.update(repositories).set({ status: "failed" }).where(eq(repositories.id, repositoryId));
    return;
  }

  const [updatedJob] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, jobId));
  if (updatedJob && updatedJob.parsingCompletedAt && updatedJob.embeddingCompletedAt) {
    await db.update(analysisJobs).set({ status: "completed" }).where(eq(analysisJobs.id, jobId));
    await db.update(repositories).set({ status: "ready" }).where(eq(repositories.id, repositoryId));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Reconcile orphaned repositories: a repository sitting in 'queued' or
// 'analyzing' with no live ('queued'/'running') job can never make progress —
// nothing will ever pick it up — so it polls forever in the UI. This is
// sindresorhus/got's state (repo row surviving with its analysis job gone).
// Runs at the start of each tick, before any job pickup, so it can never race
// an analysis this poller is itself in the middle of running.
// Takes the same optional scope as pollOnce: unscoped in production (the real
// poller sweeps everything), scoped in tests so a run can't disturb unrelated
// fixture rows.
export async function reconcileOrphanedRepositories(scopeRepositoryId?: string): Promise<string[]> {
  const rows = await db.execute(
    sql`
      UPDATE ${repositories}
         SET status = 'failed', updated_at = now()
       WHERE status IN ('queued', 'analyzing')
         ${scopeRepositoryId ? sql`AND ${repositories.id} = ${scopeRepositoryId}` : sql``}
         AND NOT EXISTS (
           SELECT 1 FROM ${analysisJobs}
            WHERE ${analysisJobs.repositoryId} = ${repositories.id}
              AND ${analysisJobs.status} IN ('queued', 'running')
         )
      RETURNING id
    `
  );

  const ids = (rows as unknown as Array<{ id: string }>).map((r) => r.id);
  for (const id of ids) {
    console.error(`[poller] reconciled orphaned repository ${id}: no live analysis job — marking failed`);
  }
  return ids;
}

  export async function pollOnce(scopeRepositoryId?: string): Promise<void> {
    try {
      await reconcileOrphanedRepositories(scopeRepositoryId);
      const [job] = await db.execute(
        sql`
          UPDATE ${analysisJobs}
          SET status = 'running', updated_at = now()
          WHERE id = (
            SELECT id FROM ${analysisJobs}
             WHERE status = 'queued'
               ${scopeRepositoryId ? sql`AND ${analysisJobs.repositoryId} = ${scopeRepositoryId}` : sql``}
             ORDER BY created_at ASC
             LIMIT 1
             FOR UPDATE SKIP LOCKED
          )
          RETURNING id, repository_id
        `
      );

      if (!job) {
        console.log("[poller] pollOnce: no queued job picked up");
        return;
      }

      const jobId = job.id as string;
      const repositoryId = (job as any).repository_id as string;
      console.log("[poller] picked up job", jobId, "for repo", repositoryId);

      await db.update(repositories).set({ status: "analyzing" }).where(eq(repositories.id, repositoryId));
      console.log("[poller] set repo to analyzing");

      try {
        await runAnalysisPhases(jobId);
        console.log("[poller] runAnalysisPhases completed");
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
