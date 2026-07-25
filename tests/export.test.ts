import { describe, expect, it, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
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
  getExportJson,
  getTaskPacket,
  validateTask,
  TASK_PACKET_K,
} from "../src/server/services/export";
import { GET as jsonGET } from "../src/app/api/repositories/[id]/export/json/route";
import { POST as taskPacketPOST } from "../src/app/api/repositories/[id]/export/task-packet/route";

const WRK_PREFIX = `export-${Date.now()}`;

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

const CONFIG_CONTENT = [
  `{`,
  `  "name": "my-app",`,
  `  "version": "1.0.0"`,
  `}`,
].join("\n");

const SKIPPED_CONTENT = [
  `// This file is intentionally skipped.`,
  `function broken() {`,
  `  return undefined;`,
  `}`,
].join("\n");

const KNOWN_NEAR_EMBEDDING = new Array(384).fill(0).map((_, i) => 0.2 + 0.001 * i);

beforeEach(() => {
  vi.clearAllMocks();
});

async function seedRepo(options: {
  entryPoints?: boolean;
  configFiles?: boolean;
  skipped?: boolean;
  symbols?: boolean;
  extraEmbeddings?: number;
} = {}): Promise<{ repositoryId: string; fileId: string; entrypointFileId?: string; configFileId?: string; skippedFileId?: string }> {
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
    const [cfgFile] = await db.insert(files).values({
      repositoryId: repo.id,
      path: "config/app.json",
      size: CONFIG_CONTENT.length,
      language: "json",
      content: CONFIG_CONTENT,
      category: "config",
      skipped: false,
      skipReason: null,
    }).returning();
    result.configFileId = cfgFile.id;

    for (let i = 0; i < 2; i++) {
      await db.insert(ecTable).values({
        fileId: cfgFile.id,
        repositoryId: repo.id,
        startLine: 1,
        endLine: 4,
        embedding: KNOWN_NEAR_EMBEDDING,
      });
    }
  }

  if (options.symbols) {
    await db.insert(symbols).values([
      {
        fileId: f.id,
        kind: "function",
        name: "greet",
        startLine: 4,
        endLine: 7,
      },
      {
        fileId: f.id,
        kind: "class",
        name: "App",
        startLine: 9,
        endLine: 14,
      },
      {
        fileId: f.id,
        kind: "interface",
        name: "IApp",
        startLine: 1,
        endLine: 3,
      },
      {
        fileId: f.id,
        kind: "import",
        name: "express",
        startLine: 1,
        endLine: 1,
      },
      {
        fileId: f.id,
        kind: "export",
        name: "greet",
        startLine: 4,
        endLine: 7,
      },
    ]);
  }

  if (options.skipped) {
    const [skippedFile] = await db.insert(files).values({
      repositoryId: repo.id,
      path: "src/broken.ts",
      size: SKIPPED_CONTENT.length,
      language: "typescript",
      content: SKIPPED_CONTENT,
      skipped: true,
      skipReason: "Parse error: unexpected token",
    }).returning();
    result.skippedFileId = skippedFile.id;
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
// JSON export: 404 nonexistent repo
// ===========================================================================
describe("GET /api/repositories/:id/export/json — 404 nonexistent repo", () => {
  it("returns 404 for a nonexistent repository", async () => {
    const { resp, body } = await makeJsonRequest("00000000-0000-0000-0000-000000000000");
    expect(resp.status).toBe(404);
    expect(body.error).toBe("Repository not found");
  });
});

// ===========================================================================
// JSON export: 409 not-ready
// ===========================================================================
describe("GET /api/repositories/:id/export/json — 409 not-ready", () => {
  it("returns 409 when status=analyzing", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${WRK_PREFIX}-analyzing-`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "analyzing",
    }).returning();

    const { resp, body } = await makeJsonRequest(repo.id);
    expect(resp.status).toBe(409);
    expect(body.error).toBeTruthy();

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  });

  it("returns 409 when status=failed", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${WRK_PREFIX}-failed-`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "failed",
    }).returning();

    const { resp, body } = await makeJsonRequest(repo.id);
    expect(resp.status).toBe(409);
    expect(body.error).toBeTruthy();

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  });
});

// ===========================================================================
// JSON export: real data matching
// ===========================================================================
describe("GET /api/repositories/:id/export/json — real data", () => {
  it("returns the documented schema with real repository, stack, entryPoints, configFiles, symbols, and notAnalyzed", async () => {
    const { repositoryId, entrypointFileId, configFileId, skippedFileId } = await seedRepo({
      entryPoints: true,
      configFiles: true,
      skipped: true,
      symbols: true,
      extraEmbeddings: 3,
    });

    const { resp, body } = await makeJsonRequest(repositoryId);
    expect(resp.status).toBe(200);

    expect(body.repository).toBeDefined();
    expect(body.repository.name).toBeTruthy();
    expect(body.repository.source).toBe("zip");
    expect(body.repository.sourceUrl).toBeNull();
    expect(body.repository.commitSha).toBeNull();
    expect(body.repository.createdAt).toBeTruthy();

    expect(body.stack).toBeDefined();
    expect(body.stack.primaryLanguage).toBe("typescript");
    expect(body.stack.framework).toBe("express");
    expect(body.stack.packageManager).toBe("npm");
    expect(body.stack.buildTool).toBe("esbuild");
    expect(body.stack.testFrameworkSummary).toBe("vitest");

    expect(body.entryPoints).toBeDefined();
    expect(body.entryPoints).toHaveLength(1);
    expect(body.entryPoints[0].path).toBe("src/entrypoint.ts");

    expect(body.configFiles).toBeDefined();
    expect(body.configFiles).toHaveLength(1);
    expect(body.configFiles[0].path).toBe("config/app.json");

    expect(body.symbols).toBeDefined();
    expect(body.symbols.count).toBe(5);
    expect(body.symbols.byKind).toBeDefined();
    expect(body.symbols.byKind.function).toBe(1);
    expect(body.symbols.byKind.class).toBe(1);
    expect(body.symbols.byKind.interface).toBe(1);
    expect(body.symbols.byKind.import).toBe(1);
    expect(body.symbols.byKind.export).toBe(1);

    expect(body.notAnalyzed).toBeDefined();
    expect(body.notAnalyzed).toHaveLength(1);
    expect(body.notAnalyzed[0].path).toBe("src/broken.ts");
    expect(body.notAnalyzed[0].reason).toBe("Parse error: unexpected token");

    expect(body.modules).toBeUndefined();
  });

  it("returns empty arrays for entryPoints and configFiles when none exist", async () => {
    const { repositoryId } = await seedRepo({ symbols: true });

    const { resp, body } = await makeJsonRequest(repositoryId);
    expect(resp.status).toBe(200);
    expect(body.entryPoints).toEqual([]);
    expect(body.configFiles).toEqual([]);
    expect(body.notAnalyzed).toEqual([]);
    expect(body.symbols.count).toBe(5);
  });
});

// ===========================================================================
// Task-packet: 404 nonexistent repo
// ===========================================================================
describe("POST /api/repositories/:id/export/task-packet — 404 nonexistent repo", () => {
  it("returns 404; no retrieval attempted", async () => {
    const { resp, body } = await makeTaskPacketRequest("00000000-0000-0000-0000-000000000000", "some task");
    expect(resp.status).toBe(404);
    expect(body.error).toBe("Repository not found");
  });
});

// ===========================================================================
// Task-packet: 409 not-ready
// ===========================================================================
describe("POST /api/repositories/:id/export/task-packet — 409 not-ready", () => {
  it("returns 409 when status=analyzing", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${WRK_PREFIX}-analyzing-`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "analyzing",
    }).returning();

    const { resp, body } = await makeTaskPacketRequest(repo.id, "some task");
    expect(resp.status).toBe(409);
    expect(body.error).toBeTruthy();

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  });

  it("returns 409 when status=failed", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${WRK_PREFIX}-failed-`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "failed",
    }).returning();

    const { resp, body } = await makeTaskPacketRequest(repo.id, "some task");
    expect(resp.status).toBe(409);
    expect(body.error).toBeTruthy();

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  });
});

// ===========================================================================
// Task-packet: 400 empty/over-length task — gate rejects before retrieval
// ===========================================================================
describe("POST /api/repositories/:id/export/task-packet — 400 validation", () => {
  it("returns 400 for empty task string", async () => {
    const { repositoryId } = await seedRepo({ extraEmbeddings: 1 });
    const { resp, body } = await makeTaskPacketRequest(repositoryId, "");
    expect(resp.status).toBe(400);
    expect(body.error).toBe("Task description is required");
  });

  it("returns 400 for whitespace-only task", async () => {
    const { repositoryId } = await seedRepo({ extraEmbeddings: 1 });
    const { resp, body } = await makeTaskPacketRequest(repositoryId, "   ");
    expect(resp.status).toBe(400);
    expect(body.error).toBe("Task description is required");
  });

  it("returns 400 for task exceeding 1000 characters", async () => {
    const { repositoryId } = await seedRepo({ extraEmbeddings: 1 });
    const { resp, body } = await makeTaskPacketRequest(repositoryId, "a".repeat(1001));
    expect(resp.status).toBe(400);
    expect(body.error).toBe("Task description must be at most 1000 characters");
  });

  it("accepts exactly 1000 characters", async () => {
    const { repositoryId } = await seedRepo({ extraEmbeddings: 1 });
    const { resp, body } = await makeTaskPacketRequest(repositoryId, "a".repeat(1000));
    expect(resp.status).toBe(200);
    expect(body.results).toBeDefined();
  });

  it("returns 400 for missing task field", async () => {
    const { repositoryId } = await seedRepo({ extraEmbeddings: 1 });
    const request = new NextRequest(`http://localhost/api/repositories/${repositoryId}/export/task-packet`, {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const resp = await taskPacketPOST(request, { params: { id: repositoryId } });
    expect(resp.status).toBe(400);
    const body = await resp.json();
    expect(body.error).toBe("Missing required field: task (string)");
  });
});

// ===========================================================================
// Task-packet: real ranked results with sliced content
// ===========================================================================
describe("POST /api/repositories/:id/export/task-packet — real results", () => {
  it("returns ranked results with real file path, line range, and sliced content", async () => {
    const { repositoryId, fileId, entrypointFileId } = await seedRepo({
      entryPoints: true,
      configFiles: true,
      skipped: true,
      symbols: true,
      extraEmbeddings: 5,
    });

    const { resp, body } = await makeTaskPacketRequest(repositoryId, "greet function app");
    expect(resp.status).toBe(200);
    expect(body.results).toBeDefined();
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results.length).toBeLessThanOrEqual(TASK_PACKET_K);

    const mainFileResult = body.results.find((r: any) => r.fileId === fileId);
    expect(mainFileResult).toBeDefined();
    expect(mainFileResult.path).toBe("src/index.ts");
    expect(mainFileResult.startLine).toBeGreaterThan(0);
    expect(mainFileResult.endLine).toBeGreaterThanOrEqual(mainFileResult.startLine);
    expect(mainFileResult.content).toBeTruthy();

    const expectedSliced = FILE_CONTENT.split("\n").slice(0, 14).join("\n");
    expect(mainFileResult.content).toBe(expectedSliced);
  });

  it("returns at most 15 results even when more embeddings exist", async () => {
    const { repositoryId } = await seedRepo({
      extraEmbeddings: 25,
    });

    const { resp, body } = await makeTaskPacketRequest(repositoryId, "some task description");
    expect(resp.status).toBe(200);
    expect(body.results.length).toBeLessThanOrEqual(TASK_PACKET_K);
  });

  it("returns empty results when no embeddings exist", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${WRK_PREFIX}-no-embeddings`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "ready",
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

    await db.update(analysisJobs).set({ status: "completed" }).where(eq(analysisJobs.id, job.id));
    await db.update(repositories).set({ status: "ready" }).where(eq(repositories.id, repo.id));

    const { resp, body } = await makeTaskPacketRequest(repo.id, "some task");
    expect(resp.status).toBe(200);
    expect(body.results).toEqual([]);

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  });
});

// ===========================================================================
// validateTask unit tests
// ===========================================================================
describe("validateTask (unit)", () => {
  it("rejects empty string", () => {
    expect(() => validateTask("")).toThrow("Task description is required");
  });

  it("rejects whitespace-only task", () => {
    expect(() => validateTask("   ")).toThrow("Task description is required");
  });

  it("rejects task > 1000 characters", () => {
    expect(() => validateTask("a".repeat(1001))).toThrow(
      "Task description must be at most 1000 characters"
    );
  });

  it("accepts exactly 1000 characters", () => {
    expect(() => validateTask("a".repeat(1000))).not.toThrow();
  });

  it("accepts a normal task", () => {
    expect(() => validateTask("Refactor the authentication middleware")).not.toThrow();
  });
});
