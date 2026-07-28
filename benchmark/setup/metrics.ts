// Metric computation for the benchmark runner. Per benchmark.md's
// Functional Requirements: Top-1/Top-3 retrieval accuracy (overall +
// per category), framework detection accuracy, symbol resolution
// accuracy — plus, per the 2026-07-28 trap-rank amendment, the trap
// file's rank beside the correct file's rank for every filename_trap
// query, a per-query `trap_outranked_correct` verdict, and a
// category-level rate.
//
// Ranking is FILE-level (see manifest.rankingRule): retrieve the top
// rankSearchDepth chunks, map to file paths, de-duplicate keeping first
// occurrence. A file's rank is the position of its best chunk in that
// list. This matters because ground truth is expressed as files, and
// because a trap file's rank is only meaningful relative to the correct
// file's rank — which may sit outside the top 3.
//
// Every function here must run correctly against an EMPTY query set,
// reporting "no queries" explicitly rather than crashing.
import { eq } from "drizzle-orm";
import { benchDb } from "./db";
import { files, repositories, symbols as symbolsTable } from "../../src/server/db/schema";
import { generateEmbeddings } from "../../src/server/services/embeddings";
import { retrieveChunksFromBench } from "./retrieve";
import type { BenchmarkManifest, QueryCategory, QueryEntry } from "./manifest-types";

const DEFAULT_RANK_SEARCH_DEPTH = 50;

export interface PerQueryResult {
  id: string;
  top1Hit: boolean;
  top3Hit: boolean;
  /** De-duplicated file ranking, truncated for readability. */
  rankedFiles: string[];
  /** 1-based rank of the best-ranked ground-truth file; null if outside search depth. */
  correctRank: number | null;
  /** filename_trap only. */
  trapFile?: string;
  trapRank?: number | null;
  trap_outranked_correct?: boolean;
}

export interface RetrievalCategoryResult {
  category: QueryCategory;
  queryCount: number;
  top1Hits: number;
  top3Hits: number;
  top1Accuracy: number | null;
  top3Accuracy: number | null;
  /** filename_trap only: share of queries where the trap outranked the correct file. */
  trapOutrankedRate: number | null;
  perQuery: PerQueryResult[];
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

/**
 * Retrieve and reduce to a de-duplicated, ranked list of file paths.
 * Order is preserved from the chunk ranking; first occurrence wins.
 */
async function rankedFilePathsFor(question: string, repositoryId: string, depth: number): Promise<string[]> {
  const [embedding] = await generateEmbeddings([question]);
  const chunks = await retrieveChunksFromBench(embedding, repositoryId, depth);

  const pathCache = new Map<string, string>();
  const ranked: string[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    let path = pathCache.get(chunk.fileId);
    if (path === undefined) {
      const [fileRow] = await benchDb.select().from(files).where(eq(files.id, chunk.fileId));
      path = fileRow ? fileRow.path : "(unknown file)";
      pathCache.set(chunk.fileId, path);
    }
    if (!seen.has(path)) {
      seen.add(path);
      ranked.push(path);
    }
  }

  return ranked;
}

function rankOf(ranked: string[], path: string): number | null {
  const idx = ranked.indexOf(path);
  return idx === -1 ? null : idx + 1;
}

async function runCategory(
  category: QueryCategory,
  queries: QueryEntry[],
  depth: number
): Promise<RetrievalCategoryResult> {
  if (queries.length === 0) {
    return {
      category,
      queryCount: 0,
      top1Hits: 0,
      top3Hits: 0,
      top1Accuracy: null,
      top3Accuracy: null,
      trapOutrankedRate: null,
      perQuery: []
    };
  }

  let top1Hits = 0;
  let top3Hits = 0;
  let trapQueries = 0;
  let trapOutranked = 0;
  const perQuery: PerQueryResult[] = [];

  for (const q of queries) {
    const repositoryId = await findRepositoryIdByName(q.repoName);
    if (!repositoryId) {
      throw new Error(`Query "${q.id}": repo "${q.repoName}" not found in trailhead_bench — run benchmark:setup first.`);
    }

    const ranked = await rankedFilePathsFor(q.question, repositoryId, depth);
    const groundTruthSet = new Set(q.groundTruthFiles);

    const top1Hit = ranked.length > 0 && groundTruthSet.has(ranked[0]);
    const top3Hit = ranked.slice(0, 3).some((p) => groundTruthSet.has(p));
    if (top1Hit) top1Hits++;
    if (top3Hit) top3Hits++;

    // Best-ranked ground-truth file (a query may list several).
    let correctRank: number | null = null;
    for (const gt of q.groundTruthFiles) {
      const r = rankOf(ranked, gt);
      if (r !== null && (correctRank === null || r < correctRank)) correctRank = r;
    }

    const result: PerQueryResult = {
      id: q.id,
      top1Hit,
      top3Hit,
      rankedFiles: ranked.slice(0, 10),
      correctRank
    };

    if (q.trapFile) {
      trapQueries++;
      const trapRank = rankOf(ranked, q.trapFile);
      // The trap wins if it appears AND (the correct file is absent, or
      // the trap sits above it). A trap outside the search depth never
      // counts as outranking.
      const outranked = trapRank !== null && (correctRank === null || trapRank < correctRank);
      if (outranked) trapOutranked++;
      result.trapFile = q.trapFile;
      result.trapRank = trapRank;
      result.trap_outranked_correct = outranked;
    }

    perQuery.push(result);
  }

  return {
    category,
    queryCount: queries.length,
    top1Hits,
    top3Hits,
    top1Accuracy: top1Hits / queries.length,
    top3Accuracy: top3Hits / queries.length,
    trapOutrankedRate: trapQueries > 0 ? trapOutranked / trapQueries : null,
    perQuery
  };
}

export async function computeRetrievalMetrics(manifest: BenchmarkManifest): Promise<RetrievalMetrics> {
  const depth = manifest.rankSearchDepth ?? DEFAULT_RANK_SEARCH_DEPTH;
  const categories: QueryCategory[] = ["known_code", "filename_trap", "semantic", "documentation"];
  const byCategory: RetrievalCategoryResult[] = [];

  for (const category of categories) {
    byCategory.push(await runCategory(category, manifest.queries[category], depth));
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
      ? "no queries in manifest — retrieval metrics not computed, not a failure"
      : `${totalQueries} queries evaluated at rank-search depth ${depth}`
  };
}

export interface FrameworkDetectionResult {
  repoName: string;
  knownFramework: string | null;
  detectedFramework: string | null;
  match: boolean;
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

    // Under ADR-010 a null expectation is a real expectation ("correctly
    // declines to guess"), so null is scored, never skipped.
    const match = repo.knownFramework === detectedFramework;
    results.push({
      repoName: repo.name,
      knownFramework: repo.knownFramework,
      detectedFramework,
      match,
      note: repo.knownFramework === null ? "expected to decline (ADR-010)" : "positive framework case"
    });
  }

  const accuracy = results.length > 0 ? results.filter((r) => r.match).length / results.length : null;

  return {
    results,
    accuracy,
    note: `${results.length} repos scored; ${results.filter((r) => r.knownFramework !== null).length} positive case(s), the rest scored as correct-declining (ADR-010 re-scope)`
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
  reposContributingNoData: string[];
  note: string;
}

export async function computeSymbolResolutionMetrics(manifest: BenchmarkManifest): Promise<SymbolResolutionMetrics> {
  const samples = manifest.symbolGroundTruth.samples;

  // Repos with zero extracted symbols contribute no data — they are
  // never scored as 0% accuracy (explicit manifest requirement).
  const reposContributingNoData: string[] = [];
  for (const repo of manifest.corpus) {
    const repositoryId = await findRepositoryIdByName(repo.name);
    if (!repositoryId) continue;
    const repoFiles = await benchDb.select().from(files).where(eq(files.repositoryId, repositoryId));
    let symbolCount = 0;
    for (const f of repoFiles) {
      const rows = await benchDb.select().from(symbolsTable).where(eq(symbolsTable.fileId, f.id));
      symbolCount += rows.length;
      if (symbolCount > 0) break;
    }
    if (symbolCount === 0) reposContributingNoData.push(repo.name);
  }

  if (samples.length === 0) {
    return {
      results: [],
      accuracy: null,
      reposContributingNoData,
      note: "symbolGroundTruth.samples is empty (status PENDING) — not computed, not a failure. BENCH-06 is not valid until curated and person-verified."
    };
  }

  const results: SymbolResolutionResult[] = [];
  for (const sample of samples) {
    const repositoryId = await findRepositoryIdByName(sample.repoName);
    if (!repositoryId) {
      throw new Error(`Symbol sample for "${sample.repoName}": repo not found in trailhead_bench.`);
    }
    const repoFiles = await benchDb.select().from(files).where(eq(files.repositoryId, repositoryId));
    const targetFile = repoFiles.find((f) => f.path === sample.filePath);
    if (!targetFile) {
      throw new Error(`Symbol sample for "${sample.repoName}": file "${sample.filePath}" not found.`);
    }
    const actualSymbols = await benchDb.select().from(symbolsTable).where(eq(symbolsTable.fileId, targetFile.id));

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
    reposContributingNoData,
    note: `${samples.length} samples scored`
  };
}
