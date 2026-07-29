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

// Recorded in every report so a later comparison can prove both runs
// used the same model. Dimension is the schema's vector(384), which
// item 3's swap may change — a change there requires a new baseline.
const EMBEDDING_MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const EMBEDDING_DIMENSION = 384;

/** Optional `--label=NAME`; prefixes report filenames so a baseline is unmistakable. */
function reportLabel(): string | null {
  const arg = process.argv.find((a) => a.startsWith("--label="));
  return arg ? arg.slice("--label=".length).trim() || null : null;
}

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

  const trapCategory = retrieval.byCategory.find((c) => c.category === "filename_trap");

  const label = reportLabel();

  const report = {
    label,
    isBaseline: label === "BASELINE",
    runAt: new Date().toISOString(),
    embeddingModelId: EMBEDDING_MODEL_ID,
    embeddingDimension: EMBEDDING_DIMENSION,
    manifestVersion: manifest.manifestVersion,
    manifestQueryStatus: manifest.queries.status,
    symbolGroundTruthStatus: manifest.symbolGroundTruth.status,
    // Locked parameters recorded IN the report: the amendment defines
    // these as what invalidates comparability, so a baseline that does
    // not state them cannot later prove a post-swap run matched it.
    lockedComparisonParameters: manifest.lockedComparisonParameters ?? null,
    rankingRule: manifest.rankingRule ?? null,
    rankSearchDepth: manifest.rankSearchDepth ?? null,
    // Corpus pins: which exact snapshot was measured.
    corpusPins: manifest.corpus.map((c) => ({
      name: c.name,
      commitSha: c.commitSha,
      knownFramework: c.knownFramework
    })),
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
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
  const prefix = label ? `${label}-` : "";
  const jsonPath = resolve(REPORTS_DIR, `${prefix}${ts}.json`);
  const summaryPath = resolve(REPORTS_DIR, `${prefix}${ts}.summary.md`);

  writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const lp = manifest.lockedComparisonParameters as Record<string, unknown> | undefined;

  const summaryLines = [
    `# Benchmark Report${label ? ` — ${label}` : ""} — ${report.runAt}`,
    "",
    ...(report.isBaseline
      ? [
          "> **THIS IS THE COMMITTED BASELINE (BENCH-04).** Item 3's embedding swap is",
          "> compared against this run. Valid only for `manifestVersion` " +
            `\`${manifest.manifestVersion}\` and the locked parameters below; changing`,
          "> either requires a version bump and a new baseline.",
          ""
        ]
      : []),
    `**Embedding model:** ${EMBEDDING_MODEL_ID} (dimension ${EMBEDDING_DIMENSION})`,
    `**Manifest version:** ${manifest.manifestVersion} — queries: ${manifest.queries.status}, symbols: ${manifest.symbolGroundTruth.status}`,
    `**Database:** trailhead_bench`,
    `**LLM calls made:** 0 (retrieval-only, per spec)`,
    `**Environment:** node ${process.version}, ${process.platform}/${process.arch}`,
    "",
    "## Locked comparison parameters",
    "",
    ...(lp
      ? Object.entries(lp)
          .filter(([k]) => k !== "_note")
          .map(([k, v]) => `- \`${k}\`: ${String(v)}`)
      : ["- (not recorded in manifest)"]),
    "",
    "## Corpus pins",
    "",
    "| Repo | Pinned commit | knownFramework |",
    "|---|---|---|",
    ...report.corpusPins.map(
      (c) => `| ${c.name} | \`${c.commitSha}\` | ${c.knownFramework ?? "null (expected to decline)"} |`
    ),
    "",
    "## Retrieval",
    `- Overall: ${retrieval.overall.queryCount} queries, Top-1 = ${retrieval.overall.top1Accuracy ?? "n/a"}, Top-3 = ${retrieval.overall.top3Accuracy ?? "n/a"}`,
    ...retrieval.byCategory.map(
      (c) => `- ${c.category}: ${c.queryCount} queries, Top-1 = ${c.top1Accuracy ?? "n/a"}, Top-3 = ${c.top3Accuracy ?? "n/a"}`
    ),
    `- Note: ${retrieval.note}`,
    "",
    "## Trap-rank comparison (filename_trap — swap criterion 2)",
    ...(trapCategory && trapCategory.queryCount > 0
      ? [
          `- Trap outranked correct in **${trapCategory.perQuery.filter((q) => q.trap_outranked_correct).length} of ${trapCategory.queryCount}** queries (rate: ${trapCategory.trapOutrankedRate})`,
          "",
          "| Query | Correct rank | Trap rank | Trap outranked? |",
          "|---|---|---|---|",
          ...trapCategory.perQuery.map(
            (q) =>
              `| ${q.id} | ${q.correctRank ?? `>${report.rankSearchDepth ?? "depth"}`} | ${q.trapRank ?? `>${report.rankSearchDepth ?? "depth"}`} | ${q.trap_outranked_correct ? "**YES**" : "no"} |`
          )
        ]
      : ["- No filename_trap queries in manifest — nothing to compare."]),
    "",
    "## Framework detection",
    `- Accuracy: ${framework.accuracy ?? "n/a"}`,
    `- Note: ${framework.note}`,
    ...framework.results.map((r) => `  - ${r.repoName}: known=${r.knownFramework ?? "(null — expected to decline)"} detected=${r.detectedFramework ?? "(null)"} match=${r.match}`),
    "",
    "## Symbol resolution",
    `- Accuracy: ${symbolRes.accuracy ?? "n/a"}`,
    `- Note: ${symbolRes.note}`,
    ...(symbolRes.reposContributingNoData.length > 0
      ? [`- Contributing no data (0 extracted symbols — NOT scored as 0%): ${symbolRes.reposContributingNoData.join(", ")}`]
      : []),
    ...(symbolRes.results.length > 0
      ? [
          "",
          "| Repo | File | Expected | Matched | Symbols in file |",
          "|---|---|---|---|---|",
          ...symbolRes.results.map(
            (r) => `| ${r.repoName} | \`${r.filePath}\` | ${r.expectedCount} | ${r.matchedCount} | ${r.actualCount} |`
          )
        ]
      : []),
    "",
    "## Per-query detail (all categories)",
    "",
    "| Query | Category | Top-1 | Top-3 | Correct rank |",
    "|---|---|---|---|---|",
    ...retrieval.byCategory.flatMap((c) =>
      c.perQuery.map(
        (q) =>
          `| ${q.id} | ${c.category} | ${q.top1Hit ? "hit" : "miss"} | ${q.top3Hit ? "hit" : "miss"} | ${q.correctRank ?? `>${report.rankSearchDepth ?? "depth"}`} |`
      )
    ),
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
