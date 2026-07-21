import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/repositories/route";
import { SecurityError } from "../src/server/services/preprocessing";
import { db } from "../src/server/db";
import { repositories, analysisJobs } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

function createZip(entries: Array<{ name: string; content?: string | Buffer }>): Buffer {
  const zip = new AdmZip();
  for (const entry of entries) {
    zip.addFile(entry.name, Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content || "hello world"));
  }
  return zip.toBuffer();
}

function createZipWithRawPath(entryName: string, content: string | Buffer): Buffer {
  const zip = new AdmZip();
  const placeholder = zip.addFile("placeholder", Buffer.from("placeholder"));
  placeholder.entryName = entryName;
  placeholder.setData(content);
  return zip.toBuffer();
}

function createZipWithSymlink(entries: Array<{ name: string; linkTarget?: string; content?: string | Buffer }>): Buffer {
  const zip = new AdmZip();
  for (const entry of entries) {
    if (entry.linkTarget !== undefined) {
      const zipEntry = zip.addFile(entry.name, Buffer.from(entry.linkTarget));
      zipEntry.attr = (0xA000 | 0o644) * 0x10000;
    } else {
      zip.addFile(entry.name, Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content || "hello world"));
    }
  }
  return zip.toBuffer();
}

async function makeZipRequest(zipBuffer: Buffer, fileName = "test.zip"): Promise<Response> {
  const formData = new FormData();
  formData.append("source", "zip");
  const file = new File([zipBuffer as BlobPart], fileName, { type: "application/zip" });
  formData.append("file", file);

  const request = new NextRequest("http://localhost:3000/api/repositories", {
    method: "POST",
    body: formData,
  });

  return POST(request);
}

describe("POST /api/repositories — ZIP upload integration", () => {
  it("returns 422 for a ZIP with path-traversal entry, and no Repository row is created", async () => {
    const uniqueName = `evil-traversal-${Date.now()}`;
    const zip = createZipWithRawPath("../../../etc/passwd", "root:x:0:0");

    const response = await makeZipRequest(zip, `${uniqueName}.zip`);
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toContain("Path traversal");

    const rows = await db.select().from(repositories);
    const matching = rows.filter((r) => r.name === uniqueName);
    expect(matching.length).toBe(0);
  }, 30000);

  it("returns 422 for a ZIP with a real Unix symlink entry pointing outside root, and no Repository row is created", async () => {
    const uniqueName = `evil-symlink-${Date.now()}`;
    const zip = createZipWithSymlink([
      { name: "evil-symlink", linkTarget: "../../../etc/passwd" }
    ]);

    const response = await makeZipRequest(zip, `${uniqueName}.zip`);
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toContain("Unsafe symlink");

    const rows = await db.select().from(repositories);
    const matching = rows.filter((r) => r.name === uniqueName);
    expect(matching.length).toBe(0);
  }, 30000);

  it("returns 201 and creates a Repository row with status 'queued' for a valid clean ZIP", async () => {
    const uniqueName = `valid-clean-${Date.now()}`;
    const zip = createZip([
      { name: "src/index.ts", content: "export const x = 1;" },
      { name: "README.md", content: "# Valid" }
    ]);

    const response = await makeZipRequest(zip, `${uniqueName}.zip`);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.status).toBe("queued");

    const rows = await db.select().from(repositories).where(eq(repositories.name, uniqueName));
    expect(rows.length).toBe(1);
    expect(rows[0].status).toBe("queued");

    const jobs = await db.select().from(analysisJobs).where(eq(analysisJobs.repositoryId, rows[0].id));
    expect(jobs.length).toBe(1);
    expect(jobs[0].status).toBe("queued");
  }, 30000);
});

describe("POST /api/repositories — ZIP size limit", () => {
  it("rejects a ZIP buffer over 150MB with 413 and creates no Repository row", async () => {
    const oversizedBuffer = Buffer.alloc(151 * 1024 * 1024);
    const response = await makeZipRequest(oversizedBuffer, "huge.zip");
    expect(response.status).toBe(413);
    const body = await response.json();
    expect(body.error).toContain("150MB");

    const rows = await db.select().from(repositories);
    const matching = rows.filter((r) => r.name === "huge");
    expect(matching.length).toBe(0);
  }, 60000);
});

describe("POST /api/repositories — invalid ZIP archive", () => {
  it("rejects a buffer that is not a valid ZIP with 400 and creates no Repository row", async () => {
    const invalidBuffer = Buffer.from("this is not a zip file at all");
    const response = await makeZipRequest(invalidBuffer, "corrupt.zip");
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid ZIP archive");

    const rows = await db.select().from(repositories);
    const matching = rows.filter((r) => r.name === "corrupt");
    expect(matching.length).toBe(0);
  }, 30000);
});

describe("POST /api/repositories — GitHub import integration", () => {
  async function makeGithubRequest(url: string): Promise<Response> {
    const formData = new FormData();
    formData.append("source", "github");
    formData.append("url", url);

    const request = new NextRequest("http://localhost:3000/api/repositories", {
      method: "POST",
      body: formData,
    });

    return POST(request);
  }

  it("accepts a valid public GitHub URL, returns 201, and persists Repository + AnalysisJob rows", async () => {
    const url = "https://github.com/octocat/Hello-World";
    const response = await makeGithubRequest(url);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.status).toBe("queued");
    expect(body.source).toBe("github");
    expect(body.sourceUrl).toBe(url);

    const rows = await db.select().from(repositories).where(eq(repositories.name, "octocat/Hello-World"));
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].status).toBe("queued");
    expect(rows[0].source).toBe("github");
    expect(rows[0].sourceUrl).toBe(url);

    const jobs = await db.select().from(analysisJobs).where(eq(analysisJobs.repositoryId, rows[0].id));
    expect(jobs.length).toBeGreaterThanOrEqual(1);
    expect(jobs[0].status).toBe("queued");
  }, 60000);

  it("rejects an invalid/malformed GitHub URL with 400 and creates no row", async () => {
    const url = "not-a-github-url";
    const response = await makeGithubRequest(url);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid GitHub URL");

    const rows = await db.select().from(repositories);
    const matching = rows.filter((r) => r.sourceUrl === url);
    expect(matching.length).toBe(0);
  }, 30000);

  it("rejects a nonexistent GitHub repo with 400 and creates no row", async () => {
    const url = "https://github.com/trailhead-nonexistent-xyz/repo-404-test";
    const response = await makeGithubRequest(url);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Repository not found");

    const rows = await db.select().from(repositories);
    const matching = rows.filter((r) => r.sourceUrl === url);
    expect(matching.length).toBe(0);
  }, 30000);

  it("rejects a private GitHub repo with 400 and a distinct message, and creates no row", async () => {
    const url = "https://github.com/JR-Sitraka/Test";
    const response = await makeGithubRequest(url);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Repository is private");

    const rows = await db.select().from(repositories);
    const matching = rows.filter((r) => r.sourceUrl === url);
    expect(matching.length).toBe(0);
  }, 30000);
});
