import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { GET as GetFiles } from "../src/app/api/repositories/[id]/files/route";
import { db } from "../src/server/db";
import { repositories, analysisJobs, files } from "../src/server/db/schema";
import { eq, like } from "drizzle-orm";

const PREFIX = `repos-files-${Date.now()}`;

async function getFiles(id: string) {
  const req = new NextRequest(`http://localhost/api/repositories/${id}/files`);
  return GetFiles(req, { params: { id } });
}

describe("GET /api/repositories/:id/files", () => {
  let readyRepoId: string;
  let analyzingRepoId: string;

  beforeAll(async () => {
    const [ready] = await db.insert(repositories).values({
      name: `${PREFIX}-ready`,
      source: "zip",
      sourceUrl: null,
      commitSha: "abc1234",
      status: "ready"
    }).returning();
    readyRepoId = ready.id;

    await db.insert(files).values({
      repositoryId: ready.id,
      path: "src/index.ts",
      size: 100,
      language: "typescript",
      skipped: false,
      skipReason: null,
      category: "entrypoint",
      content: "export const x = 1;"
    });

    const [analyzing] = await db.insert(repositories).values({
      name: `${PREFIX}-analyzing`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "analyzing"
    }).returning();
    analyzingRepoId = analyzing.id;

    await db.insert(files).values({
      repositoryId: analyzing.id,
      path: "src/app.ts",
      size: 50,
      language: "typescript",
      skipped: false,
      skipReason: null,
      category: "entrypoint",
      content: "export const app = 1;"
    });
  });

  afterAll(async () => {
    const toDelete = await db.select().from(repositories).where(like(repositories.name, `${PREFIX}%`));
    for (const r of toDelete) {
      await db.delete(repositories).where(eq(repositories.id, r.id));
    }
  });

  it("returns 200 with file rows for a ready repository", async () => {
    const res = await getFiles(readyRepoId);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0]).toHaveProperty("path");
    expect(data[0]).toHaveProperty("skipped");
    expect(data[0]).toHaveProperty("category");
  });

  it("returns 404 for a nonexistent repository", async () => {
    const res = await getFiles("00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
  });

  it("returns 409 for a repository that is not ready", async () => {
    const res = await getFiles(analyzingRepoId);
    expect(res.status).toBe(409);
  });
});
