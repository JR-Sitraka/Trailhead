// Manifest validation, per benchmark.md's Validation Rules: "all 5
// repos present at pinned SHAs, every query has ground truth,
// categories non-empty — fails fast with a specific message otherwise."
//
// Stage-aware distinction (not in the original spec text, made explicit
// here because stage A's own manifest deliberately ships with empty,
// UNAPPROVED categories — see benchmark.md's Query set requirement:
// "Set size is decided during curation... not invented here before
// curation happens"): the "categories non-empty" rule is enforced only
// once queries.status === "APPROVED". An UNAPPROVED manifest is allowed
// to have empty categories — that is stage A's whole point — but every
// query that DOES exist (approved or candidate) must still carry real
// ground truth, and the 5-repo/pinned-SHA structural requirement is
// never optional.
import type { BenchmarkManifest, QueryEntry } from "./manifest-types";

export class ManifestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManifestValidationError";
  }
}

function validateQueryHasGroundTruth(category: string, q: QueryEntry): void {
  if (!q.groundTruthFiles || q.groundTruthFiles.length === 0) {
    throw new ManifestValidationError(
      `Query "${q.id}" in category "${category}" has no ground-truth files — every listed query must have ground truth, approved or candidate.`
    );
  }
  if (!q.repoName) {
    throw new ManifestValidationError(`Query "${q.id}" in category "${category}" has no repoName.`);
  }
  if (!q.question || !q.question.trim()) {
    throw new ManifestValidationError(`Query "${q.id}" in category "${category}" has an empty question.`);
  }
}

export function validateManifest(manifest: BenchmarkManifest): void {
  if (!Array.isArray(manifest.corpus) || manifest.corpus.length !== 5) {
    throw new ManifestValidationError(
      `Manifest must list exactly 5 corpus repos (ADR-008); found ${manifest.corpus?.length ?? 0}.`
    );
  }

  for (const repo of manifest.corpus) {
    if (!repo.name || !repo.sourceUrl) {
      throw new ManifestValidationError(`Corpus entry missing name or sourceUrl: ${JSON.stringify(repo)}`);
    }
    if (!repo.commitSha || repo.commitSha.length < 7) {
      throw new ManifestValidationError(`Corpus repo "${repo.name}" has no valid pinned commitSha.`);
    }
  }

  const categories: Array<keyof Pick<BenchmarkManifest["queries"], "known_code" | "filename_trap" | "semantic" | "documentation">> = [
    "known_code",
    "filename_trap",
    "semantic",
    "documentation"
  ];

  for (const category of categories) {
    const entries = manifest.queries[category];
    if (!Array.isArray(entries)) {
      throw new ManifestValidationError(`Manifest queries.${category} must be an array (missing or malformed).`);
    }
    for (const q of entries) {
      validateQueryHasGroundTruth(category, q);
    }
    if (manifest.queries.status === "APPROVED" && entries.length === 0) {
      throw new ManifestValidationError(
        `Manifest is marked APPROVED but queries.${category} is empty — an approved manifest may not have an empty category.`
      );
    }
  }

  if (!manifest.symbolGroundTruth || !Array.isArray(manifest.symbolGroundTruth.samples)) {
    throw new ManifestValidationError("Manifest symbolGroundTruth.samples must be an array (missing or malformed).");
  }
}
