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
  const devUrl = process.env.DATABASE_URL!;
  const testUrl = process.env.TEST_DATABASE_URL!;
  if (!devUrl || !testUrl) {
    console.error("DATABASE_URL and TEST_DATABASE_URL are both required");
    process.exit(1);
  }

  const { spawn } = await import("child_process");
  const { dirname, join, resolve } = await import("path");
  const { fileURLToPath } = await import("url");
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const binDir = join(resolve(__dirname, ".."), "node_modules", ".bin");
  const drizzleKitBin =
    process.platform === "win32"
      ? join(binDir, "drizzle-kit.cmd")
      : join(binDir, "drizzle-kit");

  async function runPush(label: string, url: string) {
    console.log(`--- Pushing schema to ${label} ---`);
    await new Promise<void>((resolve, reject) => {
      const child = spawn(drizzleKitBin, ["push"], {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: url },
        shell: true
      });
      child.on("close", code => {
        if (code === 0) {
          console.log(`${label}: push OK`);
          resolve();
        } else {
          reject(new Error(`${label}: drizzle-kit push exited with code ${code}`));
        }
      });
    });
  }

  try {
    await runPush("trailhead_dev", devUrl);
    await runPush("trailhead_test", testUrl);
    await ensureIndex(devUrl);
    await ensureIndex(testUrl);
    console.log("\nAll databases synced.");
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
