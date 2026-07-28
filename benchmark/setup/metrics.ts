// Metric computation for the benchmark runner. Per benchmark.md's
// Functional Requirements: Top-1/Top-3 retrieval accuracy (overall +
// per category), framework detection accuracy, symbol resolution
// accuracy. Every function here must run correctly against an EMPTY
// query set — reporting "no queries"/"no ground truth" explicitly
// rather than crashing or dividing by zero (task requirement, stage A).
import { eq } from "drizzle-orm";
import { benchDb } from "./db";
import { files, repositories, symbols as symbolsTable } from "../../src/server/db/schema";
import { generateEmbeddings } from "../../src/server/services/embeddings";
import { retrieveChunksFromBench } from "./retrieve";
import type { BenchmarkManifest, CorpusEntry, QueryCategory, QueryEntry } from "./manifest-types";

export interface RetrievalCategoryResult {
  category: QueryCategory;
  queryCount: number;
  top1Hits: number;
  top3Hits: number;
  top1Accuracy: number | null;
  top3Accuracy: number | null;
  perQuery: Array<{ id: string; top1Hit: boolean; top3Hit: boolean; retrievedPaths: string[] }>;
}

export interface RetrievalMetrics {
  overall: {
    queryCount: number;
    top1Accuracy: number | null;
    top3Accuracy: number | null;
  };
  byCategory: RetrievalCategoryResult[];
  note: string;
}

async function findRepositoryIdByName(repoName: string): Promise<string | null> {
  const [row] = await benchDb.select().from(repositories).where(eq(repositories.name, repoName));
  return row ? row.id : null;
}

async function runCategory(category: QueryCategory, queries: QueryEntry[]): Promise<RetrievalCategoryResult> {
  if (queries.length === 0) {
    return {
      category,
      queryCount: 0,
      top1Hits: 0,
      top3Hits: 0,
      top1Accuracy: null,
      top3Accuracy: null,
      perQuery: []
    };
  }

  let top1Hits = 0;
  let top3Hits = 0;
  const perQuery: RetrievalCategoryResult["perQuery"] = [];

  for (const q of queries) {
    const repositoryId = await findRepositoryIdByName(q.repoName);
    if (!repositoryId) {
      throw new Error(`Query "${q.id}": repo "${q.repoName}" not found in trailhead_bench — run benchmark:setup first.`);
    }

    const [embedding] = await generateEmbeddings([q.question]);
    const chunks = await retrieveChunksFromBench(embedding, repositoryId, 3);

    const retrievedFileIds = chunks.map((c) => c.fileId);
    const retrievedPaths: string[] = [];
    for (const fileId of retrievedFileIds) {
      const [fileRow] = await benchDb.select().from(files).where(eq(files.id, fileId));
      retrievedPaths.push(fileRow ? fileRow.path : "(unknown file)");
    }

    const groundTruthSet = new Set(q.groundTruthFiles);
    const top1Hit = retrievedPaths.length > 0 && groundTruthSet.has(retrievedPaths[0]);
    const top3Hit = retrievedPaths.some((p) => groundTruthSet.has(p));

    if (top1Hit) top1Hits++;
    if (top3Hit) top3Hits++;

    perQuery.push({ id: q.id, top1Hit, top3Hit, retrievedPaths });
  }

  return {
    category,
    queryCount: queries.length,
    top1Hits,
    top3Hits,
    top1Accuracy: top1Hits / queries.length,
    top3Accuracy: top3Hits / queries.length,
    perQuery
  };
}

export async function computeRetrievalMetrics(manifest: BenchmarkManifest): Promise<RetrievalMetrics> {
  const categories: QueryCategory[] = ["known_code", "filename_trap", "semantic", "documentation"];
  const byCategory: RetrievalCategoryResult[] = [];

  for (const category of categories) {
    byCategory.push(await runCategory(category, manifest.queries[category]));
  }

  const totalQueries = byCategory.reduce((sum, c) => sum + c.queryCount, 0);
  const totalTop1 = byCategory.reduce((sum, c) => sum + c.top1Hits, 0);
  const totalTop3 = byCategory.reduce((sum, c) => sum + c.top3Hits, 0);

  return {
    overall: {
      queryCount: totalQueries,
      top1Accuracy: totalQueries > 0 ? totalTop1 / totalQueries : null,
      top3Accuracy: totalQueries > 0 ? totalTop3 / totalQueries : null
    },
    byCategory,
    note: totalQueries === 0
      ? "no queries in manifest (expected for an UNAPPROVED stage-A manifest) — retrieval metrics not computed, not a failure"
      : `${totalQueries} queries evaluated`
  };
}

export interface FrameworkDetectionResult {
  repoName: string;
  knownFramework: string | null;
  detectedFramework: string | null;
  match: boolean | null;
  note: string;
}

export interface FrameworkDetectionMetrics {
  results: FrameworkDetectionResult[];
  accuracy: number | null;
  note: string;
}

export async function computeFrameworkDetectionMetrics(manifest: BenchmarkManifest): Promise<FrameworkDetectionMetrics> {
  const results: FrameworkDetectionResult[] = [];

  for (const repo of manifest.corpus) {
    const [row] = await benchDb.select().from(repositories).where(eq(repositories.name, repo.name));
    const detectedFramework = row ? row.framework : null;

    if (repo.knownFramework === null) {
      results.push({
        repoName: repo.name,
        knownFramework: null,
        detectedFramework,
        match: null,
        note: "no ground truth curated yet — skipped, not guessed"
      });
      continue;
    }

    const match = repo.knownFramework === detectedFramework;
    results.push({ repoName: repo.name, knownFramework: repo.knownFramework, detectedFramework, match, note: "" });
  }

  const scored = results.filter((r) => r.match !== null);
  return {
    results,
    accuracy: scored.length > 0 ? scored.filter((r) => r.match).length / scored.length : null,
    note: scored.length === 0
      ? "no repos have curated knownFramework ground truth yet — accuracy not computed, not a failure"
      : `${scored.length} of ${results.length} repos scored`
  };
}

export interface SymbolResolutionResult {
  repoName: string;
  filePath: string;
  expectedCount: number;
  actualCount: number;
  matchedCount: number;
}

export interface SymbolResolutionMetrics {
  results: SymbolResolutionResult[];
  accuracy: number | null;
  note: string;
}

export async function computeSymbolResolutionMetrics(manifest: BenchmarkManifest): Promise<SymbolResolutionMetrics> {
  const samples = manifest.symbolGroundTruth.samples;

  if (samples.length === 0) {
    return {
      results: [],
      accuracy: null,
      note: "no symbol ground-truth samples in manifest (expected for an UNAPPROVED stage-A manifest) — not computed, not a failure"
    };
  }

  const results: SymbolResolutionResult[] = [];
  for (const sample of samples) {
    const repositoryId = await findRepositoryIdByName(sample.repoName);
    if (!repositoryId) {
      throw new Error(`Symbol sample for "${sample.repoName}": repo not found in trailhead_bench.`);
    }
    const [fileRow] = await benchDb.select().from(files).where(eq(files.repositoryId, repositoryId));
    if (!fileRow) {
      throw new Error(`Symbol sample for "${sample.repoName}": file "${sample.filePath}" not found.`);
    }
    const actualSymbols = await benchDb.select().from(symbolsTable).where(eq(symbolsTable.fileId, fileRow.id));

    let matchedCount = 0;
    for (const expected of sample.expectedSymbols) {
      if (actualSymbols.some((a) => a.kind === expected.kind && a.name === expected.name)) matchedCount++;
    }

    results.push({
      repoName: sample.repoName,
      filePath: sample.filePath,
      expectedCount: sample.expectedSymbols.length,
      actualCount: actualSymbols.length,
      matchedCount
    });
  }

  const totalExpected = results.reduce((sum, r) => sum + r.expectedCount, 0);
  const totalMatched = results.reduce((sum, r) => sum + r.matchedCount, 0);

  return {
    results,
    accuracy: totalExpected > 0 ? totalMatched / totalExpected : null,
    note: `${samples.length} samples scored`
  };
}
