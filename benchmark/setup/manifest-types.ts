// Shared types for benchmark/manifest.json. Kept in one place so
// run.ts, metrics.ts, and setup scripts agree on shape.

export interface CorpusEntry {
  name: string;
  source: "github";
  sourceUrl: string;
  commitSha: string;
  // Ground truth for BENCH-06's framework-detection metric — filled
  // by the person during curation, per benchmark.md's "human decides
  // the right answers" rule. Null = not yet curated; the metric skips
  // (does not guess) any repo with a null value.
  knownFramework: string | null;
}

export type QueryCategory = "known_code" | "filename_trap" | "semantic" | "documentation";

export interface QueryEntry {
  id: string;
  repoName: string;
  question: string;
  groundTruthFiles: string[];
  justification: string;
}

export interface QueriesSection {
  status: "UNAPPROVED — candidates only" | "APPROVED";
  known_code: QueryEntry[];
  filename_trap: QueryEntry[];
  semantic: QueryEntry[];
  documentation: QueryEntry[];
}

export interface SymbolGroundTruthSample {
  repoName: string;
  filePath: string;
  expectedSymbols: Array<{ kind: string; name: string }>;
}

export interface SymbolGroundTruthSection {
  status: "UNAPPROVED — candidates only" | "APPROVED";
  samples: SymbolGroundTruthSample[];
}

export interface BenchmarkManifest {
  manifestVersion: string;
  createdAt: string;
  corpus: CorpusEntry[];
  queries: QueriesSection;
  symbolGroundTruth: SymbolGroundTruthSection;
}
