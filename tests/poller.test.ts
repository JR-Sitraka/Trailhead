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

    const [otherRepo] = await db.insert(repositories).values({
      name: `poller-other-${Date.now()}`,
      source: "zip",
      sourceUrl: null,
      commitSha: null
    }).returning();

    const [otherJob] = await db.insert(analysisJobs).values({
      repositoryId: otherRepo.id,
      status: "queued",
      truncated: false,
      parsingCompletedAt: null,
      embeddingCompletedAt: null
    }).returning();

    await pollOnce(repo.id);

    const running = await db.select().from(analysisJobs).where(eq(analysisJobs.id, job.id));
    expect(running[0].status).toBe("completed");

    const otherStillQueued = await db.select().from(analysisJobs).where(eq(analysisJobs.id, otherJob.id));
    expect(otherStillQueued[0].status).toBe("queued");

    await pollOnce(repo.id);

    const stillRunning = await db.select().from(analysisJobs).where(eq(analysisJobs.id, job.id));
    expect(stillRunning[0].status).toBe("completed");

    const otherStillQueuedAfter = await db.select().from(analysisJobs).where(eq(analysisJobs.id, otherJob.id));
    expect(otherStillQueuedAfter[0].status).toBe("queued");
  });
});
