import { describe, it, expect, vi, afterEach } from "vitest";
import AdmZip from "adm-zip";
import { NextRequest } from "next/server";
import { db } from "../src/server/db";
import { repositories, analysisJobs, files } from "../src/server/db/schema";
import { eq, like } from "drizzle-orm";

// Item 7 Group 1 regression tests. All three cover real, confirmed defects
// found by the boxen/got investigation (2026-08-01), not hypothetical ones:
//   1. NUL-carrying content poisoned the whole file batch (boxen: 0 files).
//   2. The import was non-transactional, so that failure orphaned repo+job.
//   3. The poller marked a zero-file repository 'ready' — a false success.

function createZip(entries: Array<{ name: string; content: string | Buffer }>): Buffer {
  const zip = new AdmZip();
  for (const entry of entries) {
    zip.addFile(entry.name, Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content));
  }
  return zip.toBuffer();
}

// A real AVA snapshot: ASCII header, then a zlib body containing NUL bytes.
// This is byte-for-byte the shape that broke sindresorhus/boxen — the first
// 16 bytes read as clean text, so the header-window check passes it through.
function createAvaSnapshotBytes(): Buffer {
  const header = Buffer.from("AVA Snapshot v3\n");
  const body = Buffer.from([0x01, 0x00, 0x02, 0x00, 0x00, 0x03, 0x41, 0x42, 0x00]);
  return Buffer.concat([header, body]);
}

describe("preprocessing: full-content NUL detection", () => {
  it("skips a NUL-carrying file whose first 16 bytes look like text, without dropping the clean files", async () => {
    const { validateZipSafety } = await import("../src/server/services/preprocessing");

    const snapshot = createAvaSnapshotBytes();
    // Guard the fixture itself: prove the header really does look like text,
    // otherwise this test could pass for the wrong reason.
    expect(snapshot.subarray(0, 16).includes(0)).toBe(false);
    expect(snapshot.includes(0)).toBe(true);

    const zip = createZip([
      { name: "tests/snapshots/main.js.snap", content: snapshot },
      { name: "index.js", content: "export const x = 1;" }
    ]);

    const result = await validateZipSafety(zip, `test-nul-${Date.now()}`);

    const snap = result.files.find((f) => f.path === "tests/snapshots/main.js.snap");
    expect(snap).toBeDefined();
    expect(snap!.skipped).toBe(true);
    expect(snap!.skipReason).toBe("binary_file");
    expect(snap!.content).toBeNull();

    // The clean file must survive — the point is to skip one file, not the batch.
    const clean = result.files.find((f) => f.path === "index.js");
    expect(clean).toBeDefined();
    expect(clean!.skipped).toBe(false);
    expect(clean!.content).toContain("export const x = 1;");

    // Nothing that reaches the DB may carry a NUL.
    for (const f of result.files) {
      if (f.content !== null) expect(f.content.includes("\u0000")).toBe(false);
    }
  }, 15000);

  it("catches NUL content under an extension that is not on the binary list", async () => {
    const { validateZipSafety } = await import("../src/server/services/preprocessing");

    // .txt is not in BINARY_EXTENSIONS — only the full-content scan can catch
    // this, so it proves the durable fix rather than the .snap belt-and-braces.
    const zip = createZip([
      { name: "notes.txt", content: Buffer.concat([Buffer.from("plain text header"), Buffer.from([0x00]), Buffer.from("tail")]) },
      { name: "index.js", content: "export const x = 1;" }
    ]);

    const result = await validateZipSafety(zip, `test-nul-txt-${Date.now()}`);

    const poisoned = result.files.find((f) => f.path === "notes.txt");
    expect(poisoned).toBeDefined();
    expect(poisoned!.skipped).toBe(true);
    expect(poisoned!.skipReason).toBe("binary_file");
    expect(poisoned!.content).toBeNull();
  }, 15000);
});

describe("import atomicity: a failing file insert leaves no orphaned rows", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("../src/server/services/preprocessing");
  });

  it("rolls back the repository and job rows when the file insert fails for real", async () => {
    const marker = `atomicity-test-${Date.now()}`;

    // Deliberately bypass the NUL fix to reproduce the ORIGINAL failure at the
    // database layer: a real Postgres rejection of U+0000 in a `text` column,
    // occurring after the repo and job rows have been inserted. This is the
    // exact sequence that orphaned sindresorhus/boxen.
    vi.doMock("../src/server/services/preprocessing", async (importOriginal) => {
      const actual = await importOriginal<typeof import("../src/server/services/preprocessing")>();
      return {
        ...actual,
        validateZipSafety: async () => ({
          files: [
            { path: "clean.js", size: 10, language: "javascript", skipped: false, skipReason: null, content: "const a = 1;", category: null },
            { path: "poison.txt", size: 10, language: null, skipped: false, skipReason: null, content: "bad\u0000value", category: null }
          ],
          totalFiles: 2,
          truncated: false,
          totalUnpackedSize: 20
        })
      };
    });

    const { POST } = await import("../src/app/api/repositories/route");

    const formData = new FormData();
    formData.append("source", "zip");
    const zipBuffer = createZip([{ name: "index.js", content: "export const x = 1;" }]);
    formData.append("file", new File([zipBuffer as BlobPart], `${marker}.zip`, { type: "application/zip" }));

    const response = await POST(
      new NextRequest("http://localhost:3000/api/repositories", { method: "POST", body: formData })
    );

    // The import must fail loudly, not half-succeed.
    expect(response.status).toBe(500);

    // And must leave nothing behind.
    const orphanRepos = await db.select().from(repositories).where(like(repositories.name, `${marker}%`));
    expect(orphanRepos).toHaveLength(0);
  }, 20000);
});

describe("orphaned-repository reconciliation", () => {
  it("reconciles a repository stuck in 'analyzing' with no job row at all", async () => {
    const { reconcileOrphanedRepositories } = await import("../src/server/poller");

    // sindresorhus/got's exact real state in trailhead_dev: repository row
    // surviving in 'analyzing' with every one of its job rows gone, so nothing
    // will ever pick it up again and the UI polls forever.
    const [repo] = await db.insert(repositories).values({
      name: `orphan-analyzing-${Date.now()}`,
      source: "github",
      sourceUrl: "https://github.com/sindresorhus/got",
      commitSha: "e3924aa1e53a6ca3eb93a43618ce532442a89b40",
      status: "analyzing"
    }).returning();

    const jobsBefore = await db.select().from(analysisJobs).where(eq(analysisJobs.repositoryId, repo.id));
    expect(jobsBefore).toHaveLength(0);

    const reconciled = await reconcileOrphanedRepositories(repo.id);

    expect(reconciled).toContain(repo.id);
    const [after] = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(after.status).toBe("failed");

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  }, 20000);

  it("leaves a repository alone while it still has a live job", async () => {
    const { reconcileOrphanedRepositories } = await import("../src/server/poller");

    const [repo] = await db.insert(repositories).values({
      name: `orphan-live-job-${Date.now()}`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "analyzing"
    }).returning();

    // A genuinely in-flight analysis must never be reconciled out from under
    // itself — this is the guard against the fix eating real work.
    await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: "running",
      truncated: false,
      parsingCompletedAt: null,
      embeddingCompletedAt: null
    });

    const reconciled = await reconcileOrphanedRepositories(repo.id);

    expect(reconciled).not.toContain(repo.id);
    const [after] = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(after.status).toBe("analyzing");

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  }, 20000);

  it("leaves an already-ready repository alone", async () => {
    const { reconcileOrphanedRepositories } = await import("../src/server/poller");

    const [repo] = await db.insert(repositories).values({
      name: `orphan-ready-${Date.now()}`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "ready"
    }).returning();

    const reconciled = await reconcileOrphanedRepositories(repo.id);

    expect(reconciled).not.toContain(repo.id);
    const [after] = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(after.status).toBe("ready");

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  }, 20000);
});

describe("poller zero-file guard", () => {
  it("marks a job failed instead of ready when the repository has no analyzable files", async () => {
    const { pollOnce } = await import("../src/server/poller");

    const [repo] = await db.insert(repositories).values({
      name: `zero-file-guard-${Date.now()}`,
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

    // No File rows at all — exactly boxen's post-failed-import state.
    await pollOnce(repo.id);

    const [finalJob] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, job.id));
    const [finalRepo] = await db.select().from(repositories).where(eq(repositories.id, repo.id));

    expect(finalJob.status).toBe("failed");
    expect(finalRepo.status).not.toBe("ready");
    expect(finalRepo.status).toBe("failed");

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  }, 30000);

  it("still reaches ready when the repository has real analyzable content", async () => {
    const { pollOnce } = await import("../src/server/poller");

    const [repo] = await db.insert(repositories).values({
      name: `zero-file-guard-positive-${Date.now()}`,
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

    await db.insert(files).values({
      repositoryId: repo.id,
      path: "index.js",
      size: 24,
      language: "javascript",
      content: "export const x = 1;\n",
      skipped: false,
      skipReason: null
    });

    await pollOnce(repo.id);

    const [finalJob] = await db.select().from(analysisJobs).where(eq(analysisJobs.id, job.id));
    const [finalRepo] = await db.select().from(repositories).where(eq(repositories.id, repo.id));

    expect(finalJob.status).toBe("completed");
    expect(finalRepo.status).toBe("ready");

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  }, 60000);
});
