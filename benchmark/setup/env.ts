// Minimal .env loader for benchmark scripts. The project has no dotenv
// dependency (confirmed: package.json lists none), and its existing
// scripts/*.ts rely on process.env being pre-set — benchmark tooling
// parses .env itself rather than adding a new dependency for one concern.
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..", "..");

export interface BenchEnv {
  BENCH_DATABASE_URL: string;
  GITHUB_TOKEN: string | null;
}

export function loadBenchEnv(): BenchEnv {
  const envPath = resolve(PROJECT_ROOT, ".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, key, rawValue] = m;
      const value = rawValue.replace(/^["']|["']$/g, "");
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }

  if (!process.env.BENCH_DATABASE_URL) {
    throw new Error(
      "BENCH_DATABASE_URL is required (see .env.example) — the benchmark never falls back to DATABASE_URL or TEST_DATABASE_URL"
    );
  }

  return {
    BENCH_DATABASE_URL: process.env.BENCH_DATABASE_URL,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || null
  };
}
