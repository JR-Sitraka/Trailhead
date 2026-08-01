import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2") as Promise<FeatureExtractionPipeline>;
  }
  return extractorPromise;
}

const EMBEDDING_DIM = 384;
const BATCH_SIZE = 32;

// Length-aware batching (item 7, Group 2). Real bug found during item 3's
// embedding-swap dry run: a real 13-chunk batch requested 6.5GB and
// onnxruntime aborted mid-run (ADR-009). BATCH_SIZE alone doesn't bound
// memory — attention cost scales with sequence length, so a batch of many
// long chunks can request unbounded memory well under the item-count cap.
// Character count is a cheap, tokenizer-free proxy for sequence length.
// Tunable heuristic, not precisely justified — same status as
// embeddingChunker.ts's fixed 30-line fallback window.
const MAX_BATCH_CHARS = 8000;

// A single chunk longer than MAX_BATCH_CHARS still becomes its own
// one-item batch — this is batching mechanics, not chunk splitting; an
// individual chunk's content is never truncated here.
export function buildBatches(texts: string[], maxItems = BATCH_SIZE, maxChars = MAX_BATCH_CHARS): string[][] {
  const batches: string[][] = [];
  let current: string[] = [];
  let currentChars = 0;

  for (const text of texts) {
    const wouldExceedCount = current.length + 1 > maxItems;
    const wouldExceedChars = current.length > 0 && currentChars + text.length > maxChars;

    if (current.length > 0 && (wouldExceedCount || wouldExceedChars)) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }

    current.push(text);
    currentChars += text.length;
  }

  if (current.length > 0) batches.push(current);
  return batches;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const extractor = await getExtractor();
  const results: number[][] = [];

  for (const batch of buildBatches(texts)) {
    const result = (await extractor(batch, { pooling: "mean", normalize: true })) as any;
    const data = result.data as Float32Array;
    for (let j = 0; j < batch.length; j++) {
      const offset = j * EMBEDDING_DIM;
      results.push(Array.from(data.subarray(offset, offset + EMBEDDING_DIM)));
    }
  }

  return results;
}
