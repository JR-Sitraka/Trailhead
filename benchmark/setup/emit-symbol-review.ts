// Emits benchmark/candidates/proposed-symbols-review.md — a person-
// facing verification table for the 26 proposed symbols, with GitHub
// permalinks at each repo's PINNED SHA so the person reviews exactly
// the snapshot the benchmark measured, not current HEAD.
//
// Permalinks are DERIVED from manifest.corpus[].sourceUrl + commitSha
// and the proposed sample's own path/line data — never hand-typed —
// so a link cannot silently drift from the data it describes.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { BenchmarkManifest } from "./manifest-types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(__dirname, "..", "manifest.json");
const PROPOSED_PATH = resolve(__dirname, "..", "candidates", "proposed-symbols.json");
const OUT_PATH = resolve(__dirname, "..", "candidates", "proposed-symbols-review.md");

interface ProposedSample {
  repoName: string;
  filePath: string;
  expectedSymbols: Array<{ kind: string; name: string; startLine: number; endLine: number; rationale?: string }>;
}

interface ProposedDoc {
  status: string;
  verification: string;
  selectionRationale: Record<string, string>;
  reposContributingNoData: string[];
  samples: ProposedSample[];
  counts: Record<string, number>;
}

function permalink(sourceUrl: string, sha: string, path: string, startLine: number, endLine: number): string {
  const base = sourceUrl.replace(/\/+$/, "");
  return `${base}/blob/${sha}/${path}#L${startLine}-L${endLine}`;
}

function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as BenchmarkManifest;
  const doc = JSON.parse(readFileSync(PROPOSED_PATH, "utf8")) as ProposedDoc;

  const corpusByName = new Map(manifest.corpus.map((c) => [c.name, c]));

  const rows: string[] = [];
  let n = 0;

  for (const sample of doc.samples) {
    const corpus = corpusByName.get(sample.repoName);
    if (!corpus) throw new Error(`Sample repo "${sample.repoName}" is not in manifest.corpus`);
    for (const s of sample.expectedSymbols) {
      n++;
      const id = `SYM-${String(n).padStart(2, "0")}`;
      const link = permalink(corpus.sourceUrl, corpus.commitSha, sample.filePath, s.startLine, s.endLine);
      rows.push(
        `| ${id} | ${sample.repoName} | \`${sample.filePath}\` | \`${s.kind}\` | \`${s.name}\` | ${s.startLine} | ${s.endLine} | [view at pinned SHA](${link}) |`
      );
    }
  }

  const shaTable = manifest.corpus
    .filter((c) => doc.samples.some((s) => s.repoName === c.name))
    .map((c) => `| ${c.name} | \`${c.commitSha}\` |`);

  const rationaleLines = Object.entries(doc.selectionRationale).map(
    ([k, v]) => (k === "principle" ? `**Principle.** ${v}` : `- **${k}** — ${v}`)
  );

  const out = [
    "# Proposed symbol ground truth — verification sheet",
    "",
    `**Status:** ${doc.status}`,
    "",
    `**How these were checked:** ${doc.verification}`,
    "",
    "**How to use this sheet:** every permalink below points at the exact pinned snapshot the benchmark measured — not the repository's current HEAD. Open a link, confirm the symbol at those lines really is the listed kind and name, and mark it. A symbol you reject should be struck from `benchmark/candidates/proposed-symbols.json` before that file's contents are promoted into `manifest.json`'s `symbolGroundTruth` section.",
    "",
    "## Pinned SHAs used for these links",
    "",
    "| Repo | Pinned commit |",
    "|---|---|",
    ...shaTable,
    "",
    "## Selection rationale",
    "",
    ...rationaleLines,
    "",
    `## The ${n} proposed symbols`,
    "",
    "| ID | Repo | Path | Kind | Name | Start | End | Permalink |",
    "|---|---|---|---|---|---|---|---|",
    ...rows,
    "",
    "## Repos contributing no data",
    "",
    ...doc.reposContributingNoData.map(
      (r) => `- **${r}** — 0 extracted symbols (the extractor is TS/JS-only). Contributes no data to BENCH-06 and must never be scored as 0% accuracy.`
    ),
    "",
    "## Gate",
    "",
    "`manifest.symbolGroundTruth.status` stays **PENDING** and `samples` stays empty until the person verifies this sheet. **BENCH-06 is not valid before then.**",
    ""
  ].join("\n");

  writeFileSync(OUT_PATH, out);
  console.log(`Wrote ${OUT_PATH}`);
  console.log(`${n} symbols across ${doc.samples.length} files, ${new Set(doc.samples.map((s) => s.repoName)).size} repos.`);
}

main();
