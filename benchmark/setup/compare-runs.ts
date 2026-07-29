// BENCH-05 — compares two benchmark reports produced on identical
// inputs and characterizes run-to-run agreement/jitter IN WRITING.
//
// Why this is measured and not assumed: KNOWN-GOOD [2026-07-23]
// records that transformers.js/onnxruntime-node's CPU backend is NOT
// bit-exact across SEPARATE invocations — the query embedding itself
// drifts by tiny floating-point amounts between runs (likely ONNX
// multithreaded summation order), which is enough to flip the order of
// two near-identically-distant chunks. The corpus embeddings are NOT
// recomputed between runs (no re-import), so any movement observed
// here originates on the query side.
//
// Usage: tsx benchmark/setup/compare-runs.ts <runA.json> <runB.json>
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = resolve(__dirname, "..", "reports");

interface PerQuery {
  id: string;
  top1Hit: boolean;
  top3Hit: boolean;
  rankedFiles: string[];
  correctRank: number | null;
  trapFile?: string;
  trapRank?: number | null;
  trap_outranked_correct?: boolean;
}

interface Report {
  label: string | null;
  runAt: string;
  embeddingModelId: string;
  manifestVersion: string;
  metrics: {
    retrieval: {
      overall: { queryCount: number; top1Accuracy: number | null; top3Accuracy: number | null };
      byCategory: Array<{ category: string; top1Accuracy: number | null; top3Accuracy: number | null; trapOutrankedRate: number | null; perQuery: PerQuery[] }>;
    };
    framework: { accuracy: number | null };
    symbolResolution: { accuracy: number | null };
  };
}

function flatten(r: Report): Map<string, { category: string; q: PerQuery }> {
  const m = new Map<string, { category: string; q: PerQuery }>();
  for (const c of r.metrics.retrieval.byCategory) {
    for (const q of c.perQuery) m.set(q.id, { category: c.category, q });
  }
  return m;
}

function fmtRank(v: number | null | undefined): string {
  return v === null || v === undefined ? "none" : String(v);
}

function main() {
  const [aPath, bPath] = process.argv.slice(2);
  if (!aPath || !bPath) {
    console.error("Usage: tsx benchmark/setup/compare-runs.ts <runA.json> <runB.json>");
    process.exit(1);
  }

  const A = JSON.parse(readFileSync(aPath, "utf8")) as Report;
  const B = JSON.parse(readFileSync(bPath, "utf8")) as Report;

  if (A.manifestVersion !== B.manifestVersion) {
    console.error(`REFUSING: manifestVersion differs (${A.manifestVersion} vs ${B.manifestVersion}) — not identical inputs.`);
    process.exit(1);
  }
  if (A.embeddingModelId !== B.embeddingModelId) {
    console.error(`REFUSING: embedding model differs — not identical inputs.`);
    process.exit(1);
  }

  const fa = flatten(A);
  const fb = flatten(B);

  const rows: string[] = [];
  let identicalRank = 0;
  let rankChanged = 0;
  let top1Flips = 0;
  let top3Flips = 0;
  let trapVerdictFlips = 0;
  let topFileChanged = 0;
  let rankedListChanged = 0;
  const movements: string[] = [];

  for (const [id, { category, q: qa }] of fa) {
    const entry = fb.get(id);
    if (!entry) {
      rows.push(`| ${id} | ${category} | MISSING IN RUN B | | | |`);
      continue;
    }
    const qb = entry.q;

    const sameRank = qa.correctRank === qb.correctRank;
    const sameTop1 = qa.top1Hit === qb.top1Hit;
    const sameTop3 = qa.top3Hit === qb.top3Hit;
    const sameTrapVerdict = qa.trap_outranked_correct === qb.trap_outranked_correct;
    const sameTopFile = (qa.rankedFiles[0] ?? null) === (qb.rankedFiles[0] ?? null);
    const sameList = JSON.stringify(qa.rankedFiles) === JSON.stringify(qb.rankedFiles);

    if (sameRank) identicalRank++;
    else {
      rankChanged++;
      movements.push(`${id}: correct rank ${fmtRank(qa.correctRank)} -> ${fmtRank(qb.correctRank)}`);
    }
    if (!sameTop1) { top1Flips++; movements.push(`${id}: Top-1 verdict flipped ${qa.top1Hit} -> ${qb.top1Hit}`); }
    if (!sameTop3) { top3Flips++; movements.push(`${id}: Top-3 verdict flipped ${qa.top3Hit} -> ${qb.top3Hit}`); }
    if (!sameTrapVerdict) { trapVerdictFlips++; movements.push(`${id}: trap_outranked_correct flipped ${qa.trap_outranked_correct} -> ${qb.trap_outranked_correct}`); }
    if (!sameTopFile) { topFileChanged++; movements.push(`${id}: rank-1 file changed "${qa.rankedFiles[0]}" -> "${qb.rankedFiles[0]}"`); }
    if (!sameList) rankedListChanged++;

    const flags = [
      sameRank ? "" : "RANK",
      sameTop1 ? "" : "TOP1",
      sameTop3 ? "" : "TOP3",
      sameTrapVerdict ? "" : "TRAP",
      sameList ? "" : "LIST"
    ].filter(Boolean).join(",");

    rows.push(
      `| ${id} | ${category} | ${fmtRank(qa.correctRank)} → ${fmtRank(qb.correctRank)} | ${fmtRank(qa.trapRank)} → ${fmtRank(qb.trapRank)} | ${sameList ? "identical" : "CHANGED"} | ${flags || "—"} |`
    );
  }

  const total = fa.size;
  const fullyStable = top1Flips === 0 && top3Flips === 0 && rankChanged === 0 && trapVerdictFlips === 0;

  const confidence = fullyStable
    ? [
        "**Observed: zero movement across two runs.** Every query returned the same",
        "correct-file rank, the same Top-1/Top-3 verdict, the same trap rank, and the",
        "same trap verdict.",
        "",
        rankedListChanged === 0
          ? "The full top-10 ranked file list was byte-identical for every query as well."
          : `However, ${rankedListChanged} of ${total} queries showed a change somewhere in the top-10 ranked list without disturbing any scored value — real jitter that the metrics happened to absorb.`,
        "",
        "**Honest confidence statement:** two runs agreeing is evidence of *practical*",
        "stability for THIS query set at THIS manifest version — it is NOT proof of",
        "determinism. KNOWN-GOOD [2026-07-23] documents that the query embedding does",
        "drift between separate invocations, and that the drift only changes an outcome",
        "when two candidates are near-identically distant. The correct reading is that",
        "this query set does not appear to sit on such knife-edges, not that the",
        "underlying computation is bit-exact. A third run could still differ; N=2 cannot",
        "rule that out. Any post-swap comparison should treat single-query rank",
        "differences of ±1 on near-tied candidates as potential noise rather than signal,",
        "and rely on category-level movement for its verdict."
      ]
    : [
        `**Observed: real movement across two runs.** ${rankChanged} of ${total} queries`,
        `changed correct-file rank; ${top1Flips} Top-1 verdict flip(s); ${top3Flips} Top-3`,
        `verdict flip(s); ${trapVerdictFlips} trap-verdict flip(s).`,
        "",
        "**Honest confidence statement:** the benchmark is NOT run-to-run stable at the",
        "query level for this set. Any post-swap comparison must treat differences of",
        "this magnitude as noise, and a verdict should rest only on movement that",
        "exceeds the jitter measured here. Consider averaging multiple runs before",
        "declaring criterion outcomes."
      ];

  const out = [
    "# BENCH-05 — run-to-run agreement / jitter characterization",
    "",
    `**Run A:** \`${basename(aPath)}\` — ${A.runAt}`,
    `**Run B:** \`${basename(bPath)}\` — ${B.runAt}`,
    `**Model:** ${A.embeddingModelId} · **manifestVersion:** ${A.manifestVersion}`,
    "**Corpus embeddings were NOT recomputed between runs** (no re-import), so any",
    "movement observed here originates on the query-embedding side.",
    "",
    "## Aggregate",
    "",
    "| Metric | Run A | Run B | Same? |",
    "|---|---|---|---|",
    `| Overall Top-1 | ${A.metrics.retrieval.overall.top1Accuracy} | ${B.metrics.retrieval.overall.top1Accuracy} | ${A.metrics.retrieval.overall.top1Accuracy === B.metrics.retrieval.overall.top1Accuracy ? "yes" : "**NO**"} |`,
    `| Overall Top-3 | ${A.metrics.retrieval.overall.top3Accuracy} | ${B.metrics.retrieval.overall.top3Accuracy} | ${A.metrics.retrieval.overall.top3Accuracy === B.metrics.retrieval.overall.top3Accuracy ? "yes" : "**NO**"} |`,
    `| Framework accuracy | ${A.metrics.framework.accuracy} | ${B.metrics.framework.accuracy} | ${A.metrics.framework.accuracy === B.metrics.framework.accuracy ? "yes" : "**NO**"} |`,
    `| Symbol accuracy | ${A.metrics.symbolResolution.accuracy} | ${B.metrics.symbolResolution.accuracy} | ${A.metrics.symbolResolution.accuracy === B.metrics.symbolResolution.accuracy ? "yes" : "**NO**"} |`,
    "",
    "## Counts",
    "",
    `- Queries compared: **${total}**`,
    `- Identical correct-file rank: **${identicalRank}** · changed: **${rankChanged}**`,
    `- Top-1 verdict flips: **${top1Flips}**`,
    `- Top-3 verdict flips: **${top3Flips}**`,
    `- Trap-verdict flips: **${trapVerdictFlips}**`,
    `- Rank-1 file changed: **${topFileChanged}**`,
    `- Top-10 ranked list changed anywhere: **${rankedListChanged}**`,
    "",
    "## Per-query",
    "",
    "| Query | Category | Correct rank A → B | Trap rank A → B | Top-10 list | Flags |",
    "|---|---|---|---|---|---|",
    ...rows,
    "",
    ...(movements.length > 0
      ? ["## Movements observed", "", ...movements.map((m) => `- ${m}`), ""]
      : ["## Movements observed", "", "None.", ""]),
    "## Finding",
    "",
    ...confidence,
    ""
  ].join("\n");

  const outPath = resolve(REPORTS_DIR, "BASELINE-jitter-BENCH-05.md");
  writeFileSync(outPath, out);
  console.log(out);
  console.log(`\nWritten: ${outPath}`);
}

main();
