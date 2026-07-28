// Bench-only Drizzle client — deliberately NOT src/server/db/index.ts,
// which hardcodes DATABASE_URL/TEST_DATABASE_URL selection. Adding a
// third branch there would touch application code under src/, which
// this task is prohibited from doing. This connects to
// BENCH_DATABASE_URL only, reusing the real schema definitions
// (schema.ts itself has no app-specific imports, safe to reuse as-is).
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../src/server/db/schema";
import { loadBenchEnv } from "./env";

const env = loadBenchEnv();

export const benchClient = postgres(env.BENCH_DATABASE_URL, { prepare: false });
export const benchDb = drizzle(benchClient, { schema });
export type BenchDatabase = typeof benchDb;

export async function closeBenchDb(): Promise<void> {
  await benchClient.end();
}
