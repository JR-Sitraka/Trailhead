import { describe, it, expect, beforeAll } from "vitest";
import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";
import os from "os";
import path from "path";
import fs from "fs/promises";

describe("@huggingface/transformers proof (env + cache + dim + determinism)", () => {
  let extractor: FeatureExtractionPipeline | null = null;

  beforeAll(async () => {
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    ) as FeatureExtractionPipeline;
  }, 60_000);

  it("reveals the actual default cache directory on this machine", () => {
    const pkgRoot = path.resolve(
      os.homedir(),
      "Desktop",
      "Trailhead",
      "node_modules",
      "@huggingface",
      "transformers"
    );
    const defaultCacheDir = path.join(pkgRoot, ".cache");
    const exists = fs.access(defaultCacheDir).then(
      () => true,
      () => false
    );
    return exists.then((cacheExists) => {
      if (cacheExists) {
        console.log(`\n[CACHE DIR EXISTS] ${defaultCacheDir}`);
      } else {
        console.log(`\n[CACHE DIR MISSING] ${defaultCacheDir}`);
      }
    });
  });

  it("generates a real embedding and reports actual dimensionality", async () => {
    const text = "Hello, world";
    const result = await extractor!(text, { pooling: "mean", normalize: true });
    const vec = Array.from(result.data as Float32Array);
    console.log(`\n[OUTPUT DIM] ${vec.length}`);
    console.log(`[FIRST 5 VALUES] ${vec.slice(0, 5).map((v) => v.toFixed(6)).join(", ")}`);
    expect(vec.length).toBe(384);
  });

  it("generates IDENTICAL vectors for the same text (determinism)", async () => {
    const text = "Proof of embedding determinism test";
    const r1 = await extractor!(text, { pooling: "mean", normalize: true });
    const r2 = await extractor!(text, { pooling: "mean", normalize: true });
    const v1 = Array.from(r1.data as Float32Array);
    const v2 = Array.from(r2.data as Float32Array);
    expect(v1.length).toBe(v2.length);
    let maxDiff = 0;
    for (let i = 0; i < v1.length; i++) {
      maxDiff = Math.max(maxDiff, Math.abs(v1[i] - v2[i]));
    }
    console.log(`[MAX DIFF] ${maxDiff}`);
    expect(maxDiff).toBeLessThan(1e-6);
  });
});
