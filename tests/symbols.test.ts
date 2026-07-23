import { describe, it, expect, beforeAll } from "vitest";
import { db } from "../src/server/db";
import { repositories, analysisJobs, files, symbols as symbolsTable } from "../src/server/db/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { pollOnce } from "../src/server/poller";

type SymbolRow = typeof symbolsTable.$inferSelect;

describe("Symbol extraction via poller", () => {
  beforeAll(async () => {
    const leftoverRepos = await db.select().from(repositories).where(
      sql`${repositories.name} LIKE 'symbols-%' OR ${repositories.name} LIKE 'poller-%'`
    );
    for (const repo of leftoverRepos) {
      await db.delete(repositories).where(eq(repositories.id, repo.id));
    }
  });

  afterAll(async () => {
    await db.delete(repositories).where(sql`${repositories.name} LIKE 'symbols-%'`);
  });
  it("extracts symbols for all target semantic kinds and keeps job running", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `symbols-test-${Date.now()}`,
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

    const FILE_CONTENT = `import { foo, bar } from './utils';
import express from 'express';
import * as helpers from './helpers';
import './side-effect';
import {} from 'empty';

export function greet(name: string): void { return name; }

export class UserService {
  constructor() {}
  async fetch(id: string) { return null; }
}

export interface User { id: string; name: string; }

export const VERSION = '1.0';

export { utils } from './utils';

export default function hello() { return 'hi'; }

const arr = [1, 2, 3].map(x => function inner() { return x; });
function outer() {
  function inner() { }
  return inner;
}

export default class App {}

export default class {}

export default myDefaultExport;

export namespace Internal { export const x = 1; }
`;

    const [file] = await db.insert(files).values({
      repositoryId: repo.id,
      path: "src/index.ts",
      size: FILE_CONTENT.length,
      language: "typescript",
      skipped: false,
      skipReason: null,
      content: FILE_CONTENT,
      category: null
    }).returning();

    await pollOnce(repo.id);

    const [updatedJob] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, job.id));
    expect(updatedJob.status).toBe("running");
    expect(updatedJob.parsingCompletedAt).not.toBeNull();
    expect(updatedJob.embeddingCompletedAt).toBeNull();

    const rows: SymbolRow[] = await db.select().from(symbolsTable).where(eq(symbolsTable.fileId, file.id));
    const byKindName = new Map<string, SymbolRow>();
    for (const r of rows) {
      byKindName.set(`${r.kind}:${r.name}`, r);
    }

    expect(rows.length).toBe(23);

    // Named imports
    expect(byKindName.get("import:foo")?.startLine).toBe(1);
    expect(byKindName.get("import:bar")?.startLine).toBe(1);

    // Default import
    expect(byKindName.get("import:express")?.startLine).toBe(2);

    // Namespace import
    expect(byKindName.get("import:helpers")?.startLine).toBe(3);

    // Side-effect-only imports → zero rows (verified by total count)

    // Function definition + export
    expect(byKindName.get("function:greet")?.startLine).toBe(7);
    expect(byKindName.get("export:greet")?.startLine).toBe(7);

    // Class definition + export
    expect(byKindName.get("class:UserService")?.startLine).toBe(9);
    expect(byKindName.get("export:UserService")?.startLine).toBe(9);

    // Class methods
    expect(byKindName.get("function:constructor")?.startLine).toBe(10);
    expect(byKindName.get("function:fetch")?.startLine).toBe(11);

    // Interface definition + export
    expect(byKindName.get("interface:User")?.startLine).toBe(14);
    expect(byKindName.get("export:User")?.startLine).toBe(14);

    // Export const
    expect(byKindName.get("export:VERSION")?.startLine).toBe(16);

    // Named re-export braces
    expect(byKindName.get("export:utils")?.startLine).toBe(18);

    // Default export named function
    expect(byKindName.get("function:hello")?.startLine).toBe(20);
    expect(byKindName.get("export:hello")?.startLine).toBe(20);

    // Top-level function
    expect(byKindName.get("function:outer")?.startLine).toBe(23);

    // Nested function NOT extracted (scope limit)
    expect(byKindName.has("function:inner")).toBe(false);

    // Default export named class
    expect(byKindName.get("class:App")?.startLine).toBe(28);
    expect(byKindName.get("export:App")?.startLine).toBe(28);

    // Default export anonymous class
    expect(byKindName.get("export:default")?.startLine).toBe(30);

    // Default export identifier
    expect(byKindName.get("export:myDefaultExport")?.startLine).toBe(32);

    // Export namespace
    expect(byKindName.get("export:Internal")?.startLine).toBe(34);
    expect(byKindName.get("export:x")?.startLine).toBe(34);
  });

  it("does not crash the job when one file has a syntax error", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `symbols-syntax-error-${Date.now()}`,
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

    await db.insert(files).values([
      {
        repositoryId: repo.id,
        path: "src/good.ts",
        size: 20,
        language: "typescript",
        skipped: false,
        skipReason: null,
        content: `function good() { return 1; }`,
        category: null
      },
      {
        repositoryId: repo.id,
        path: "src/bad.ts",
        size: 15,
        language: "typescript",
        skipped: false,
        skipReason: null,
        content: `export const = ;`,
        category: null
      }
    ]);

    await pollOnce(repo.id);

    const [updatedJob] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, job.id));
    expect(updatedJob.status).toBe("running");
    expect(updatedJob.parsingCompletedAt).not.toBeNull();

    const [goodFile] = await db.select().from(files).where(eq(files.path, "src/good.ts"));
    const [badFile] = await db.select().from(files).where(eq(files.path, "src/bad.ts"));

    const goodSymbols = await db.select().from(symbolsTable).where(eq(symbolsTable.fileId, goodFile.id));
    expect(goodSymbols.length).toBeGreaterThanOrEqual(1);

    const badSymbols = await db.select().from(symbolsTable).where(eq(symbolsTable.fileId, badFile.id));
    expect(badSymbols.length).toBe(0);
  });

  it("completes parsing with zero symbols when no eligible files exist", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `symbols-zero-files-${Date.now()}`,
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

    await db.insert(files).values([
      {
        repositoryId: repo.id,
        path: "src/app.py",
        size: 20,
        language: "python",
        skipped: false,
        skipReason: null,
        content: `print("hello")\n`,
        category: null
      },
      {
        repositoryId: repo.id,
        path: "src/skipped.txt",
        size: 10,
        language: null,
        skipped: true,
        skipReason: "binary_file",
        content: null,
        category: null
      }
    ]);

    await pollOnce(repo.id);

    const [updatedJob] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, job.id));
    expect(updatedJob.status).toBe("running");
    expect(updatedJob.parsingCompletedAt).not.toBeNull();
    expect(updatedJob.embeddingCompletedAt).toBeNull();

    const repoFiles = await db.select().from(files).where(eq(files.repositoryId, repo.id));
    const fileIds = repoFiles.map(f => f.id);
    const allSymbols = fileIds.length === 0
      ? []
      : await db.select().from(symbolsTable).where(inArray(symbolsTable.fileId, fileIds));
    expect(allSymbols).toHaveLength(0);
  });
});
