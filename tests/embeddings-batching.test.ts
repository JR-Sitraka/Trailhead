import { describe, it, expect } from "vitest";
import { buildBatches, generateEmbeddings } from "../src/server/services/embeddings";

// Item 7, Group 2. Real bug: ADR-009's embedding-swap dry run hit a real
// 13-chunk batch that requested 6.5GB and aborted onnxruntime mid-run.
// BATCH_SIZE=32 alone never bounded that — a batch of many long chunks can
// exceed it well under the item-count cap, since attention memory scales
// with sequence length, not item count.

describe("buildBatches: subdivision logic (deterministic, no model needed)", () => {
  it("keeps a single item-count-sized batch of short texts as one batch — no regression for typical usage", () => {
    const texts = Array.from({ length: 32 }, (_, i) => `const x${i} = ${i};`);
    const batches = buildBatches(texts);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(32);
  });

  it("still splits purely on item count when texts are short (unchanged BATCH_SIZE=32 behavior)", () => {
    const texts = Array.from({ length: 70 }, (_, i) => `short chunk ${i}`);
    const batches = buildBatches(texts);
    expect(batches).toHaveLength(3); // 32 + 32 + 6
    expect(batches[0]).toHaveLength(32);
    expect(batches[1]).toHaveLength(32);
    expect(batches[2]).toHaveLength(6);
  });

  it("subdivides a batch of genuinely long chunks by character budget, reproducing the shape that caused the real OOM", () => {
    // The real failure: 13 long chunks in one batch, 6.5GB requested.
    // Reconstruct the same shape — 13 chunks, each long enough that a
    // count-only cap of 32 would have put all 13 in a single batch.
    const longChunk = "x".repeat(3918); // ADR-009's real outlier chunk length
    const texts = Array.from({ length: 13 }, () => longChunk);

    const batches = buildBatches(texts);

    // Must NOT be the single 13-item batch that caused the real OOM.
    expect(batches.length).toBeGreaterThan(1);
    // Every batch must respect the character budget.
    for (const batch of batches) {
      const totalChars = batch.reduce((sum, t) => sum + t.length, 0);
      expect(totalChars).toBeLessThanOrEqual(8000);
    }
    // No chunk lost or duplicated in the split.
    expect(batches.flat()).toHaveLength(13);
    expect(batches.flat().every((t) => t === longChunk)).toBe(true);
  });

  it("gives an oversized single chunk its own one-item batch rather than looping forever or dropping it", () => {
    const hugeChunk = "y".repeat(50000);
    const texts = ["small chunk", hugeChunk, "another small chunk"];
    const batches = buildBatches(texts);

    const hugeBatch = batches.find((b) => b.includes(hugeChunk));
    expect(hugeBatch).toBeDefined();
    expect(hugeBatch).toHaveLength(1);
    // Content is never truncated — batching mechanics only.
    expect(hugeBatch![0].length).toBe(50000);
  });

  it("respects a custom item cap independently of the char budget", () => {
    const texts = Array.from({ length: 5 }, (_, i) => `x${i}`);
    const batches = buildBatches(texts, 2, 100000);
    expect(batches).toHaveLength(3); // 2 + 2 + 1
  });
});

describe("generateEmbeddings: end-to-end correctness on long real content", () => {
  it("produces one correct 384-dim vector per chunk for a batch of genuinely long chunks, without requesting one oversized model call", async () => {
    // Real content, not synthetic filler — a long, realistic TypeScript
    // function repeated to build a batch shaped like the real OOM case.
    const realLongChunk = `
export function processRepositoryAnalysis(repositoryId: string, options: AnalysisOptions): AnalysisResult {
  const files = loadFilesForRepository(repositoryId);
  const symbols: ExtractedSymbol[] = [];
  const chunks: EmbeddingChunkCandidate[] = [];
  for (const file of files) {
    if (file.skipped || file.content === null) continue;
    const extracted = extractSymbolsFromFile(file.content, file.path, file.language);
    symbols.push(...extracted);
    const ranges = computeChunkRangesForFile(file.content, extracted);
    for (const range of ranges) {
      chunks.push({ fileId: file.id, startLine: range.startLine, endLine: range.endLine, text: sliceLines(file.content, range.startLine, range.endLine) });
    }
  }
  const stackFacts = detectStackFactsForFiles(files);
  return { symbols, chunks, stackFacts, truncated: options.truncated ?? false };
}
`.repeat(6); // pushes each chunk well past a typical single chunk length

    const texts = Array.from({ length: 13 }, () => realLongChunk);

    const embeddings = await generateEmbeddings(texts);

    expect(embeddings).toHaveLength(13);
    for (const vec of embeddings) {
      expect(vec).toHaveLength(384);
      expect(vec.every((v) => Number.isFinite(v))).toBe(true);
    }
    // Identical input content must produce identical embeddings regardless
    // of which sub-batch it landed in — proves the split doesn't corrupt
    // per-item output.
    for (let i = 1; i < embeddings.length; i++) {
      expect(embeddings[i]).toEqual(embeddings[0]);
    }
  }, 120000);

  it("still handles a normal small batch of short real chunks correctly (no regression)", async () => {
    const texts = [
      "export const x = 1;",
      "function add(a: number, b: number): number { return a + b; }",
      "import { foo } from './foo';"
    ];
    const embeddings = await generateEmbeddings(texts);
    expect(embeddings).toHaveLength(3);
    for (const vec of embeddings) {
      expect(vec).toHaveLength(384);
    }
  }, 60000);
});
