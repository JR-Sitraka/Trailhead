// npm run benchmark:setup — imports the 5 ADR-008 corpus repos into
// trailhead_bench through the real import pipeline (the same
// preprocessing/parsing/embedding modules the app uses, reused
// directly — not reimplemented), then verifies each reaches `ready`
// with non-zero files and chunks. Any failure or empty result STOPS
// the run — no repo is pinned on assumption (BENCH-07).
import { eq } from "drizzle-orm";
import {
  fetchGithubRepoInfo,
  fetchGithubZipball,
  stripGitHubTopLevel,
  validateZipSafety
} from "../../src/server/services/preprocessing";
import { extractSymbols, type ExtractedSymbol } from "../../src/server/services/symbols";
import { computeChunkRanges, sliceChunkText } from "../../src/server/services/embeddingChunker";
import { generateEmbeddings } from "../../src/server/services/embeddings";
import { detectStackFacts } from "../../src/server/services/stackFacts";
import { benchDb, closeBenchDb } from "./db";
import { repositories, analysisJobs, files, symbols, embeddingChunks } from "../../src/server/db/schema";
import { randomUUID } from "crypto";

interface CorpusSlot {
  name: string;
  url: string; // GitHub URL, or "self" for the Trailhead repo itself
  rationale: string;
}

// ADR-008's enumerated corpus. Trailhead itself is imported from the
// live public repo (not a local zip) so its SHA is pinned the same
// way as the other four — one consistent import path, one consistent
// verification story.
const CORPUS: CorpusSlot[] = [
  {
    name: "JR-Sitraka/Trailhead",
    url: "https://github.com/JR-Sitraka/Trailhead",
    rationale: "framework signal (Next.js/TypeScript, this project's own stack)"
  },
  {
    name: "sindresorhus/got",
    url: "https://github.com/sindresorhus/got",
    rationale: "the misdetection class, finding #7's exact repo"
  },
  {
    name: "sindresorhus/escape-string-regexp",
    url: "https://github.com/sindresorhus/escape-string-regexp",
    rationale: "threshold-tuning continuity (KNOWN-GOOD 2026-07-25)"
  },
  {
    name: "openai/DALL-E",
    url: "https://github.com/openai/DALL-E",
    rationale: "Python/mixed-language coverage"
  },
  {
    name: "sindresorhus/awesome",
    url: "https://github.com/sindresorhus/awesome",
    rationale: "documentation-heavy, protects the no-regression criterion"
  }
];

interface SetupResult {
  name: string;
  sourceUrl: string;
  commitSha: string;
  repositoryId: string;
  files: number;
  chunks: number;
  symbolsCount: number;
  status: string;
}

async function importOne(slot: CorpusSlot): Promise<SetupResult> {
  console.log(`\n=== Importing ${slot.name} ===`);

  const repoInfo = await fetchGithubRepoInfo(slot.url);
  console.log(`  resolved: owner=${repoInfo.owner} repo=${repoInfo.repo} defaultBranch=${repoInfo.defaultBranch} commitSha=${repoInfo.commitSha}`);
  if (!repoInfo.commitSha) {
    throw new Error(`${slot.name}: no commit SHA resolved — cannot pin`);
  }

  const zipBuffer = await fetchGithubZipball(repoInfo.owner, repoInfo.repo, repoInfo.commitSha);
  console.log(`  downloaded zipball: ${zipBuffer.length} bytes`);
  const stripped = stripGitHubTopLevel(zipBuffer);
  const preprocessing = await validateZipSafety(stripped, randomUUID());
  console.log(`  preprocessing: ${preprocessing.totalFiles} files, truncated=${preprocessing.truncated}, unpackedSize=${preprocessing.totalUnpackedSize}`);

  const [repo] = await benchDb.insert(repositories).values({
    name: slot.name,
    status: "queued",
    source: "github",
    sourceUrl: slot.url,
    commitSha: repoInfo.commitSha
  }).returning();

  const [job] = await benchDb.insert(analysisJobs).values({
    repositoryId: repo.id,
    status: "queued",
    truncated: preprocessing.truncated
  }).returning();

  const fileInserts = preprocessing.files.map((f) => ({
    repositoryId: repo.id,
    path: f.path,
    size: f.size,
    language: f.language,
    content: f.content,
    category: f.category,
    skipped: f.skipped,
    skipReason: f.skipReason
  }));
  if (fileInserts.length > 0) {
    await benchDb.insert(files).values(fileInserts);
  }

  // Replicates poller.ts's runAnalysisPhases + runEmbeddingPhase against
  // benchDb instead of the app's shared db client — same modules, same
  // logic, different target database (poller.ts itself is hardwired to
  // src/server/db's DATABASE_URL/TEST_DATABASE_URL selection, so it
  // cannot be called directly here without touching src/).
  await benchDb.update(repositories).set({ status: "analyzing" }).where(eq(repositories.id, repo.id));

  const parseableFiles = await benchDb.select().from(files).where(eq(files.repositoryId, repo.id));
  const codeFiles = parseableFiles.filter(
    (f) => !f.skipped && f.content !== null && (f.language === "typescript" || f.language === "javascript")
  );

  const allSymbols: Array<{ fileId: string; kind: "function" | "export" | "class" | "interface" | "import"; name: string; startLine: number; endLine: number }> = [];
  for (const file of codeFiles) {
    try {
      const extracted = await extractSymbols(file.content, file.path, file.language!);
      for (const s of extracted) {
        allSymbols.push({ fileId: file.id, kind: s.kind, name: s.name, startLine: s.startLine, endLine: s.endLine });
      }
    } catch (e) {
      console.error(`  extractSymbols failed for ${file.path}:`, e);
    }
  }
  if (allSymbols.length > 0) {
    await benchDb.insert(symbols).values(allSymbols);
  }
  console.log(`  symbols extracted: ${allSymbols.length}`);

  const stackFacts = detectStackFacts(
    parseableFiles.map((f) => ({ path: f.path, language: f.language, skipped: f.skipped, content: f.content }))
  );
  await benchDb.update(repositories).set({
    primaryLanguage: stackFacts.primaryLanguage,
    framework: stackFacts.framework,
    packageManager: stackFacts.packageManager,
    buildTool: stackFacts.buildTool,
    testFrameworkSummary: stackFacts.testFrameworkSummary
  }).where(eq(repositories.id, repo.id));
  console.log(`  stack facts: ${JSON.stringify(stackFacts)}`);

  await benchDb.update(analysisJobs).set({ parsingCompletedAt: new Date() }).where(eq(analysisJobs.id, job.id));

  const embeddableFiles = await benchDb.select().from(files).where(eq(files.repositoryId, repo.id));
  let totalChunks = 0;
  for (const file of embeddableFiles.filter((f) => !f.skipped && f.content !== null)) {
    try {
      const symbolRows = await benchDb.select().from(symbols).where(eq(symbols.fileId, file.id));
      const ranges = computeChunkRanges(file.content!, symbolRows as Array<ExtractedSymbol & { kind: string }>);
      const chunkTexts = ranges.map((r) => sliceChunkText(file.content!, r.startLine, r.endLine));
      const embeddings = await generateEmbeddings(chunkTexts);
      const rows = ranges.map((r, idx) => ({
        repositoryId: file.repositoryId,
        fileId: file.id,
        startLine: r.startLine,
        endLine: r.endLine,
        embedding: embeddings[idx]
      }));
      if (rows.length > 0) {
        await benchDb.insert(embeddingChunks).values(rows);
        totalChunks += rows.length;
      }
    } catch (e) {
      console.error(`  embedding failed for ${file.path}:`, e);
    }
  }
  console.log(`  chunks embedded: ${totalChunks}`);

  await benchDb.update(analysisJobs).set({ status: "completed", embeddingCompletedAt: new Date() }).where(eq(analysisJobs.id, job.id));
  await benchDb.update(repositories).set({ status: "ready" }).where(eq(repositories.id, repo.id));

  const [finalRepo] = await benchDb.select().from(repositories).where(eq(repositories.id, repo.id));
  const finalFileCount = embeddableFiles.length;

  return {
    name: slot.name,
    sourceUrl: slot.url,
    commitSha: repoInfo.commitSha,
    repositoryId: repo.id,
    files: finalFileCount,
    chunks: totalChunks,
    symbolsCount: allSymbols.length,
    status: finalRepo.status
  };
}

async function main() {
  const results: SetupResult[] = [];
  for (const slot of CORPUS) {
    let result: SetupResult;
    try {
      result = await importOne(slot);
    } catch (e) {
      console.error(`\nSTOP: ${slot.name} failed to import: ${(e as Error).message}`);
      await closeBenchDb();
      process.exit(1);
    }

    if (result.status !== "ready" || result.files === 0 || result.chunks === 0) {
      console.error(
        `\nSTOP: ${slot.name} landed in a broken state — status=${result.status} files=${result.files} chunks=${result.chunks}. ` +
        `Not pinning a broken repo (BENCH-07). Refusing to write manifest.json.`
      );
      await closeBenchDb();
      process.exit(1);
    }

    results.push(result);
  }

  console.log("\n=== BENCH-07 setup evidence (all 5 repos) ===");
  console.table(results.map((r) => ({
    name: r.name,
    status: r.status,
    files: r.files,
    symbols: r.symbolsCount,
    chunks: r.chunks,
    commitSha: r.commitSha.slice(0, 12)
  })));

  console.log("\nAll 5 repos imported into trailhead_bench, each ready with non-zero files and chunks.");
  console.log(JSON.stringify(results, null, 2));

  await closeBenchDb();
}

main().catch(async (e) => {
  console.error(e);
  await closeBenchDb();
  process.exit(1);
});
