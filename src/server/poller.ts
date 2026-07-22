import { db } from "./db";
import { analysisJobs } from "./db/schema";
import { eq, sql } from "drizzle-orm";

// Placeholder for Steps B/C/D — does not complete jobs or touch
// parsingCompletedAt / embeddingCompletedAt. A job that reaches this
// function will sit at status='running' until a later phase sets it.
async function runAnalysisPhases(jobId: string): Promise<void> {
  console.log(`[poller] runAnalysisPhases stub called for job ${jobId} — no real work yet`);
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
