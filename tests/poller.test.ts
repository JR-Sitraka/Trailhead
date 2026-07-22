import { describe, it, expect } from "vitest";
import { db } from "../src/server/db";
import { repositories, analysisJobs } from "../src/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { pollOnce } from "../src/server/poller";

describe("AnalysisJob poller", () => {
  it("picks up a queued job atomically and does not re-pick it on the next tick", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `poller-test-${Date.now()}`,
      source: "zip",
      sourceUrl: null,
      commitSha: null
    }).returning();

    const [job] = await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "queued",
      truncated: false,
      parsingCompletedAt: null,
      embeddingCompletedAt: null
    }).returning();

    await db.execute(sql`
      UPDATE analysis_jobs
      SET status = 'failed'
      WHERE status = 'queued' AND id != ${job.id}
    `);

    const queuedBefore = parseInt((await db.execute(sql`SELECT count(*) FROM analysis_jobs WHERE status = 'queued'`))[0]?.count as string || "0");
    expect(queuedBefore).toBeGreaterThanOrEqual(1);

    await pollOnce();

    const queuedAfter = parseInt((await db.execute(sql`SELECT count(*) FROM analysis_jobs WHERE status = 'queued'`))[0]?.count as string || "0");
    expect(queuedAfter).toBeLessThan(queuedBefore);

    const running = await db.select().from(analysisJobs).where(eq(analysisJobs.id, job.id));
    expect(running[0].status).toBe("running");

    await pollOnce();

    const stillRunning = await db.select().from(analysisJobs).where(eq(analysisJobs.id, job.id));
    expect(stillRunning[0].status).toBe("running");
  });
});
