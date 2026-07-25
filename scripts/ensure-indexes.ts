import postgres from "postgres";

async function ensureSearchVector(url: string) {
  if (!url) return;
  const client = postgres(url, { prepare: false });
  try {
    await client`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'files' AND column_name = 'content_search_vector'
        ) THEN
          ALTER TABLE files ADD COLUMN content_search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
        ELSE
          ALTER TABLE files DROP COLUMN content_search_vector;
          ALTER TABLE files ADD COLUMN content_search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
        END IF;
      END $$;
    `;
    await client`
      CREATE INDEX IF NOT EXISTS files_content_search_vector_idx
      ON files
      USING GIN (content_search_vector)
    `;
    console.log(`Ensured search vector column + GIN index on: ${url}`);
  } catch (e) {
    console.error(`Failed to ensure search vector on ${url}:`, e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

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
  if (process.env.DATABASE_URL) await ensureSearchVector(process.env.DATABASE_URL);
  if (process.env.TEST_DATABASE_URL) await ensureSearchVector(process.env.TEST_DATABASE_URL);
  if (process.env.DATABASE_URL) await ensureIndex(process.env.DATABASE_URL);
  if (process.env.TEST_DATABASE_URL) await ensureIndex(process.env.TEST_DATABASE_URL);
}

main();
