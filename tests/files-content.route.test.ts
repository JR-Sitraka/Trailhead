import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { GET as GetFileContent } from "../src/app/api/repositories/[id]/files/[...path]/route";
import { db } from "../src/server/db";
import { repositories, files } from "../src/server/db/schema";
import { eq, like } from "drizzle-orm";

const PREFIX = `repos-file-content-${Date.now()}`;

async function requestFileContent(id: string, path: string) {
  const req = new NextRequest(`http://localhost/api/repositories/${id}/files/${encodeURIComponent(path)}`);
  return GetFileContent(req, { params: { id, path: [path] } });
}

describe("GET /api/repositories/:id/files/[...path]", () => {
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
      size: 18,
      language: "typescript",
      skipped: false,
      skipReason: null,
      category: "entrypoint",
      content: "export const x = 1;\nexport const y = 2;\n"
    });

    await db.insert(files).values({
      repositoryId: ready.id,
      path: "README.md",
      size: 10,
      language: "markdown",
      skipped: true,
      skipReason: "binary_file",
      category: null,
      content: null
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
      size: 5,
      language: "typescript",
      skipped: false,
      skipReason: null,
      category: "entrypoint",
      content: "const app = 1;"
    });
  });

  afterAll(async () => {
    const toDelete = await db.select().from(repositories).where(like(repositories.name, `${PREFIX}%`));
    for (const r of toDelete) {
      await db.delete(repositories).where(eq(repositories.id, r.id));
    }
  });

  it("returns 200 with file content for a ready, non-skipped file", async () => {
    const res = await requestFileContent(readyRepoId, "src/index.ts");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("content");
    expect(data).toHaveProperty("path", "src/index.ts");
    expect(data.content).toBe("export const x = 1;\nexport const y = 2;\n");
    expect(data).not.toHaveProperty("skipReason");
  });

  it("returns 409 for a skipped file with its skipReason", async () => {
    const res = await requestFileContent(readyRepoId, "README.md");
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe("File was skipped during analysis");
    expect(data.skipReason).toBe("binary_file");
  });

  it("returns 404 for a file path that does not exist in the repo", async () => {
    const res = await requestFileContent(readyRepoId, "nonexistent.txt");
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("File not found");
  });

  it("returns 404 for a nonexistent repository", async () => {
    const res = await requestFileContent("00000000-0000-0000-0000-000000000000", "src/index.ts");
    expect(res.status).toBe(404);
  });

  it("returns 409 for a repository that is not ready", async () => {
    const res = await requestFileContent(analyzingRepoId, "src/app.ts");
    expect(res.status).toBe(409);
  });

  it("handles nested file paths", async () => {
    const [nestedReady] = await db.insert(repositories).values({
      name: `${PREFIX}-nested`,
      source: "zip",
      sourceUrl: null,
      commitSha: "def5678",
      status: "ready"
    }).returning();

    await db.insert(files).values({
      repositoryId: nestedReady.id,
      path: "src/app/components/Header.tsx",
      size: 20,
      language: "typescript",
      skipped: false,
      skipReason: null,
      category: null,
      content: "export const Header = () => null;\n"
    });

    const res = await requestFileContent(nestedReady.id, "src/app/components/Header.tsx");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.path).toBe("src/app/components/Header.tsx");
    expect(data.content).toBe("export const Header = () => null;\n");

    await db.delete(repositories).where(eq(repositories.id, nestedReady.id));
  });
});
