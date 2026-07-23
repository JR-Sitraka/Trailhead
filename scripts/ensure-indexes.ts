import postgres from "postgres";

async function ensureIndex(url: string) {
  if (!url) return;
  const client = postgres(url, { prepare: false });
  try {
    await client`
      CREATE INDEX IF NOT EXISTS embedding_chunks_embedding_idx
      ON embedding_chunks
      USING hnsw (embedding vector_cosine_ops)
    `;
    console.log(`Ensured HNSW index on: ${url}`);
  } catch (e) {
    console.error(`Failed to ensure index on ${url}:`, e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function main() {
if (process.env.DATABASE_URL) await ensureIndex(process.env.DATABASE_URL);
if (process.env.TEST_DATABASE_URL) await ensureIndex(process.env.TEST_DATABASE_URL);
}

main();
