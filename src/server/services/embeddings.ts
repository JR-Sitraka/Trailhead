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

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const extractor = await getExtractor();
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const result = (await extractor(batch, { pooling: "mean", normalize: true })) as any;
    const data = result.data as Float32Array;
    for (let j = 0; j < batch.length; j++) {
      const offset = j * EMBEDDING_DIM;
      results.push(Array.from(data.subarray(offset, offset + EMBEDDING_DIM)));
    }
  }

  return results;
}
