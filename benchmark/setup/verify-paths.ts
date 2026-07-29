// Verifies every groundTruthFiles path AND every trapFile path in the
// manifest exists as a real, NON-SKIPPED file in trailhead_bench at the
// pinned SHA. Reports failures; never silently fixes them.
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { eq, and } from "drizzle-orm";
import { benchDb, closeBenchDb } from "./db";
import { files, repositories } from "../../src/server/db/schema";
import type { BenchmarkManifest, QueryCategory } from "./manifest-types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(__dirname, "..", "manifest.json");

interface Check {
  queryId: string;
  category: string;
  repoName: string;
  path: string;
  role: "groundTruth" | "trap";
  exists: boolean;
  skipped: boolean | null;
  ok: boolean;
}

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as BenchmarkManifest;
  const categories: QueryCategory[] = ["known_code", "semantic", "documentation", "filename_trap"];

  const repoIdByName = new Map<string, string>();
  for (const repo of manifest.corpus) {
    const [row] = await benchDb.select().from(repositories).where(eq(repositories.name, repo.name));
    if (!row) throw new Error(`Corpus repo "${repo.name}" not found in trailhead_bench — run benchmark:setup.`);
    repoIdByName.set(repo.name, row.id);
  }

  const checks: Check[] = [];

  async function check(queryId: string, category: string, repoName: string, path: string, role: "groundTruth" | "trap") {
    const repositoryId = repoIdByName.get(repoName);
    if (!repositoryId) {
      checks.push({ queryId, category, repoName, path, role, exists: false, skipped: null, ok: false });
      return;
    }
    const [row] = await benchDb
      .select()
      .from(files)
      .where(and(eq(files.repositoryId, repositoryId), eq(files.path, path)));
    const exists = !!row;
    const skipped = row ? row.skipped : null;
    checks.push({ queryId, category, repoName, path, role, exists, skipped, ok: exists && skipped === false });
  }

  for (const category of categories) {
    for (const q of manifest.queries[category]) {
      for (const gt of q.groundTruthFiles) {
        await check(q.id, category, q.repoName, gt, "groundTruth");
      }
      if (q.trapFile) {
        await check(q.id, category, q.repoName, q.trapFile, "trap");
      }
    }
  }

  const failures = checks.filter((c) => !c.ok);

  console.log(`Checked ${checks.length} paths (${checks.filter((c) => c.role === "groundTruth").length} ground-truth, ${checks.filter((c) => c.role === "trap").length} trap).`);
  console.log("");
  for (const c of checks) {
    const status = c.ok ? "OK     " : c.exists ? "SKIPPED" : "MISSING";
    console.log(`${status} | ${c.queryId.padEnd(8)} | ${c.role.padEnd(11)} | ${c.repoName.padEnd(34)} | ${c.path}`);
  }
  console.log("");

  if (failures.length === 0) {
    console.log("ALL PATHS VERIFIED: every ground-truth and trap file exists and is non-skipped.");
  } else {
    console.log(`FAILURES (${failures.length}) — reported, NOT fixed:`);
    for (const f of failures) {
      console.log(`  ${f.queryId} (${f.role}) ${f.repoName} :: ${f.path} — ${f.exists ? "exists but is SKIPPED" : "DOES NOT EXIST"}`);
    }
    process.exitCode = 1;
  }

  await closeBenchDb();
}

main().catch(async (e) => {
  console.error(e);
  await closeBenchDb();
  process.exit(1);
});
