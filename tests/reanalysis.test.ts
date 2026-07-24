import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { db } from "../src/server/db";
import {
  repositories,
  analysisJobs,
  files,
  symbols,
  embeddingChunks
} from "../src/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { GET as GetRepos } from "../src/app/api/repositories/route";
import { GET as GetRepo, DELETE as DeleteRepo } from "../src/app/api/repositories/[id]/route";
import { POST as ReanalyzeRepo } from "../src/app/api/repositories/[id]/reanalyze/route";
import { pollOnce } from "../src/server/poller";

const PREFIX = `reanalysis-${Date.now()}`;

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------
async function getRepos(): Promise<Response> {
  const request = new NextRequest("http://localhost/api/repositories");
  return GetRepos();
}

async function getRepo(id: string): Promise<Response> {
  const request = new NextRequest(`http://localhost/api/repositories/${id}`);
  return GetRepo(request, { params: { id } });
}

async function deleteRepo(id: string): Promise<Response> {
  const request = new NextRequest(`http://localhost/api/repositories/${id}`, { method: "DELETE" });
  return DeleteRepo(request, { params: { id } });
}

async function reanalyzeRepo(id: string): Promise<Response> {
  const request = new NextRequest(`http://localhost/api/repositories/${id}/reanalyze`, { method: "POST" });
  return ReanalyzeRepo(request, { params: { id } });
}

// ---------------------------------------------------------------------------
// Task 1 — AnalysisJob lookup ordering
// ---------------------------------------------------------------------------
describe("Task 1: AnalysisJob lookup ordering", () => {
  it("GET /api/repositories returns the latest job per repo when multiple jobs exist", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-list-order`,
      source: "zip",
      sourceUrl: null,
      commitSha: null
    }).returning();

    const [olderJob] = await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "completed",
      truncated: false,
      parsingCompletedAt: new Date("2024-01-01T00:00:00Z"),
      embeddingCompletedAt: new Date("2024-01-01T00:00:00Z")
    }).returning();

    await new Promise((r) => setTimeout(r, 50));

    const [newerJob] = await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "queued",
      truncated: false,
      parsingCompletedAt: null,
      embeddingCompletedAt: null
    }).returning();

    const response = await getRepos();
    expect(response.status).toBe(200);
    const body = await response.json();
    const entry = body.find((r: any) => r.id === repo.id);
    expect(entry).toBeDefined();
    expect(entry.analysisJob).not.toBeNull();
    expect(entry.analysisJob.id).toBe(newerJob.id);
  });

  it("GET /api/repositories/:id returns the latest job when multiple jobs exist", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-detail-order`,
      source: "zip",
      sourceUrl: null,
      commitSha: null
    }).returning();

    const [olderJob] = await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "completed",
      truncated: false,
      parsingCompletedAt: new Date("2024-01-01T00:00:00Z"),
      embeddingCompletedAt: new Date("2024-01-01T00:00:00Z")
    }).returning();

    await new Promise((r) => setTimeout(r, 50));

    const [newerJob] = await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "queued",
      truncated: false,
      parsingCompletedAt: null,
      embeddingCompletedAt: null
    }).returning();

    const response = await getRepo(repo.id);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.analysisJob).not.toBeNull();
    expect(body.analysisJob.id).toBe(newerJob.id);
  });

  it("returns null analysisJob for a repo with no jobs", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-no-job`,
      source: "zip",
      sourceUrl: null,
      commitSha: null
    }).returning();

    const response = await getRepo(repo.id);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.analysisJob).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Task 2 — DELETE /api/repositories/:id
// ---------------------------------------------------------------------------
describe("Task 2: DELETE /api/repositories/:id", () => {
  it("returns 404 for a nonexistent repository", async () => {
    const response = await deleteRepo("00000000-0000-0000-0000-000000000000");
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Repository not found");
  });

  it("returns 409 when the latest job is queued", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-del-queued`,
      source: "zip",
      sourceUrl: null,
      commitSha: null
    }).returning();

    await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "queued",
      truncated: false
    });

    const response = await deleteRepo(repo.id);
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toContain("analysis is in progress");

    const stillThere = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(stillThere.length).toBe(1);
  });

  it("returns 409 when the latest job is running", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-del-running`,
      source: "zip",
      sourceUrl: null,
      commitSha: null
    }).returning();

    await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "running",
      truncated: false
    });

    const response = await deleteRepo(repo.id);
    expect(response.status).toBe(409);
  });

  it("allows deletion when the latest job is completed", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-del-completed`,
      source: "zip",
      sourceUrl: null,
      commitSha: null
    }).returning();

    const [job] = await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "completed",
      truncated: false,
      parsingCompletedAt: new Date(),
      embeddingCompletedAt: new Date()
    }).returning();

    const [file] = await db.insert(files).values({
      repositoryId: repo.id,
      path: "src/index.ts",
      size: 10,
      language: "typescript",
      content: "const x = 1;",
      skipped: false,
      skipReason: null
    }).returning();

    await db.insert(symbols).values({
      fileId: file.id,
      kind: "function",
      name: "foo",
      startLine: 1,
      endLine: 1
    });

    await db.insert(embeddingChunks).values({
      fileId: file.id,
      repositoryId: repo.id,
      startLine: 1,
      endLine: 1,
      embedding: new Array(384).fill(0)
    });

    const response = await deleteRepo(repo.id);
    expect(response.status).toBe(204);

    const remainingRepos = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(remainingRepos.length).toBe(0);

    const remainingFiles = await db.select().from(files).where(eq(files.repositoryId, repo.id));
    expect(remainingFiles.length).toBe(0);

    const remainingSymbols = await db.select().from(symbols).where(eq(symbols.fileId, file.id));
    expect(remainingSymbols.length).toBe(0);

    const remainingChunks = await db.select().from(embeddingChunks).where(eq(embeddingChunks.repositoryId, repo.id));
    expect(remainingChunks.length).toBe(0);

    const remainingJobs = await db.select().from(analysisJobs).where(eq(analysisJobs.repositoryId, repo.id));
    expect(remainingJobs.length).toBe(0);
  });

  it("allows deletion when the latest job is failed", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-del-failed`,
      source: "zip",
      sourceUrl: null,
      commitSha: null
    }).returning();

    await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "failed",
      truncated: false
    });

    const response = await deleteRepo(repo.id);
    expect(response.status).toBe(204);
  });
});

// ---------------------------------------------------------------------------
// Task 3 — POST /api/repositories/:id/reanalyze
// ---------------------------------------------------------------------------
describe("Task 3: POST /api/repositories/:id/reanalyze", () => {
  it("returns 404 for a nonexistent repository", async () => {
    const response = await reanalyzeRepo("00000000-0000-0000-0000-000000000000");
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Repository not found");
  });

  it("returns 409 when the latest job is queued", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-rean-queued`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "ready"
    }).returning();

    await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "queued",
      truncated: false
    });

    const response = await reanalyzeRepo(repo.id);
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toContain("already in progress");
  });

  it("returns 409 when the latest job is running", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-rean-running`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "ready"
    }).returning();

    await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "running",
      truncated: false
    });

    const response = await reanalyzeRepo(repo.id);
    expect(response.status).toBe(409);
  });

  it("creates a new queued job and leaves repo status unchanged while job is queued", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-rean-ok`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "ready"
    }).returning();

    const [oldJob] = await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "completed",
      truncated: false,
      parsingCompletedAt: new Date("2024-01-01T00:00:00Z"),
      embeddingCompletedAt: new Date("2024-01-01T00:00:00Z")
    }).returning();

    const response = await reanalyzeRepo(repo.id);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.repositoryId).toBe(repo.id);
    expect(body.status).toBe("queued");
    expect(body.truncated).toBe(false);
    expect(body.parsingCompletedAt).toBeNull();
    expect(body.embeddingCompletedAt).toBeNull();

    const [updatedRepo] = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(updatedRepo.status).toBe("ready");

    const allJobs = await db.select().from(analysisJobs).where(eq(analysisJobs.repositoryId, repo.id));
    expect(allJobs.length).toBe(2);
  });

  it("allows reanalyze after a previous failed job", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-rean-after-fail`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "failed"
    }).returning();

    await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "failed",
      truncated: false
    });

    const response = await reanalyzeRepo(repo.id);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.status).toBe("queued");

    const [afterReanalyze] = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(afterReanalyze.status).toBe("failed");
  });
});

describe("Repository.status transition timing — reanalyze and poller", () => {
  it("reanalyze leaves repo in prior state; poller transitions to analyzing then ready", async () => {
    vi.doMock("../src/server/services/embeddings", async () => {
      const actual = await vi.importActual("../src/server/services/embeddings");
      return {
        ...(actual as object),
        generateEmbeddings: vi.fn().mockImplementation(async (texts: string[]) => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return texts.map(() => new Array(384).fill(0));
        })
      };
    });

    const { pollOnce } = await import("../src/server/poller");
    const { POST: ReanalyzeRepo } = await import("../src/app/api/repositories/[id]/reanalyze/route");

    const tsContent = "function add(a: number, b: number): number {\n  return a + b;\n}\n";
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-status-timing`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "ready"
    }).returning();

    const [oldJob] = await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "completed",
      truncated: false,
      parsingCompletedAt: new Date(),
      embeddingCompletedAt: new Date()
    }).returning();

    const [file] = await db.insert(files).values({
      repositoryId: repo.id,
      path: "src/index.ts",
      size: tsContent.length,
      language: "typescript",
      content: tsContent,
      skipped: false,
      skipReason: null
    }).returning();

    const reanalyzeReq = new NextRequest(`http://localhost/api/repositories/${repo.id}/reanalyze`, { method: "POST" });
    const reanalyzeRes = await ReanalyzeRepo(reanalyzeReq, { params: { id: repo.id } });
    expect(reanalyzeRes.status).toBe(201);
    const reanalyzeBody = await reanalyzeRes.json();
    expect(reanalyzeBody.status).toBe("queued");

    const [afterReanalyze] = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(afterReanalyze.status).toBe("ready");

    const pollPromise = pollOnce(repo.id);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const [duringPoll] = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(duringPoll.status).toBe("analyzing");

    await pollPromise;

    const [afterPoll] = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(afterPoll.status).toBe("ready");

    const [updatedJob] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, reanalyzeBody.id));
    expect(updatedJob.status).toBe("completed");
  }, 30000);

  it("fresh import repo transitions from queued to analyzing then ready via poller", async () => {
    const { pollOnce } = await import("../src/server/poller");

    const tsContent = "const x: number = 1;\n";
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-fresh-import-status`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "queued"
    }).returning();

    const [job] = await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "queued",
      truncated: false,
      parsingCompletedAt: null,
      embeddingCompletedAt: null
    }).returning();

    const [file] = await db.insert(files).values({
      repositoryId: repo.id,
      path: "src/index.ts",
      size: tsContent.length,
      language: "typescript",
      content: tsContent,
      skipped: false,
      skipReason: null
    }).returning();

    const pollPromise = pollOnce(repo.id);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const [duringPoll] = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(duringPoll.status).toBe("analyzing");

    await pollPromise;

    const [afterPoll] = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(afterPoll.status).toBe("ready");

    const [updatedJob] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, job.id));
    expect(updatedJob.status).toBe("completed");
  }, 30000);
});
describe("Task 4: Poller delete-and-replace on reanalysis", () => {
  it("deletes old symbols and embeddingChunks, then creates fresh ones", async () => {
    const tsContent = [
      `function add(a: number, b: number): number {`,
      `  return a + b;`,
      `}`,
      ``,
      `class Calculator {`,
      `  multiply(x: number, y: number): number {`,
      `    return x * y;`,
      `  }`,
      `}`,
      ``,
      `export default Calculator;`
    ].join("\n");

    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-replace`,
      source: "zip",
      sourceUrl: null,
      commitSha: null
    }).returning();

    const [firstJob] = await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "completed",
      truncated: false,
      parsingCompletedAt: new Date("2024-01-01T00:00:00Z"),
      embeddingCompletedAt: new Date("2024-01-01T00:00:00Z")
    }).returning();

    const [file] = await db.insert(files).values({
      repositoryId: repo.id,
      path: "src/calculator.ts",
      size: tsContent.length,
      language: "typescript",
      content: tsContent,
      skipped: false,
      skipReason: null
    }).returning();

    const [oldSymbol] = await db.insert(symbols).values({
      fileId: file.id,
      kind: "function",
      name: "oldFunc",
      startLine: 1,
      endLine: 1
    }).returning();

    const OLD_EMBEDDING = new Array(384).fill(0).map((_, i) => i / 384);
    const [oldChunk] = await db.insert(embeddingChunks).values({
      fileId: file.id,
      repositoryId: repo.id,
      startLine: 1,
      endLine: 1,
      embedding: OLD_EMBEDDING
    }).returning();

    const [secondJob] = await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "queued",
      truncated: false,
      parsingCompletedAt: null,
      embeddingCompletedAt: null
    }).returning();

    await pollOnce(repo.id);

    const [updatedSecondJob] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, secondJob.id));
    expect(updatedSecondJob.status).toBe("completed");

    const [updatedRepo] = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(updatedRepo.status).toBe("ready");

    const lingeringOldSymbols = await db.select().from(symbols).where(eq(symbols.id, oldSymbol.id));
    expect(lingeringOldSymbols.length).toBe(0);

    const lingeringOldChunks = await db.select().from(embeddingChunks).where(eq(embeddingChunks.id, oldChunk.id));
    expect(lingeringOldChunks.length).toBe(0);

    const allNewSymbols = await db.select().from(symbols).where(eq(symbols.fileId, file.id));
    expect(allNewSymbols.length).toBeGreaterThan(0);
    expect(allNewSymbols.some((s) => s.id === oldSymbol.id)).toBe(false);

    const allNewChunks = await db.select().from(embeddingChunks).where(eq(embeddingChunks.fileId, file.id));
    expect(allNewChunks.length).toBeGreaterThan(0);
    expect(allNewChunks.some((c) => c.id === oldChunk.id)).toBe(false);
    expect(allNewChunks.some((c) => c.embedding[0] === OLD_EMBEDDING[0] && c.embedding[383] === OLD_EMBEDDING[383])).toBe(false);

    const fileStillExists = await db.select().from(files).where(eq(files.id, file.id));
    expect(fileStillExists.length).toBe(1);
  }, 120000);
});
