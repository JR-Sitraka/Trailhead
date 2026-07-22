import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const isTestEnv = !!process.env.VITEST;
const connectionString = isTestEnv
  ? (process.env.TEST_DATABASE_URL || process.env.DATABASE_URL)
  : (process.env.DATABASE_URL || process.env.TEST_DATABASE_URL);

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });

export type Database = typeof db;

