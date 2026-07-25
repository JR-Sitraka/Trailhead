import { describe, expect, it, vi, beforeAll, afterAll, beforeEach } from "vitest";

const groqCtx: {
  responseText: string;
  rejectStatus: number | null;
  rejectMessage: string;
  callCount: number;
} = {
  responseText: '{"status":"answered","answer":"This is a test summary [1].","citations":[1]}',
  rejectStatus: null,
  rejectMessage: "",
  callCount: 0,
};

function setGroqAnswer(text: string) {
  groqCtx.responseText = text;
  groqCtx.rejectStatus = null;
  groqCtx.rejectMessage = "";
  groqCtx.callCount = 0;
}

vi.mock("groq-sdk", () => {
  const FakeGroq: any = class FakeGroq {
    constructor(..._args: any[]) {
      groqCtx.callCount++;
      return {
        chat: {
          completions: {
            create: async () => {
              if (groqCtx.rejectStatus !== null) {
                const err: any = new Error(groqCtx.rejectMessage);
                err.status = groqCtx.rejectStatus;
                throw err;
              }
              return { choices: [{ message: { content: groqCtx.responseText } }] };
            },
          },
        },
      };
    }
  };
  return { default: FakeGroq };
});

beforeEach(() => {
  vi.clearAllMocks();
  setGroqAnswer('{"status":"answered","answer":"This is a test summary [1].","citations":[1]}');
});
import { NextRequest } from "next/server";
import { db } from "../src/server/db";
import {
  repositories,
  analysisJobs,
  files,
  symbols,
  embeddingChunks as ecTable,
} from "../src/server/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  GET as contextGET,
} from "../src/app/api/repositories/[id]/export/context/route";
import { GET as jsonGET } from "../src/app/api/repositories/[id]/export/json/route";
import { POST as taskPacketPOST } from "../src/app/api/repositories/[id]/export/task-packet/route";
import { getExportJson, generateContextSummary, getTaskPacket, TASK_PACKET_K } from "../src/server/services/export";

const WRK_PREFIX = `export-page-${Date.now()}`;

const FILE_CONTENT = [
  `import express from "express";`,
  `import { greet } from "./utils";`,
  ``,
  `export function greet(name: string): string {`,
  `  if (!name) return "world";`,
  `  return \`Hello, \${name}!\`;`,
  `}`,
  ``,
  `export class App {`,
  `  constructor(private port: number) {}`,
  ``,
  `  start(): void {`,
  `    console.log(\`Server on \${this.port}\`);`,
  `  }`,
  `}`,
].join("\n");

const ENTRYPOINT_CONTENT = [
  `import { App } from "./app";`,
  `const app = new App(3000);`,
  `app.start();`,
].join("\n");

const KNOWN_NEAR_EMBEDDING = new Array(384).fill(0).map((_, i) => 0.2 + 0.001 * i);

beforeEach(() => {
  vi.clearAllMocks();
});

async function seedRepo(options: {
  entryPoints?: boolean;
  configFiles?: boolean;
  symbols?: boolean;
  extraEmbeddings?: number;
} = {}): Promise<{ repositoryId: string; fileId: string; entrypointFileId?: string }> {
  const [repo] = await db.insert(repositories).values({
    name: `${WRK_PREFIX}-${Math.random().toString(36).slice(2, 8)}`,
    source: "zip",
    sourceUrl: null,
    commitSha: null,
    status: "ready",
    primaryLanguage: "typescript",
    framework: "express",
    packageManager: "npm",
    buildTool: "esbuild",
    testFrameworkSummary: "vitest",
  }).returning();

  const [job] = await db.insert(analysisJobs).values({
    repositoryId: repo.id,
    status: "queued",
    truncated: false,
    parsingCompletedAt: new Date(),
    embeddingCompletedAt: new Date(),
  }).returning();

  const [f] = await db.insert(files).values({
    repositoryId: repo.id,
    path: "src/index.ts",
    size: FILE_CONTENT.length,
    language: "typescript",
    content: FILE_CONTENT,
    skipped: false,
    skipReason: null,
  }).returning();

  const embeddingCount = options.extraEmbeddings ?? 2;
  for (let i = 0; i < embeddingCount; i++) {
    await db.insert(ecTable).values({
      fileId: f.id,
      repositoryId: repo.id,
      startLine: 1,
      endLine: 14,
      embedding: KNOWN_NEAR_EMBEDDING,
    });
  }

  const result: any = { repositoryId: repo.id, fileId: f.id };

  if (options.entryPoints) {
    const [epFile] = await db.insert(files).values({
      repositoryId: repo.id,
      path: "src/entrypoint.ts",
      size: ENTRYPOINT_CONTENT.length,
      language: "typescript",
      content: ENTRYPOINT_CONTENT,
      category: "entrypoint",
      skipped: false,
      skipReason: null,
    }).returning();
    result.entrypointFileId = epFile.id;

    for (let i = 0; i < 2; i++) {
      await db.insert(ecTable).values({
        fileId: epFile.id,
        repositoryId: repo.id,
        startLine: 1,
        endLine: 3,
        embedding: KNOWN_NEAR_EMBEDDING,
      });
    }
  }

  if (options.configFiles) {
    await db.insert(files).values({
      repositoryId: repo.id,
      path: "config/app.json",
      size: 50,
      language: "json",
      content: '{"name": "my-app"}',
      category: "config",
      skipped: false,
      skipReason: null,
    });
  }

  if (options.symbols) {
    await db.insert(symbols).values([
      { fileId: f.id, kind: "function", name: "greet", startLine: 4, endLine: 7 },
      { fileId: f.id, kind: "class", name: "App", startLine: 9, endLine: 14 },
    ]);
  }

  await db.update(analysisJobs).set({ status: "completed" }).where(eq(analysisJobs.id, job.id));
  await db.update(repositories).set({ status: "ready" }).where(eq(repositories.id, repo.id));

  return result;
}

beforeAll(async () => {
  const leftovers = await db.select().from(repositories).where(
    sql`${repositories.name}::TEXT LIKE ${`${WRK_PREFIX}%`}`
  );
  for (const r of leftovers) {
    await db.delete(repositories).where(eq(repositories.id, r.id));
  }
});

afterAll(async () => {
  const leftovers = await db.select().from(repositories).where(
    sql`${repositories.name}::TEXT LIKE ${`${WRK_PREFIX}%`}`
  );
  for (const r of leftovers) {
    await db.delete(repositories).where(eq(repositories.id, r.id));
  }
});

async function makeContextRequest(repoId: string): Promise<{ resp: Response; body: any }> {
  const request = new NextRequest(`http://localhost/api/repositories/${repoId}/export/context`);
  const resp = await contextGET(request, { params: { id: repoId } });
  return { resp, body: await resp.json() };
}

async function makeJsonRequest(repoId: string): Promise<{ resp: Response; body: any }> {
  const request = new NextRequest(`http://localhost/api/repositories/${repoId}/export/json`);
  const resp = await jsonGET(request, { params: { id: repoId } });
  return { resp, body: await resp.json() };
}

async function makeTaskPacketRequest(repoId: string, task: string): Promise<{ resp: Response; body: any }> {
  const request = new NextRequest(`http://localhost/api/repositories/${repoId}/export/task-packet`, {
    method: "POST",
    body: JSON.stringify({ task }),
    headers: { "Content-Type": "application/json" },
  });
  const resp = await taskPacketPOST(request, { params: { id: repoId } });
  return { resp, body: await resp.json() };
}

// ===========================================================================
// Export page — 404 nonexistent repo
// ===========================================================================
describe("Export page — 404 nonexistent repo", () => {
  it("returns 404 for context on nonexistent repo", async () => {
    const { resp, body } = await makeContextRequest("00000000-0000-0000-0000-000000000000");
    expect(resp.status).toBe(404);
    expect(body.error).toBe("Repository not found");
  });

  it("returns 404 for JSON on nonexistent repo", async () => {
    const { resp, body } = await makeJsonRequest("00000000-0000-0000-0000-000000000000");
    expect(resp.status).toBe(404);
    expect(body.error).toBe("Repository not found");
  });

  it("returns 404 for task-packet on nonexistent repo", async () => {
    const { resp, body } = await makeTaskPacketRequest("00000000-0000-0000-0000-000000000000", "some task");
    expect(resp.status).toBe(404);
    expect(body.error).toBe("Repository not found");
  });
});

// ===========================================================================
// Export page — 409 not-ready
// ===========================================================================
describe("Export page — 409 not-ready", () => {
  it("returns 409 for all three formats when repo is not ready", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${WRK_PREFIX}-notready-`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "analyzing",
    }).returning();

    const ctx = await makeContextRequest(repo.id);
    expect(ctx.resp.status).toBe(409);

    const json = await makeJsonRequest(repo.id);
    expect(json.resp.status).toBe(409);

    const tp = await makeTaskPacketRequest(repo.id, "some task");
    expect(tp.resp.status).toBe(409);

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  });
});

// ===========================================================================
// Export page — three sections are independent
// ===========================================================================
describe("Export page — sections are independent", () => {
  it("fetching context does not affect JSON or task-packet data for the same repo", async () => {
    const { repositoryId } = await seedRepo({
      entryPoints: true,
      configFiles: true,
      symbols: true,
      extraEmbeddings: 5,
    });

    const ctxResp = await makeContextRequest(repositoryId);
    expect(ctxResp.resp.status).toBe(200);

    const jsonResp = await makeJsonRequest(repositoryId);
    expect(jsonResp.resp.status).toBe(200);
    expect(jsonResp.body.repository.name).toBeTruthy();

    const tpResp = await makeTaskPacketRequest(repositoryId, "test task");
    expect(tpResp.resp.status).toBe(200);

    const ctx2 = await makeContextRequest(repositoryId);
    expect(ctx2.resp.status).toBe(200);
    expect(ctx2.body.content).toBe(ctxResp.body.content);

    const json2 = await makeJsonRequest(repositoryId);
    expect(json2.resp.status).toBe(200);
    expect(json2.body).toEqual(jsonResp.body);
  });
});

// ===========================================================================
// Export page — REPOSITORY_CONTEXT.md real data
// ===========================================================================
describe("Export page — REPOSITORY_CONTEXT.md", () => {
  it("returns content and generatedVia field on success", async () => {
    const { repositoryId } = await seedRepo({
      entryPoints: true,
      symbols: true,
      extraEmbeddings: 2,
    });

    const { resp, body } = await makeContextRequest(repositoryId);
    expect(resp.status).toBe(200);
    expect(body.content).toBeTruthy();
    expect(typeof body.content).toBe("string");
    expect(body.generatedVia).toBe("llm");
    expect(body.generatedVia).not.toBe("deterministic-fallback");
    expect(Array.isArray(body.citations)).toBe(true);
  });

  it("returns deterministic-fallback with empty citations when no entrypoint embeddings exist", async () => {
    const { repositoryId } = await seedRepo({
      symbols: true,
    });

    const { resp, body } = await makeContextRequest(repositoryId);
    expect(resp.status).toBe(200);
    expect(body.generatedVia).toBe("deterministic-fallback");
    expect(body.content).toBeTruthy();
    expect(body.content.length).toBeGreaterThan(0);
    expect(body.citations).toEqual([]);
  });
});

// ===========================================================================
// Export page — JSON real data
// ===========================================================================
describe("Export page — JSON", () => {
  it("returns real formatted data with all documented fields", async () => {
    const { repositoryId } = await seedRepo({
      entryPoints: true,
      configFiles: true,
      symbols: true,
      extraEmbeddings: 3,
    });

    const { resp, body } = await makeJsonRequest(repositoryId);
    expect(resp.status).toBe(200);
    expect(body.repository).toBeDefined();
    expect(body.stack).toBeDefined();
    expect(body.entryPoints).toBeDefined();
    expect(body.configFiles).toBeDefined();
    expect(body.symbols).toBeDefined();
    expect(body.notAnalyzed).toBeDefined();
    expect(body.modules).toBeUndefined();
  });
});

// ===========================================================================
// Export page — Task-Packet real results
// ===========================================================================
describe("Export page — Task-Packet", () => {
  it("returns ranked results with real file path, line range, and content", async () => {
    const { repositoryId, fileId } = await seedRepo({
      entryPoints: true,
      symbols: true,
      extraEmbeddings: 5,
    });

    const { resp, body } = await makeTaskPacketRequest(repositoryId, "test task");
    expect(resp.status).toBe(200);
    expect(body.results).toBeDefined();
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results.length).toBeLessThanOrEqual(TASK_PACKET_K);

    const mainResult = body.results.find((r: any) => r.fileId === fileId);
    expect(mainResult).toBeDefined();
    expect(mainResult.path).toBe("src/index.ts");
    expect(mainResult.startLine).toBeGreaterThan(0);
    expect(mainResult.endLine).toBeGreaterThanOrEqual(mainResult.startLine);
    expect(mainResult.content).toBeTruthy();
  });

  it("returns 400 for empty task description", async () => {
    const { repositoryId } = await seedRepo({ extraEmbeddings: 1 });
    const { resp, body } = await makeTaskPacketRequest(repositoryId, "");
    expect(resp.status).toBe(400);
    expect(body.error).toBe("Task description is required");
  });

  it("returns at most 15 results", async () => {
    const { repositoryId } = await seedRepo({ extraEmbeddings: 25 });
    const { resp, body } = await makeTaskPacketRequest(repositoryId, "test task");
    expect(resp.status).toBe(200);
    expect(body.results.length).toBeLessThanOrEqual(TASK_PACKET_K);
  });
});
