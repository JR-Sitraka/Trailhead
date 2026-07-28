// Shared types for benchmark/manifest.json. Kept in one place so
// run.ts, metrics.ts, and setup scripts agree on shape.

export interface CorpusEntry {
  name: string;
  source: "github";
  sourceUrl: string;
  commitSha: string;
  // Ground truth for BENCH-06's framework-detection metric. Under
  // ADR-010, null means "correctly declines to guess" is the expected
  // answer — a real, scoreable expectation, not missing data.
  knownFramework: string | null;
}

export type QueryCategory = "known_code" | "filename_trap" | "semantic" | "documentation";

export interface QueryEntry {
  id: string;
  repoName: string;
  question: string;
  groundTruthFiles: string[];
  /** filename_trap only: the file expected to compete with the correct answer. */
  trapFile?: string;
  trapReason?: string;
  personVerified?: string;
  personApproved?: string;
  personNote?: string;
}

export interface QueriesSection {
  /** Exactly "APPROVED" activates the non-empty-category validation rule. */
  status: "APPROVED" | "UNAPPROVED — candidates only";
  approvalNote?: string;
  known_code: QueryEntry[];
  filename_trap: QueryEntry[];
  semantic: QueryEntry[];
  documentation: QueryEntry[];
}

export interface SymbolGroundTruthSample {
  repoName: string;
  filePath: string;
  expectedSymbols: Array<{ kind: string; name: string; startLine?: number; endLine?: number }>;
}

export interface SymbolGroundTruthSection {
  status: "APPROVED" | "PENDING";
  statusNote?: string;
  plan?: Record<string, string>;
  requirements?: string[];
  samples: SymbolGroundTruthSample[];
}

export interface BenchmarkManifest {
  manifestVersion: string;
  createdAt: string;
  approval?: Record<string, string>;
  groundTruthRules?: string[];
  rankingRule?: string;
  /** How deep to search the ranked chunk list when locating file ranks. */
  rankSearchDepth?: number;
  corpus: CorpusEntry[];
  knownFrameworkLimitation?: string;
  queries: QueriesSection;
  semanticDropped?: Array<Record<string, string>>;
  symbolGroundTruth: SymbolGroundTruthSection;
  counts?: Record<string, number>;
}
