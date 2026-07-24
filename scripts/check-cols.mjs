import postgres from "postgres";

const url = "postgresql://postgres:sitraka@localhost:5432/trailhead_dev";
const sql = postgres(url, { prepare: false });

async function main() {
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'symbols' AND table_schema = 'public'`;
  console.log(cols.map(r => r.column_name).join(", "));
  const cols2 = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'embedding_chunks' AND table_schema = 'public'`;
  console.log(cols2.map(r => r.column_name).join(", "));
  await sql.end();
}

main();
