import { db } from "../src/server/db";
import { repositories } from "../src/server/db/schema";
import { sql } from "drizzle-orm";

const all = await db.select().from(repositories);
console.log("total repos:", all.length);
for (const r of all) {
  console.log(r.name);
}

process.exit(0);
