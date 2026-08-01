import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { repositories, analysisJobs, files } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { validateZipSafety, fetchGithubRepoInfo, fetchGithubZipball, stripGitHubTopLevel, SecurityError } from "@/server/services/preprocessing";
import { randomUUID } from "crypto";

async function parseFormData(request: NextRequest): Promise<{ source: "github" | "zip"; url?: string; branch?: string; file?: File } | null> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return null;
  }
  const formData = await request.formData();
  const source = formData.get("source");
  if (source !== "github" && source !== "zip") return null;

  const result: { source: "github" | "zip"; url?: string; branch?: string; file?: File } = { source };
  if (source === "github") {
    const url = formData.get("url");
    const branch = formData.get("branch");
    if (typeof url !== "string" || !url.trim()) return null;
    result.url = url.trim();
    if (typeof branch === "string" && branch.trim()) result.branch = branch.trim();
  } else {
    const file = formData.get("file");
    if (!(file instanceof File)) return null;
    result.file = file;
  }
  return result;
}

export async function GET() {
  try {
    const allRepos = await db.select().from(repositories).orderBy(desc(repositories.createdAt));
    const allJobs = await db.select().from(analysisJobs).orderBy(desc(analysisJobs.createdAt));
    const latestJobByRepo = new Map<string, typeof allJobs[0]>();
    for (const j of allJobs) {
      if (!latestJobByRepo.has(j.repositoryId)) {
        latestJobByRepo.set(j.repositoryId, j);
      }
    }
    const result = allRepos.map((r) => ({
      ...r,
      analysisJob: latestJobByRepo.get(r.id) || null
    }));
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/repositories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await parseFormData(request);
    if (!formData) {
      return NextResponse.json({ error: "Invalid request: expected multipart/form-data with source='github' or 'zip'" }, { status: 400 });
    }

      if (formData.source === "github") {
        try {
          const repoInfo = await fetchGithubRepoInfo(formData.url!);
          const selectedBranch = formData.branch && repoInfo.branches.includes(formData.branch) ? formData.branch : repoInfo.defaultBranch;

          let zipBuffer: Buffer;
          try {
            zipBuffer = await fetchGithubZipball(repoInfo.owner, repoInfo.repo, repoInfo.commitSha || repoInfo.defaultBranch);
          } catch (e) {
            if (e instanceof Error && e.message.includes("150MB")) {
              return NextResponse.json({ error: "GitHub archive exceeds 150MB limit" }, { status: 413 });
            }
            return NextResponse.json({ error: `Failed to download GitHub archive: ${(e as Error).message}` }, { status: 502 });
          }

          const strippedBuffer = stripGitHubTopLevel(zipBuffer);

          let preprocessing;
          try {
            preprocessing = await validateZipSafety(strippedBuffer, randomUUID());
          } catch (e) {
            if (e instanceof SecurityError) {
              return NextResponse.json({ error: e.message }, { status: 422 });
            }
            throw e;
          }

          // Atomic: repository, job, and file rows commit together or not at
          // all. Previously these were three independent statements, so a
          // failing file insert left an orphaned repo+job behind that the
          // poller would then "complete" with zero files.
          const repo = await db.transaction(async (tx) => {
            const [created] = await tx.insert(repositories).values({
              name: `${repoInfo.owner}/${repoInfo.repo}`,
              status: "queued",
              source: "github",
              sourceUrl: formData.url,
              commitSha: repoInfo.commitSha
            }).returning();

            await tx.insert(analysisJobs).values({
              repositoryId: created.id,
              status: "queued",
              truncated: preprocessing.truncated
            });

            const fileInserts = preprocessing.files.map((f) => ({
              repositoryId: created.id,
              path: f.path,
              size: f.size,
              language: f.language,
              content: f.content,
              category: f.category,
              skipped: f.skipped,
              skipReason: f.skipReason
            }));
            if (fileInserts.length > 0) {
              await tx.insert(files).values(fileInserts);
            }

            return created;
          });

          const updated = await db.select().from(repositories).where(eq(repositories.id, repo.id)).then((r) => r[0]);
          return NextResponse.json(updated, { status: 201 });
        } catch (e) {
          if (e instanceof Error) {
            if (e.message.includes("private")) {
              return NextResponse.json({ error: "Repository is private" }, { status: 400 });
            }
            if (e.message.includes("HEAD commit fetch failed")) {
              return NextResponse.json({ error: "Failed to fetch repository commit from GitHub" }, { status: 502 });
            }
            if (e.message.includes("not found") || e.message.includes("Invalid GitHub URL")) {
              return NextResponse.json({ error: e.message }, { status: 400 });
            }
          }
          throw e;
        }
      }

      if (formData.source === "zip") {
        const file = formData.file!;
        const buffer = Buffer.from(await file.arrayBuffer());

        if (buffer.length > 150 * 1024 * 1024) {
          return NextResponse.json({ error: "ZIP file exceeds 150MB limit" }, { status: 413 });
        }

        try {
          const preprocessing = await validateZipSafety(buffer, randomUUID());

          // Atomic — same reasoning as the github branch above.
          const repo = await db.transaction(async (tx) => {
            const [created] = await tx.insert(repositories).values({
              name: file.name.replace(/\.zip$/i, ""),
              status: "queued",
              source: "zip",
              sourceUrl: null,
              commitSha: null
            }).returning();

            await tx.insert(analysisJobs).values({
              repositoryId: created.id,
              status: "queued",
              truncated: preprocessing.truncated,
              parsingCompletedAt: null,
              embeddingCompletedAt: null
            });

            const fileInserts = preprocessing.files.map((f) => ({
              repositoryId: created.id,
              path: f.path,
              size: f.size,
              language: f.language,
              content: f.content,
              category: f.category,
              skipped: f.skipped,
              skipReason: f.skipReason
            }));
            if (fileInserts.length > 0) {
              await tx.insert(files).values(fileInserts);
            }

            return created;
          });

          const updated = await db.select().from(repositories).where(eq(repositories.id, repo.id)).then((r) => r[0]);
          return NextResponse.json(updated, { status: 201 });
        } catch (e) {
          if (e instanceof SyntaxError) {
            return NextResponse.json({ error: "Invalid ZIP archive" }, { status: 400 });
          }
          if (e instanceof SecurityError) {
            return NextResponse.json({ error: e.message }, { status: 422 });
          }
          if (e instanceof Error && e.message.includes("ADM-ZIP")) {
            return NextResponse.json({ error: "Invalid ZIP archive" }, { status: 400 });
          }
          throw e;
        }
      }

    return NextResponse.json({ error: "Unsupported source type" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/repositories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
