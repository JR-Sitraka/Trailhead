// Applies the same tsvector column + GIN index + HNSW index that
// scripts/ensure-indexes.ts applies to dev/test, targeted at
// BENCH_DATABASE_URL instead. Kept as a separate file (not a modified
// scripts/ensure-indexes.ts) — benchmark tooling only, per task scope.
import postgres from "postgres";
import { loadBenchEnv } from "./env";

async function main() {
  const env = loadBenchEnv();
  const client = postgres(env.BENCH_DATABASE_URL, { prepare: false });
  try {
    await client`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'files' AND column_name = 'content_search_vector'
        ) THEN
          ALTER TABLE files ADD COLUMN content_search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
        END IF;
      END $$;
    `;
    await client`
      CREATE INDEX IF NOT EXISTS files_content_search_vector_idx
      ON files
      USING GIN (content_search_vector)
    `;
    await client`
      CREATE INDEX IF NOT EXISTS embedding_chunks_embedding_idx
      ON embedding_chunks
      USING hnsw (embedding vector_cosine_ops)
    `;
    console.log("Ensured search vector + HNSW index on trailhead_bench");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
