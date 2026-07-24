import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(path: string): void {
  try {
    const content = readFileSync(path, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env not found
  }
}

loadEnvFile(join(__dirname, "..", ".env"));

(async function main() {
  const { db } = await import("../src/server/db");
  const { repositories, analysisJobs, files } = await import("../src/server/db/schema");
  const { eq, sql, desc } = await import("drizzle-orm");

  const repos = await db
    .select()
    .from(repositories)
    .where(sql`${repositories.name} LIKE 'explorer-live%'`);

  for (const repo of repos) {
    const jobs = await db
      .select()
      .from(analysisJobs)
      .where(eq(analysisJobs.repositoryId, repo.id))
      .orderBy(desc(analysisJobs.createdAt))
      .limit(1);
    const job = jobs[0] ?? null;

    const fRows = await db
      .select()
      .from(files)
      .where(eq(files.repositoryId, repo.id))
      .where(eq(files.path, ".gitignore"))
      .limit(1);
    const gitignore = fRows[0] ?? null;

    console.log(JSON.stringify({
      repoId: repo.id,
      repoName: repo.name,
      repoCreatedAt: repo.createdAt,
      jobId: job?.id ?? null,
      jobCreatedAt: job?.createdAt ?? null,
      jobStatus: job?.status ?? null,
      filePath: gitignore?.path ?? null,
      fileSkipped: gitignore?.skipped ?? null,
      fileSkipReason: gitignore?.skipReason ?? null,
    }));
  }

  process.exit(0);
}());
