// npm run benchmark — the runner. Validates the manifest (fails fast
// per BENCH-02), computes retrieval/framework/symbol metrics against
// trailhead_bench (never touches dev/test — ADR-008), makes ZERO LLM
// calls, and writes a dated report (JSON + readable summary) to
// benchmark/reports/. Must run correctly against an empty (UNAPPROVED)
// query set, reporting "no queries" rather than crashing.
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { validateManifest, ManifestValidationError } from "./validate";
import { computeRetrievalMetrics, computeFrameworkDetectionMetrics, computeSymbolResolutionMetrics } from "./metrics";
import { closeBenchDb } from "./db";
import type { BenchmarkManifest } from "./manifest-types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BENCHMARK_ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = resolve(BENCHMARK_ROOT, "manifest.json");
const REPORTS_DIR = resolve(BENCHMARK_ROOT, "reports");

const EMBEDDING_MODEL_ID = "Xenova/all-MiniLM-L6-v2";

function loadManifest(): BenchmarkManifest {
  let raw: string;
  try {
    raw = readFileSync(MANIFEST_PATH, "utf8");
  } catch (e) {
    throw new ManifestValidationError(`Manifest not found at ${MANIFEST_PATH}: ${(e as Error).message}`);
  }
  try {
    return JSON.parse(raw) as BenchmarkManifest;
  } catch (e) {
    throw new ManifestValidationError(`Manifest at ${MANIFEST_PATH} is not valid JSON: ${(e as Error).message}`);
  }
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function main() {
  console.log("=== Trailhead Benchmark Runner ===");
  console.log(`Manifest: ${MANIFEST_PATH}`);

  const manifest = loadManifest();

  try {
    validateManifest(manifest);
  } catch (e) {
    if (e instanceof ManifestValidationError) {
      console.error(`\nMANIFEST VALIDATION FAILED: ${e.message}`);
      process.exit(1);
    }
    throw e;
  }
  console.log(`Manifest validated: ${manifest.corpus.length} corpus repos, queries.status="${manifest.queries.status}"`);

  console.log("\n--- Retrieval metrics (Top-1/Top-3) ---");
  const retrieval = await computeRetrievalMetrics(manifest);
  console.log(retrieval.note);

  console.log("\n--- Framework detection metrics ---");
  const framework = await computeFrameworkDetectionMetrics(manifest);
  console.log(framework.note);

  console.log("\n--- Symbol resolution metrics ---");
  const symbolRes = await computeSymbolResolutionMetrics(manifest);
  console.log(symbolRes.note);

  const report = {
    runAt: new Date().toISOString(),
    embeddingModelId: EMBEDDING_MODEL_ID,
    manifestVersion: manifest.manifestVersion,
    manifestQueryStatus: manifest.queries.status,
    environment: {
      node: process.version,
      platform: process.platform
    },
    database: "trailhead_bench",
    llmCallsMade: 0,
    metrics: {
      retrieval,
      framework,
      symbolResolution: symbolRes
    }
  };

  mkdirSync(REPORTS_DIR, { recursive: true });
  const ts = timestamp();
  const jsonPath = resolve(REPORTS_DIR, `${ts}.json`);
  const summaryPath = resolve(REPORTS_DIR, `${ts}.summary.md`);

  writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const summaryLines = [
    `# Benchmark Report — ${report.runAt}`,
    "",
    `**Embedding model:** ${EMBEDDING_MODEL_ID}`,
    `**Manifest version:** ${manifest.manifestVersion} (queries.status: ${manifest.queries.status})`,
    `**Database:** trailhead_bench`,
    `**LLM calls made:** 0 (retrieval-only, per spec)`,
    "",
    "## Retrieval",
    `- Overall: ${retrieval.overall.queryCount} queries, Top-1 = ${retrieval.overall.top1Accuracy ?? "n/a"}, Top-3 = ${retrieval.overall.top3Accuracy ?? "n/a"}`,
    ...retrieval.byCategory.map(
      (c) => `- ${c.category}: ${c.queryCount} queries, Top-1 = ${c.top1Accuracy ?? "n/a"}, Top-3 = ${c.top3Accuracy ?? "n/a"}`
    ),
    `- Note: ${retrieval.note}`,
    "",
    "## Framework detection",
    `- Accuracy: ${framework.accuracy ?? "n/a"}`,
    `- Note: ${framework.note}`,
    ...framework.results.map((r) => `  - ${r.repoName}: known=${r.knownFramework ?? "(none)"} detected=${r.detectedFramework ?? "(none)"} match=${r.match ?? "n/a"}`),
    "",
    "## Symbol resolution",
    `- Accuracy: ${symbolRes.accuracy ?? "n/a"}`,
    `- Note: ${symbolRes.note}`,
    ""
  ];
  writeFileSync(summaryPath, summaryLines.join("\n"));

  console.log(`\nReport written: ${jsonPath}`);
  console.log(`Summary written: ${summaryPath}`);
  console.log("\n" + summaryLines.join("\n"));

  await closeBenchDb();
}

main().catch(async (e) => {
  console.error(e);
  await closeBenchDb();
  process.exit(1);
});
