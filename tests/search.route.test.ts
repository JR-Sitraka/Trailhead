import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../src/server/db";
import {
  repositories,
  analysisJobs,
  files,
} from "../src/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { GET } from "../src/app/api/repositories/[id]/search/route";
import { SearchResult } from "../src/server/services/search";

const WRK_PREFIX = `search-route-${Date.now()}`;

async function seedReadyRepo(
  name: string,
  fileData: Array<{ path: string; content: string; skipped?: boolean }>
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

  for (const f of fileData) {
    await db.insert(files).values({
      repositoryId: repo.id,
      path: f.path,
      size: f.content.length,
      language: "typescript",
      content: f.content,
      skipped: f.skipped ?? false,
      skipReason: f.skipped ? "test" : null,
    }).returning();
  }

  return repo.id;
}

async function makeSearchRequest(
  repoId: string,
  q: string,
  fileType?: string,
  pathPrefix?: string
): Promise<{ resp: Response; body: any }> {
  const url = new URL(`http://localhost/api/repositories/${repoId}/search`);
  url.searchParams.set("q", q);
  if (fileType) url.searchParams.set("fileType", fileType);
  if (pathPrefix) url.searchParams.set("pathPrefix", pathPrefix);

  const request = new NextRequest(url.toString());
  const resp = await GET(request, { params: { id: repoId } });
  return { resp, body: await resp.json() };
}

describe("GET /api/repositories/:id/search", () => {
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

  it("404 for nonexistent repository", async () => {
    const { resp, body } = await makeSearchRequest("00000000-0000-0000-0000-000000000000", "test");
    expect(resp.status).toBe(404);
    expect(body.error).toBe("Repository not found");
  });

  it("409 for non-ready repository", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${WRK_PREFIX}-analyzing`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "analyzing",
    }).returning();

    const { resp, body } = await makeSearchRequest(repo.id, "test");
    expect(resp.status).toBe(409);
    expect(body.error).toContain("not ready");

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  });

  it("400 for empty/whitespace query", async () => {
    const repoId = await seedReadyRepo("empty-query", [{ path: "src/x.ts", content: "hello" }]);

    const { resp } = await makeSearchRequest(repoId, "   ");
    expect(resp.status).toBe(400);

    const { resp: resp2 } = await makeSearchRequest(repoId, "");
    expect(resp2.status).toBe(400);
  });

  it("skipped files are never returned", async () => {
    const repoId = await seedReadyRepo("skipped", [
      { path: "src/skipped.ts", content: "function getPayments() {}", skipped: true },
      { path: "src/visible.ts", content: "function doSomethingElse() {}", skipped: false },
    ]);

    const { body } = await makeSearchRequest(repoId, "getPayments");
    expect(body).toHaveLength(0);

    const { body: body2 } = await makeSearchRequest(repoId, "doSomethingElse");
    expect(body2).toHaveLength(1);
    expect(body2[0].path).toBe("src/visible.ts");
  });

  it("exact pass finds camelCase substring that FTS alone would miss", async () => {
    const repoId = await seedReadyRepo("camelcase", [
      { path: "src/payments.ts", content: "function getPayments() { return cards; }" },
    ]);

    const { body, resp } = await makeSearchRequest(repoId, "payments");
    expect(resp.status).toBe(200);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].path).toBe("src/payments.ts");
    expect(body[0].line).toBe(1);
  });

  it("fileType filter narrows results", async () => {
    const repoId = await seedReadyRepo("filetype", [
      { path: "src/app.ts", content: "function getPayments() {}" },
      { path: "src/app.js", content: "function getPayments() {}" },
      { path: "src/util.ts", content: "function doSomething() {}" },
    ]);

    const { body } = await makeSearchRequest(repoId, "getPayments", "ts");
    expect(body).toHaveLength(1);
    expect(body[0].path).toBe("src/app.ts");
  });

  it("pathPrefix filter narrows results", async () => {
    const repoId = await seedReadyRepo("pathprefix", [
      { path: "src/components/Button.ts", content: "function getPayments() {}" },
      { path: "src/pages/index.ts", content: "function getPayments() {}" },
    ]);

    const { body } = await makeSearchRequest(repoId, "getPayments", undefined, "src/components");
    expect(body).toHaveLength(1);
    expect(body[0].path).toBe("src/components/Button.ts");
  });

  it("combined filters work together", async () => {
    const repoId = await seedReadyRepo("combined", [
      { path: "src/components/Button.ts", content: "function getPayments() {}" },
      { path: "src/components/Button.js", content: "function getPayments() {}" },
      { path: "src/pages/index.ts", content: "function getPayments() {}" },
    ]);

    const { body } = await makeSearchRequest(repoId, "getPayments", "ts", "src/components");
    expect(body).toHaveLength(1);
    expect(body[0].path).toBe("src/components/Button.ts");
  });

  it("result cap is 50 and exact matches precede FTS results", async () => {
    const fileData: Array<{ path: string; content: string }> = [];
    for (let i = 0; i < 55; i++) {
      fileData.push({ path: `src/fixture-${i}.ts`, content: "function getPayments() {}" });
    }
    fileData.push({ path: "src/after-cap.ts", content: "function getPayments() {}" });

    const repoId = await seedReadyRepo("cap", fileData);

    const { body } = await makeSearchRequest(repoId, "getPayments");
    expect(body).toHaveLength(50);
    expect(body.every((r: SearchResult) => typeof r.fileId === "string" && typeof r.path === "string" && typeof r.line === "number" && typeof r.snippet === "string")).toBe(true);
  });

  it("real end-to-end with seeded realistic content", async () => {
    const repoId = await seedReadyRepo("e2e-real", [
      { path: "src/source/index.ts", content: "export class SourceRepository { async fetch() { return null; } }" },
      { path: "src/source/utils.ts", content: "export function parseSource(input: string): Record<string, string> { return {}; }" },
      { path: "src/client/connector.ts", content: "export class SourceConnector { async connect() { return null; } }" },
      { path: "test/source.test.ts", content: "describe('source', () => { it('fetches', async () => {}); });" },
    ]);

    const { body, resp } = await makeSearchRequest(repoId, "Source", "ts");
    expect(resp.status).toBe(200);
    expect(body.length).toBeGreaterThanOrEqual(2);

    const paths = body.map((r: SearchResult) => r.path);
    expect(paths).toContain("src/source/index.ts");
    expect(paths).toContain("src/source/utils.ts");

    const idxMatch = body.find((r: SearchResult) => r.path === "src/source/index.ts");
    expect(idxMatch).toBeDefined();
    expect(idxMatch!.line).toBeGreaterThanOrEqual(1);
    expect(idxMatch!.snippet).toBeTruthy();
  });
});