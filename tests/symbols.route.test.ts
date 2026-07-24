import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../src/server/db";
import {
  repositories,
  analysisJobs,
  files,
  symbols as symbolsTable
} from "../src/server/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { GET } from "../src/app/api/repositories/[id]/symbols/route";

const WRK_PREFIX = `symbols-route-${Date.now()}`;

const FILE_CONTENT = `import express from "express";
import { greet } from "./utils";

export function greet(name: string): string {
  if (!name) return "world";
  return \`Hello, \${name}!\`;
}

export class App {
  constructor(private port: number) {}

  start(): void {
    console.log(\`Server on \${this.port}\`);
  }
}
`;

async function seedReadyRepo(
  name: string,
  symbolData: Array<{ kind: string; name: string; startLine: number; endLine: number }>
): Promise<string> {
  const [repo] = await db.insert(repositories).values({
    name: `${WRK_PREFIX}-${name}`,
    source: "zip",
    sourceUrl: null,
    commitSha: null,
    status: "ready",
  }).returning();

  const [job] = await db.insert(analysisJobs).values({
    repositoryId: repo.id,
    status: "completed",
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

  for (const sym of symbolData) {
    await db.insert(symbolsTable).values({
      fileId: f.id,
      kind: sym.kind as any,
      name: sym.name,
      startLine: sym.startLine,
      endLine: sym.endLine,
    });
  }

  await db.update(repositories).set({ status: "ready" }).where(eq(repositories.id, repo.id));
  return repo.id;
}

async function makeSymbolsRequest(
  repoId: string,
  kind?: string
): Promise<{ resp: Response; body: any }> {
  const url = new URL(`http://localhost/api/repositories/${repoId}/symbols`);
  if (kind) url.searchParams.set("kind", kind);

  const request = new NextRequest(url.toString());
  const resp = await GET(request, { params: { id: repoId } });
  return { resp, body: await resp.json() };
}

async function dbCountByKind(repoId: string, kind: string): Promise<number> {
  const row = await db.select({ count: sql<number>`count(*)` })
    .from(symbolsTable)
    .innerJoin(files, eq(symbolsTable.fileId, files.id))
    .where(and(eq(files.repositoryId, repoId), eq(symbolsTable.kind, kind as any)));
  return Number(row[0]!.count);
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

describe("GET /api/repositories/:id/symbols", () => {
  it("404 for nonexistent repository", async () => {
    const { resp, body } = await makeSymbolsRequest("00000000-0000-0000-0000-000000000000");
    expect(resp.status).toBe(404);
    expect(body.error).toBe("Repository not found");
  });

  it("409 for non-ready repository (status=analyzing)", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${WRK_PREFIX}-analyzing`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "analyzing",
    }).returning();

    const { resp, body } = await makeSymbolsRequest(repo.id);
    expect(resp.status).toBe(409);
    expect(body.error).toBe("Repository is not ready. It must finish analysis before it can be queried.");

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  });

  it("409 for non-ready repository (status=failed)", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${WRK_PREFIX}-failed`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "failed",
    }).returning();

    const { resp, body } = await makeSymbolsRequest(repo.id);
    expect(resp.status).toBe(409);
    expect(body.error).toBe("Repository is not ready. It must finish analysis before it can be queried.");

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  });

  it("400 for invalid kind value", async () => {
    const repoId = await seedReadyRepo("invalid-kind", [
      { kind: "function", name: "greet", startLine: 4, endLine: 8 },
    ]);

    const { resp, body } = await makeSymbolsRequest(repoId, "banana");
    expect(resp.status).toBe(400);
    expect(body.error).toContain("Invalid kind");
  });

  it("returns all symbols with correct shape and values when no kind filter", async () => {
    const repoId = await seedReadyRepo("all-kinds", [
      { kind: "function", name: "greet", startLine: 4, endLine: 8 },
      { kind: "class", name: "App", startLine: 10, endLine: 14 },
      { kind: "import", name: "express", startLine: 1, endLine: 1 },
      { kind: "export", name: "greet", startLine: 4, endLine: 8 },
    ]);

    const { resp, body } = await makeSymbolsRequest(repoId);
    expect(resp.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(4);

    const functionGreet = body.find((s: any) => s.kind === "function" && s.name === "greet");
    expect(functionGreet).toBeDefined();
    expect(functionGreet.id).toBeTruthy();
    expect(functionGreet.kind).toBe("function");
    expect(functionGreet.name).toBe("greet");
    expect(functionGreet.path).toBe("src/index.ts");
    expect(functionGreet.startLine).toBe(4);
    expect(functionGreet.endLine).toBe(8);

    const app = body.find((s: any) => s.kind === "class" && s.name === "App");
    expect(app).toBeDefined();
    expect(app.kind).toBe("class");
    expect(app.path).toBe("src/index.ts");
    expect(app.startLine).toBe(10);
    expect(app.endLine).toBe(14);

    const express = body.find((s: any) => s.kind === "import" && s.name === "express");
    expect(express).toBeDefined();
    expect(express.kind).toBe("import");
    expect(express.path).toBe("src/index.ts");
    expect(express.startLine).toBe(1);
    expect(express.endLine).toBe(1);

    const exportGreet = body.find((s: any) => s.kind === "export" && s.name === "greet");
    expect(exportGreet).toBeDefined();
    expect(exportGreet.kind).toBe("export");
    expect(exportGreet.path).toBe("src/index.ts");
    expect(exportGreet.startLine).toBe(4);
    expect(exportGreet.endLine).toBe(8);
  });

  it("filters by kind=function server-side", async () => {
    const repoId = await seedReadyRepo("filter-function", [
      { kind: "function", name: "greet", startLine: 4, endLine: 8 },
      { kind: "function", name: "start", startLine: 11, endLine: 13 },
      { kind: "class", name: "App", startLine: 10, endLine: 14 },
      { kind: "import", name: "express", startLine: 1, endLine: 1 },
    ]);

    const { resp, body } = await makeSymbolsRequest(repoId, "function");
    expect(resp.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body.every((s: any) => s.kind === "function")).toBe(true);

    const dbCount = await dbCountByKind(repoId, "function");
    expect(dbCount).toBe(2);
  });

  it("filters by kind=class server-side", async () => {
    const repoId = await seedReadyRepo("filter-class", [
      { kind: "function", name: "greet", startLine: 4, endLine: 8 },
      { kind: "class", name: "App", startLine: 10, endLine: 14 },
      { kind: "interface", name: "Config", startLine: 16, endLine: 18 },
    ]);

    const { resp, body } = await makeSymbolsRequest(repoId, "class");
    expect(resp.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].kind).toBe("class");
    expect(body[0].name).toBe("App");

    const dbCount = await dbCountByKind(repoId, "class");
    expect(dbCount).toBe(1);
  });

  it("filters by kind=interface server-side", async () => {
    const repoId = await seedReadyRepo("filter-interface", [
      { kind: "function", name: "greet", startLine: 4, endLine: 8 },
      { kind: "interface", name: "Config", startLine: 16, endLine: 18 },
      { kind: "export", name: "greet", startLine: 4, endLine: 8 },
    ]);

    const { resp, body } = await makeSymbolsRequest(repoId, "interface");
    expect(resp.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].kind).toBe("interface");
    expect(body[0].name).toBe("Config");

    const dbCount = await dbCountByKind(repoId, "interface");
    expect(dbCount).toBe(1);
  });

  it("filters by kind=import server-side", async () => {
    const repoId = await seedReadyRepo("filter-import", [
      { kind: "import", name: "express", startLine: 1, endLine: 1 },
      { kind: "import", name: "utils", startLine: 2, endLine: 2 },
      { kind: "function", name: "greet", startLine: 4, endLine: 8 },
    ]);

    const { resp, body } = await makeSymbolsRequest(repoId, "import");
    expect(resp.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body.every((s: any) => s.kind === "import")).toBe(true);

    const dbCount = await dbCountByKind(repoId, "import");
    expect(dbCount).toBe(2);
  });

  it("filters by kind=export server-side", async () => {
    const repoId = await seedReadyRepo("filter-export", [
      { kind: "export", name: "greet", startLine: 4, endLine: 8 },
      { kind: "export", name: "App", startLine: 10, endLine: 14 },
      { kind: "function", name: "greet", startLine: 4, endLine: 8 },
      { kind: "class", name: "App", startLine: 10, endLine: 14 },
    ]);

    const { resp, body } = await makeSymbolsRequest(repoId, "export");
    expect(resp.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body.every((s: any) => s.kind === "export")).toBe(true);

    const dbCount = await dbCountByKind(repoId, "export");
    expect(dbCount).toBe(2);
  });

  it("returns 200 with empty array for a repository with zero symbols", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${WRK_PREFIX}-zero-symbols`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "ready",
    }).returning();

    const [job] = await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "completed",
      truncated: false,
      parsingCompletedAt: new Date(),
      embeddingCompletedAt: new Date(),
    }).returning();

    await db.insert(files).values({
      repositoryId: repo.id,
      path: "src/app.py",
      size: 20,
      language: "python",
      content: `print("hello")\n`,
      skipped: false,
      skipReason: null,
    });

    const { resp, body } = await makeSymbolsRequest(repo.id);
    expect(resp.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });
});
