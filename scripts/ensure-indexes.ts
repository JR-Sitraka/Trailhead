import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL or TEST_DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { prepare: false });

async function main() {
  try {
    await client`
      CREATE INDEX IF NOT EXISTS embedding_chunks_embedding_idx
      ON embedding_chunks
      USING hnsw (embedding vector_cosine_ops)
    `;
    console.log("Ensured HNSW index on embedding_chunks.embedding");
  } catch (e) {
    console.error("Failed to ensure index:", e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
