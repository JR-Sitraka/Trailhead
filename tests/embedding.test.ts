import { describe, it, expect } from "vitest";
import postgres from "postgres";
import { db } from "../src/server/db";
import { repositories, files } from "../src/server/db/schema";

async function getRawConnection() {
  const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("No database URL");
  return postgres(connectionString, { prepare: false });
}

function vecToSql(vec: number[]): string {
  return "[" + vec.map(v => v.toFixed(6)).join(",") + "]";
}

function makeVector(dim: number, seed: number): number[] {
  const vec: number[] = [];
  for (let i = 0; i < dim; i++) {
    vec.push(Math.sin(seed + i * 0.1) * 0.5 + 0.5);
  }
  return vec;
}

describe("EmbeddingChunk pgvector HNSW index", () => {
  it("uses HNSW index for cosine distance queries and rejects the wrong pattern", async () => {
    const rawDb = await getRawConnection();

    try {
      const [repo] = await db.insert(repositories).values({
        name: `vector-test-${Date.now()}`,
        source: "zip",
        sourceUrl: null,
        commitSha: null
      }).returning();

      const [file] = await db.insert(files).values({
        repositoryId: repo.id,
        path: "src/main.py",
        size: 1024,
        language: "python",
        skipped: false,
        skipReason: null
      }).returning();

      const vecA = makeVector(384, 1.0);
      const vecB = makeVector(384, 2.0);
      const vecC = makeVector(384, 3.0);

      const aStr = vecToSql(vecA);
      const bStr = vecToSql(vecB);
      const cStr = vecToSql(vecC);

      await rawDb.unsafe(
        `INSERT INTO embedding_chunks (file_id, repository_id, start_line, end_line, embedding) VALUES ($1,$2,$3,$4,$5::vector(384)), ($1,$2,$6,$7,$8::vector(384)), ($1,$2,$9,$10,$11::vector(384))`,
        [file.id, repo.id, 1, 50, aStr, 51, 100, bStr, 101, 150, cStr]
      );

      const queryVec = makeVector(384, 1.01);
      const qStr = vecToSql(queryVec);

      const correctSql = `
        SET enable_seqscan = OFF;
        EXPLAIN SELECT id FROM embedding_chunks
        WHERE repository_id = '${repo.id}'
        ORDER BY embedding <=> '${qStr}'::vector ASC
        LIMIT 1
      `;

      const wrongSql = `
        SET enable_seqscan = OFF;
        EXPLAIN SELECT id FROM embedding_chunks
        WHERE repository_id = '${repo.id}'
        ORDER BY 1 - (embedding <=> '${qStr}'::vector) DESC
        LIMIT 1
      `;

      const correctExplain = await rawDb.unsafe(correctSql);
      const wrongExplain = await rawDb.unsafe(wrongSql);

      console.log("\n=== CORRECT pattern EXPLAIN ===");
      console.log(JSON.stringify(correctExplain, null, 2));

      console.log("\n=== WRONG pattern EXPLAIN ===");
      console.log(JSON.stringify(wrongExplain, null, 2));

      const correctPlan = JSON.stringify(correctExplain);
      const wrongPlan = JSON.stringify(wrongExplain);

      expect(correctPlan).toContain("Index Scan");
      expect(correctPlan).toContain("embedding_chunks_embedding_idx");

      const wrongUsesIndex = wrongPlan.includes("Index Scan") && wrongPlan.includes("embedding_chunks_embedding_idx");
      expect(wrongUsesIndex).toBe(false);

      await rawDb.unsafe("SET enable_seqscan = ON");

      const correctResult = await rawDb.unsafe(
        `SELECT id FROM embedding_chunks WHERE repository_id = '${repo.id}' ORDER BY embedding <=> '${qStr}'::vector ASC LIMIT 1`
      );

    } finally {
      await rawDb.end();
    }
  });
});

describe("database connection selection", () => {
  it("connects to trailhead_test under vitest via drizzle db", async () => {
    const drizzleDb = db as any;
    const client = drizzleDb.$client as postgres;
    const [row] = await client.unsafe(`SELECT current_database() AS db`).then((r: any) => r);
    expect(row.db).toBe("trailhead_test");
  });
});
