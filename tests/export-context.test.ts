import { describe, expect, it, vi, beforeAll, afterAll, beforeEach } from "vitest";
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
import { GET as contextGET } from "../src/app/api/repositories/[id]/export/context/route";
import { getExportJson, generateContextSummary, buildDeterministicFallback } from "../src/server/services/export";

const WRK_PREFIX = `context-export-${Date.now()}`;

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

function setGroqReject(status: number, message: string) {
  groqCtx.responseText = "";
  groqCtx.rejectStatus = status;
  groqCtx.rejectMessage = message;
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

async function seedRepo(options: {
  entryPoints?: boolean;
  configFiles?: boolean;
  skipped?: boolean;
  symbols?: boolean;
  extraEmbeddings?: number;
  entrypointEmbeddings?: number;
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

    const epEmbCount = options.entrypointEmbeddings ?? 2;
    for (let i = 0; i < epEmbCount; i++) {
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

async function makeContextRequest(repoId: string): Promise<{ resp: Response; body: any }> {
  const request = new NextRequest(`http://localhost/api/repositories/${repoId}/export/context`);
  const resp = await contextGET(request, { params: { id: repoId } });
  return { resp, body: await resp.json() };
}

// ===========================================================================
// GET /api/repositories/:id/export/context — 404 nonexistent repo
// ===========================================================================
describe("GET /api/repositories/:id/export/context — 404 nonexistent repo", () => {
  it("returns 404 for a nonexistent repository", async () => {
    const { resp, body } = await makeContextRequest("00000000-0000-0000-0000-000000000000");
    expect(resp.status).toBe(404);
    expect(body.error).toBe("Repository not found");
  });
});

// ===========================================================================
// GET /api/repositories/:id/export/context — 409 not-ready
// ===========================================================================
describe("GET /api/repositories/:id/export/context — 409 not-ready", () => {
  it("returns 409 when status=analyzing", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${WRK_PREFIX}-analyzing-`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "analyzing",
    }).returning();

    const { resp, body } = await makeContextRequest(repo.id);
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

    const { resp, body } = await makeContextRequest(repo.id);
    expect(resp.status).toBe(409);
    expect(body.error).toBeTruthy();

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  });
});

// ===========================================================================
// LLM path: Groq returns valid answer with in-range citations
// ===========================================================================
describe("GET /api/repositories/:id/export/context — LLM path", () => {
  it("returns 200 with generatedVia='llm' when Groq returns a valid grounded answer", async () => {
    const { repositoryId, entrypointFileId } = await seedRepo({
      entryPoints: true,
      configFiles: true,
      skipped: true,
      symbols: true,
      entrypointEmbeddings: 2,
    });

    setGroqAnswer(
      '{"status":"answered","answer":"This is a TypeScript repository using Express [1]. The entry point is src/entrypoint.ts which boots the App class [2].","citations":[1,2]}'
    );

    const { resp, body } = await makeContextRequest(repositoryId);
    expect(resp.status).toBe(200);
    expect(body.generatedVia).toBe("llm");
    expect(body.content).toBeTruthy();
    expect(body.content).toContain("TypeScript");
    expect(body.content).toContain("Express");
    expect(groqCtx.callCount).toBe(1);
  });
});

// ===========================================================================
// Fallback path: Groq provider error
// ===========================================================================
describe("GET /api/repositories/:id/export/context — Groq error → fallback", () => {
  it("returns 200 with generatedVia='deterministic-fallback' when Groq throws a 502", async () => {
    const { repositoryId } = await seedRepo({
      entryPoints: true,
      configFiles: true,
      skipped: true,
      symbols: true,
      entrypointEmbeddings: 2,
    });

    setGroqReject(502, "Bad gateway");

    const { resp, body } = await makeContextRequest(repositoryId);
    expect(resp.status).toBe(200);
    expect(body.generatedVia).toBe("deterministic-fallback");
    expect(body.content).toBeTruthy();
    expect(body.content.length).toBeGreaterThan(0);
  });

  it("returns 200 with generatedVia='deterministic-fallback' when Groq throws a 429", async () => {
    const { repositoryId } = await seedRepo({
      entryPoints: true,
      configFiles: true,
      symbols: true,
      entrypointEmbeddings: 2,
    });

    setGroqReject(429, "Rate limit exceeded");

    const { resp, body } = await makeContextRequest(repositoryId);
    expect(resp.status).toBe(200);
    expect(body.generatedVia).toBe("deterministic-fallback");
    expect(body.content).toBeTruthy();
  });
});

// ===========================================================================
// Fallback path: citation-validation failure
// ===========================================================================
describe("GET /api/repositories/:id/export/context — citation-validation failure → fallback", () => {
  it("returns fallback when Groq returns citations referencing out-of-range labels", async () => {
    const { repositoryId } = await seedRepo({
      entryPoints: true,
      symbols: true,
      entrypointEmbeddings: 2,
    });

    setGroqAnswer(
      '{"status":"answered","answer":"This references labels [1], [2], and [3].","citations":[1,2,3]}'
    );

    const { resp, body } = await makeContextRequest(repositoryId);
    expect(resp.status).toBe(200);
    expect(body.generatedVia).toBe("deterministic-fallback");
    expect(body.content).toBeTruthy();
  });

  it("returns fallback when Groq returns non-JSON text", async () => {
    const { repositoryId } = await seedRepo({
      entryPoints: true,
      symbols: true,
      entrypointEmbeddings: 2,
    });

    setGroqAnswer("This is plain text, not JSON.");

    const { resp, body } = await makeContextRequest(repositoryId);
    expect(resp.status).toBe(200);
    expect(body.generatedVia).toBe("deterministic-fallback");
    expect(body.content).toBeTruthy();
  });

  it("returns fallback when Groq returns no_evidence status", async () => {
    const { repositoryId } = await seedRepo({
      entryPoints: true,
      symbols: true,
      entrypointEmbeddings: 2,
    });

    setGroqAnswer('{"status":"no_evidence","answer":"Cannot answer from evidence.","citations":[]}');

    const { resp, body } = await makeContextRequest(repositoryId);
    expect(resp.status).toBe(200);
    expect(body.generatedVia).toBe("deterministic-fallback");
    expect(body.content).toBeTruthy();
  });
});

// ===========================================================================
// Deterministic fallback: no entrypoint embeddings → fallback
// ===========================================================================
describe("GET /api/repositories/:id/export/context — no entrypoint chunks → fallback", () => {
  it("returns fallback when no entrypoint embeddings exist", async () => {
    const { repositoryId } = await seedRepo({
      symbols: true,
    });

    const { resp, body } = await makeContextRequest(repositoryId);
    expect(resp.status).toBe(200);
    expect(body.generatedVia).toBe("deterministic-fallback");
    expect(body.content).toBeTruthy();
  });
});

// ===========================================================================
// Deterministic fallback: content equivalence with JSON export
// ===========================================================================
describe("GET /api/repositories/:id/export/context — fallback equivalence with JSON export", () => {
  it("fallback content contains all facts present in the JSON export for the same repository", async () => {
    const { repositoryId } = await seedRepo({
      entryPoints: true,
      configFiles: true,
      skipped: true,
      symbols: true,
      entrypointEmbeddings: 2,
    });

    setGroqReject(502, "forced fallback");

    const { resp, body } = await makeContextRequest(repositoryId);
    expect(resp.status).toBe(200);
    expect(body.generatedVia).toBe("deterministic-fallback");

    const jsonData = await getExportJson(repositoryId);
    const fallbackContent = body.content;

    expect(fallbackContent).toContain(jsonData.repository.name);
    expect(fallbackContent).toContain(jsonData.stack.primaryLanguage ?? "");
    expect(fallbackContent).toContain(jsonData.stack.framework ?? "");
    expect(fallbackContent).toContain(jsonData.stack.packageManager ?? "");
    expect(fallbackContent).toContain(jsonData.stack.buildTool ?? "");
    expect(fallbackContent).toContain(jsonData.stack.testFrameworkSummary ?? "");

    for (const ep of jsonData.entryPoints) {
      expect(fallbackContent).toContain(ep.path);
    }

    for (const cf of jsonData.configFiles) {
      expect(fallbackContent).toContain(cf.path);
    }

    expect(fallbackContent).toContain(String(jsonData.symbols.count));
    for (const [kind, count] of Object.entries(jsonData.symbols.byKind)) {
      expect(fallbackContent).toContain(`${count} ${kind}(s)`);
    }

    for (const na of jsonData.notAnalyzed) {
      expect(fallbackContent).toContain(na.path);
      if (na.reason) {
        expect(fallbackContent).toContain(na.reason);
      }
    }
  });

  it("fallback contains the repository name and stack facts for a repo with no entrypoints or config files", async () => {
    const { repositoryId } = await seedRepo({
      symbols: true,
    });

    const { resp, body } = await makeContextRequest(repositoryId);
    expect(resp.status).toBe(200);
    expect(body.generatedVia).toBe("deterministic-fallback");

    const jsonData = await getExportJson(repositoryId);
    expect(body.content).toContain(jsonData.repository.name);
    expect(body.content).toContain(jsonData.stack.primaryLanguage ?? "");
    expect(body.content).toContain(jsonData.symbols.count.toString());
  });
});

// ===========================================================================
// buildDeterministicFallback unit-level coverage via route
// ===========================================================================
describe("buildDeterministicFallback — template content structure", () => {
  it("produces markdown with all expected sections for a fully-populated repo", () => {
    const contextJson = {
      repository: { name: "test-repo", source: "github", sourceUrl: "https://github.com/org/test", commitSha: "abc123", createdAt: "2024-01-01T00:00:00Z" },
      stack: { primaryLanguage: "typescript", framework: "express", packageManager: "npm", buildTool: "vite", testFrameworkSummary: "vitest" },
      entryPoints: [{ path: "src/index.ts" }],
      configFiles: [{ path: "tsconfig.json" }],
      symbols: { count: 10, byKind: { function: 5, class: 3, interface: 2 } },
      notAnalyzed: [{ path: "src/broken.ts", reason: "Parse error" }],
    };

    const result = buildDeterministicFallback(contextJson as any);
    expect(result).toContain("test-repo");
    expect(result).toContain("typescript");
    expect(result).toContain("express");
    expect(result).toContain("npm");
    expect(result).toContain("vite");
    expect(result).toContain("vitest");
    expect(result).toContain("src/index.ts");
    expect(result).toContain("tsconfig.json");
    expect(result).toContain("10");
    expect(result).toContain("5 function(s)");
    expect(result).toContain("3 class(s)");
    expect(result).toContain("2 interface(s)");
    expect(result).toContain("src/broken.ts");
    expect(result).toContain("Parse error");
  });

  it("handles an empty repo (no entrypoints, config, symbols, or not-analyzed)", () => {
    const contextJson = {
      repository: { name: "empty-repo", source: "zip", sourceUrl: null, commitSha: null, createdAt: "2024-01-01T00:00:00Z" },
      stack: { primaryLanguage: null, framework: null, packageManager: null, buildTool: null, testFrameworkSummary: null },
      entryPoints: [],
      configFiles: [],
      symbols: { count: 0, byKind: {} },
      notAnalyzed: [],
    };

    const result = buildDeterministicFallback(contextJson as any);
    expect(result).toContain("empty-repo");
    expect(result).toContain("## Stack");
    expect(result).not.toContain("## Entry Points");
    expect(result).not.toContain("## Configuration Files");
    expect(result).not.toContain("## Symbols");
    expect(result).not.toContain("## Not Analyzed");
  });
});
