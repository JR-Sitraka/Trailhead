import { describe, it, expect, vi } from "vitest";
import postgres from "postgres";
import { db } from "../src/server/db";
import { repositories, analysisJobs, files, embeddingChunks } from "../src/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { runAnalysisPhases } from "../src/server/poller";

function getRawDb() {
  const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("No database URL");
  return postgres(connectionString, { prepare: false });
}

describe("embedding pipeline e2e", () => {
  it("processes a TS file and a non-TS file, stores real 384-dim embeddings, and transitions job to completed and repo to ready", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `embed-e2e-${Date.now()}`,
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

    const tsContent = `function add(a: number, b: number): number {\n  return a + b;\n}\n\nclass Calculator {\n  multiply(x: number, y: number): number {\n    return x * y;\n  }\n}\n\nexport default Calculator;\n`;

    const mdContent = Array.from({ length: 30 }, (_, i) => `Line ${i + 1} of README`).join("\n") + "\n";

    const [tsFile] = await db.insert(files).values({
      repositoryId: repo.id,
      path: "src/calculator.ts",
      size: tsContent.length,
      language: "typescript",
      content: tsContent,
      category: null,
      skipped: false,
      skipReason: null
    }).returning();

    const [mdFile] = await db.insert(files).values({
      repositoryId: repo.id,
      path: "README.md",
      size: mdContent.length,
      language: null,
      content: mdContent,
      category: null,
      skipped: false,
      skipReason: null
    }).returning();

    await runAnalysisPhases(job.id);

    const [updatedJob] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, job.id));
    expect(updatedJob.parsingCompletedAt).not.toBeNull();
    expect(updatedJob.embeddingCompletedAt).not.toBeNull();
    expect(updatedJob.status).toBe("completed");

    const [updatedRepo] = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(updatedRepo.status).toBe("ready");

    const tsChunks = await db.select().from(embeddingChunks).where(eq(embeddingChunks.fileId, tsFile.id));
    expect(tsChunks.length).toBeGreaterThan(0);
    const tsSmallChunks = tsChunks.filter((c) => c.endLine - c.startLine <= 5);
    expect(tsSmallChunks.length).toBeGreaterThan(0);
    for (const chunk of tsChunks) {
      expect(chunk.embedding).toHaveLength(384);
    }

    const mdChunks = await db.select().from(embeddingChunks).where(eq(embeddingChunks.fileId, mdFile.id));
    expect(mdChunks.length).toBeGreaterThan(0);
    for (const chunk of mdChunks) {
      expect(chunk.embedding).toHaveLength(384);
    }

    const allRepoChunks = await db.select().from(embeddingChunks).where(eq(embeddingChunks.repositoryId, repo.id));
    const first = allRepoChunks[0];
    if (!first) throw new Error("no chunks");
    const queryVec = Array.from(first.embedding as number[]);

    const rawDb = getRawDb();
    try {
      const vecStr = "[" + queryVec.map((v) => v.toFixed(6)).join(",") + "]";
      const explainSql = `SET enable_seqscan = OFF; EXPLAIN SELECT id FROM embedding_chunks WHERE repository_id = '${repo.id}' ORDER BY embedding <=> '${vecStr}'::vector(384) ASC LIMIT 1`;
      const explainRows = await rawDb.unsafe(explainSql);
      const explainText = JSON.stringify(explainRows);
      expect(explainText).toContain("Index Scan using embedding_chunks_embedding_idx");
    } finally {
      await rawDb.end();
    }
  }, 300000);

  it("a file that fails embedding generation doesn't crash the whole job", async () => {
    vi.resetModules();
    vi.doMock("../src/server/services/embeddings", async () => {
      const actual = await vi.importActual("../src/server/services/embeddings");
      return {
        ...actual,
      generateEmbeddings: vi.fn().mockImplementation(async (texts: string[]) => {
        if (texts.length > 0 && texts[0].includes("bad")) {
          throw new Error("simulated embedding failure");
        }
        return (actual as any).generateEmbeddings(texts);
      })
      };
    });

    const { runAnalysisPhases: mockedRunAnalysisPhases } = await import("../src/server/poller");

    const [repo] = await db.insert(repositories).values({
      name: `embed-fail-${Date.now()}`,
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

    const goodContent = "function good() { return 1; }\n";
    const badContent = "function bad() { return 2; }\n";

    const [goodFile] = await db.insert(files).values({
      repositoryId: repo.id,
      path: "good.ts",
      size: goodContent.length,
      language: "typescript",
      content: goodContent,
      category: null,
      skipped: false,
      skipReason: null
    }).returning();

    const [badFile] = await db.insert(files).values({
      repositoryId: repo.id,
      path: "bad.ts",
      size: badContent.length,
      language: "typescript",
      content: badContent,
      category: null,
      skipped: false,
      skipReason: null
    }).returning();

    await mockedRunAnalysisPhases(job.id);

    const [updatedJob] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, job.id));
    expect(updatedJob.embeddingCompletedAt).not.toBeNull();
    expect(updatedJob.status).toBe("completed");

    const [updatedRepo] = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(updatedRepo.status).toBe("ready");

    const goodChunks = await db.select().from(embeddingChunks).where(eq(embeddingChunks.fileId, goodFile.id));
    expect(goodChunks.length).toBeGreaterThan(0);

    const badChunks = await db.select().from(embeddingChunks).where(eq(embeddingChunks.fileId, badFile.id));
    expect(badChunks.length).toBe(0);

    vi.restoreAllMocks();
  }, 300000);
});
