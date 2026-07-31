import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/db";
import {
  repositories,
  analysisJobs,
  files,
  embeddingChunks,
  llmRequestLogs,
} from "@/server/db/schema";
import { eq, gte, desc, sql } from "drizzle-orm";
import { generateEmbeddings } from "@/server/services/embeddings";
import { processChatQuestion, setNoEvidenceThresholdOverride } from "@/server/services/chat";
import { generateContextSummary } from "@/server/services/export";
import { GET as observabilityGET } from "@/app/api/observability/route";

// OBS-01..OBS-06 — LLM observability (Upgrade item 5).
//
// These are REAL tests: real Groq generation calls, real embeddings, real
// rows in trailhead_test, and (OBS-05) a real induced failure of the
// metrics store. groq-sdk is deliberately NOT mocked in this file.

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const FILE_CONTENT = [
  `import express from "express";`,
  ``,
  `export function startServer(port: number): void {`,
  `  const app = express();`,
  `  app.get("/health", (_req, res) => res.send("ok"));`,
  `  app.listen(port, () => console.log(\`listening on \${port}\`));`,
  `}`,
].join("\n");

function startOfUtcDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function readMetrics(): Promise<{ status: number; body: any }> {
  const resp = await observabilityGET();
  return { status: resp.status, body: await resp.json() };
}

/** Counts today's rows straight from the table — independent of the endpoint. */
async function countTodayRows(): Promise<{ requests: number; failures: number }> {
  const [row] = await db
    .select({
      requests: sql<number>`count(*)::int`,
      failures: sql<number>`count(*) filter (where ${llmRequestLogs.outcome} = 'failure')::int`,
    })
    .from(llmRequestLogs)
    .where(gte(llmRequestLogs.createdAt, startOfUtcDay()));
  return { requests: row?.requests ?? 0, failures: row?.failures ?? 0 };
}

let repositoryId: string;

beforeAll(async () => {
  const [repo] = await db
    .insert(repositories)
    .values({
      name: `obs-${Date.now()}`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "ready",
    })
    .returning();
  repositoryId = repo.id;

  const [job] = await db
    .insert(analysisJobs)
    .values({
      repositoryId: repo.id,
      status: "queued",
      truncated: false,
      parsingCompletedAt: new Date(),
      embeddingCompletedAt: new Date(),
    })
    .returning();

  // category='entrypoint' so Export's REPOSITORY_CONTEXT.md retrieval
  // (retrieveEntryPointChunks) finds real chunks and reaches generation.
  const [f] = await db
    .insert(files)
    .values({
      repositoryId: repo.id,
      path: "src/server.ts",
      size: FILE_CONTENT.length,
      language: "typescript",
      content: FILE_CONTENT,
      category: "entrypoint",
      skipped: false,
      skipReason: null,
    })
    .returning();

  // Real embeddings of the real chunk text — retrieval is genuine, not seeded
  // with synthetic vectors.
  const chunkText = FILE_CONTENT.split("\n").slice(2, 7).join("\n");
  const [embedding] = await generateEmbeddings([chunkText]);

  await db.insert(embeddingChunks).values({
    fileId: f.id,
    repositoryId: repo.id,
    startLine: 3,
    endLine: 7,
    embedding,
  });

  await db.update(analysisJobs).set({ status: "completed" }).where(eq(analysisJobs.id, job.id));
  await db.update(repositories).set({ status: "ready" }).where(eq(repositories.id, repo.id));

  // Guarantees the real Chat path clears its no-evidence gate and reaches
  // generation. Retrieval itself still runs for real; this only relaxes the
  // distance cutoff, using the hook chat.ts already exposes for tests.
  setNoEvidenceThresholdOverride(2.0);
}, 180_000);

afterAll(async () => {
  setNoEvidenceThresholdOverride(null);
  if (repositoryId) {
    await db.delete(repositories).where(eq(repositories.id, repositoryId));
  }
});

describe("LLM observability — real counters, real endpoint", () => {
  if (!GROQ_API_KEY) {
    it.skip("GROQ_API_KEY is not set — skipping real observability tests", () => {});
    return;
  }

  it("OBS-01: a successful Chat turn increments today's request count by exactly 1", async () => {
    const before = await countTodayRows();

    const result = await processChatQuestion("What does startServer do?", [], repositoryId);
    expect(["answered", "no_evidence", "off_topic"]).toContain(result.status);

    const after = await countTodayRows();
    expect(after.requests).toBe(before.requests + 1);
    expect(after.failures).toBe(before.failures);

    // The real DB row exists and carries the configured provider.
    const [latest] = await db
      .select()
      .from(llmRequestLogs)
      .orderBy(desc(llmRequestLogs.createdAt))
      .limit(1);
    expect(latest.outcome).toBe("success");
    expect(latest.provider).toBe("Groq");

    const metrics = await readMetrics();
    expect(metrics.status).toBe(200);
    expect(metrics.body.requests).toBe(after.requests);
    expect(metrics.body.providerStatus).toBe("operational");
    expect(metrics.body.providerName).toBe("Groq");
  }, 180_000);

  it("OBS-02: a real failed generation call increments requests AND failures, status → erroring", async () => {
    const before = await countTodayRows();

    // Real induced failure: a genuinely invalid credential, so the provider
    // itself rejects the call (failure-path-testing.md's "corrupt a real
    // credential"). Not a mock, not a debug-only bypass.
    const realKey = process.env.GROQ_API_KEY;
    process.env.GROQ_API_KEY = "gsk_invalid_key_for_obs02_failure_path";
    try {
      await expect(
        processChatQuestion("What does startServer do?", [], repositoryId)
      ).rejects.toThrow();
    } finally {
      process.env.GROQ_API_KEY = realKey;
    }

    const after = await countTodayRows();
    expect(after.requests).toBe(before.requests + 1);
    expect(after.failures).toBe(before.failures + 1);

    const metrics = await readMetrics();
    expect(metrics.status).toBe(200);
    expect(metrics.body.failures).toBe(after.failures);
    expect(metrics.body.providerStatus).toBe("erroring");
  }, 180_000);

  it("OBS-06: status reflects the latest outcome — success after failure → operational", async () => {
    // Runs directly after OBS-02, so the store's latest row is a failure.
    const beforeMetrics = await readMetrics();
    expect(beforeMetrics.body.providerStatus).toBe("erroring");

    await processChatQuestion("What does startServer do?", [], repositoryId);

    const metrics = await readMetrics();
    expect(metrics.status).toBe(200);
    expect(metrics.body.providerStatus).toBe("operational");
    // The old failure is still counted — only the status reflects latest.
    expect(metrics.body.failures).toBeGreaterThanOrEqual(1);
  }, 180_000);

  it("OBS-03: an Export REPOSITORY_CONTEXT.md generation increments the same counters", async () => {
    const before = await countTodayRows();

    const summary = await generateContextSummary(repositoryId);
    // Proves the call actually reached the provider through the shared
    // abstraction rather than short-circuiting to the deterministic fallback.
    expect(summary.generatedVia).toBe("llm");

    const after = await countTodayRows();
    expect(after.requests).toBe(before.requests + 1);
  }, 180_000);

  it("OBS-04: with zero requests today, the endpoint returns 0 / 0 / unknown", async () => {
    // Clears only today's llm_request_logs rows in trailhead_test — no other
    // table is touched. Needed because 'today' is a real UTC-day window.
    await db.delete(llmRequestLogs).where(gte(llmRequestLogs.createdAt, startOfUtcDay()));

    const metrics = await readMetrics();
    expect(metrics.status).toBe(200);
    expect(metrics.body).toEqual({
      requests: 0,
      failures: 0,
      providerStatus: "unknown",
      providerName: "Groq",
    });
  }, 60_000);

  it("OBS-05: with the metrics store unreachable, Chat still succeeds and metrics report unavailable", async () => {
    // Real induced dependency failure: the table is genuinely renamed away, so
    // both the counter write and the endpoint read hit a real Postgres error.
    await db.execute(sql`ALTER TABLE llm_request_logs RENAME TO llm_request_logs_obs05`);

    try {
      // The NFR under test: counting must never break generation.
      const result = await processChatQuestion("What does startServer do?", [], repositoryId);
      expect(["answered", "no_evidence", "off_topic"]).toContain(result.status);

      // The endpoint fails cleanly with a 500 — which is what drives the
      // panel's metrics-unavailable state, not fake zeros.
      const metrics = await readMetrics();
      expect(metrics.status).toBe(500);
    } finally {
      await db.execute(sql`ALTER TABLE llm_request_logs_obs05 RENAME TO llm_request_logs`);
    }

    // Real recovery: normal operation resumes once the failure is lifted.
    const before = await countTodayRows();
    await processChatQuestion("What does startServer do?", [], repositoryId);
    const after = await countTodayRows();
    expect(after.requests).toBe(before.requests + 1);

    const recovered = await readMetrics();
    expect(recovered.status).toBe(200);
    expect(recovered.body.providerStatus).toBe("operational");
  }, 240_000);
});
