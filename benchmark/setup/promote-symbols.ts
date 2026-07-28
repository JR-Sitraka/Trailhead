// Promotes the person-approved symbol sample from
// benchmark/candidates/proposed-symbols.json into
// benchmark/manifest.json's symbolGroundTruth section.
//
// Done mechanically rather than by hand-editing 26 entries: a
// transcription slip here would corrupt the artifact item 3 is
// hard-gated on, and would be invisible (the metric would simply
// score against a wrong expectation). The script copies verbatim and
// then re-verifies the written result against the source.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(__dirname, "..", "manifest.json");
const PROPOSED_PATH = resolve(__dirname, "..", "candidates", "proposed-symbols.json");

interface ProposedSymbol {
  kind: string;
  name: string;
  startLine: number;
  endLine: number;
  rationale?: string;
}
interface ProposedSample {
  repoName: string;
  filePath: string;
  expectedSymbols: ProposedSymbol[];
}

function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const proposed = JSON.parse(readFileSync(PROPOSED_PATH, "utf8")) as {
    samples: ProposedSample[];
    reposContributingNoData: string[];
    selectionRationale: Record<string, string>;
  };

  const samples = proposed.samples.map((s) => ({
    repoName: s.repoName,
    filePath: s.filePath,
    expectedSymbols: s.expectedSymbols.map((e) => ({
      kind: e.kind,
      name: e.name,
      startLine: e.startLine,
      endLine: e.endLine,
      // Provenance retained deliberately: the metric reads kind+name
      // only, but a future reader needs to know WHY each was chosen.
      rationale: e.rationale
    }))
  }));

  const total = samples.reduce((n, s) => n + s.expectedSymbols.length, 0);

  manifest.symbolGroundTruth = {
    status: "APPROVED",
    approvedBy: "Sitraka",
    approvedDate: "2026-07-28",
    approvalNote:
      "26/26 person-verified against source at the pinned commits via benchmark/candidates/proposed-symbols-review.md. Focused confirmations recorded in PROJECT-STATE: the two TimeoutError classes are genuinely distinct and file-scoped; detectStackFacts' dual function/export extraction at an identical range is valid, not duplication; calculateRetryDelay's declaration (5-40) and export statement (42) are correctly separate ranges; the non-exported helpers confirm extraction is not export-gated.",
    selectionRationale: proposed.selectionRationale,
    reposContributingNoData: proposed.reposContributingNoData,
    reposContributingNoDataNote:
      "0 extracted symbols (the extractor is TS/JS-only). These contribute no data to BENCH-06 and must never be scored as 0% accuracy.",
    totalSymbols: total,
    samples
  };

  manifest.versioningRule = {
    frozenAt: "1.0.0",
    frozenDate: "2026-07-28",
    rule:
      "manifestVersion 1.0.0 is FROZEN as of the committed baseline. Any change to the query set, the symbol ground truth, the corpus pins, or the locked comparison parameters requires BOTH a manifestVersion bump AND a new baseline run — results are only ever comparable within one manifestVersion. A post-change benchmark run compared against a baseline from a different manifestVersion is not a valid comparison and must not be reported as one."
  };

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  // Re-read and verify the written result matches the source exactly.
  const written = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const w = written.symbolGroundTruth;
  let mismatches = 0;
  if (w.samples.length !== proposed.samples.length) mismatches++;
  for (let i = 0; i < proposed.samples.length; i++) {
    const src = proposed.samples[i];
    const dst = w.samples[i];
    if (src.repoName !== dst.repoName || src.filePath !== dst.filePath) mismatches++;
    if (src.expectedSymbols.length !== dst.expectedSymbols.length) mismatches++;
    for (let j = 0; j < src.expectedSymbols.length; j++) {
      const a = src.expectedSymbols[j];
      const b = dst.expectedSymbols[j];
      if (a.kind !== b.kind || a.name !== b.name || a.startLine !== b.startLine || a.endLine !== b.endLine) mismatches++;
    }
  }

  console.log(`Promoted ${total} symbols across ${samples.length} file-samples.`);
  console.log(`status=${w.status} approvedDate=${w.approvedDate} manifestVersion=${written.manifestVersion} (frozen)`);
  console.log(`Round-trip verification mismatches: ${mismatches}`);
  if (mismatches > 0) {
    console.error("PROMOTION FAILED — written manifest does not match the approved source.");
    process.exit(1);
  }
}

main();
