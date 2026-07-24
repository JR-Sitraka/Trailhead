const postgres = require("postgres");

const url = "postgresql://postgres:sitraka@localhost:5432/trailhead_dev";
const sql = postgres(url, { prepare: false });

async function main() {
  const sid = await sql`SELECT s.id FROM symbols s JOIN files f ON f.id = s.file_id WHERE f.repository_id = '0aa69121-92ad-4750-af26-97ccbd3dbf2a' ORDER BY s.id LIMIT 5`;
  const eid = await sql`SELECT id FROM embedding_chunks WHERE repository_id = '0aa69121-92ad-4750-af26-97ccbd3dbf2a' ORDER BY id LIMIT 5`;
  const scount = (await sql`SELECT count(*) c FROM symbols s JOIN files f ON f.id = s.file_id WHERE f.repository_id = '0aa69121-92ad-4750-af26-97ccbd3dbf2a'`)[0].c;
  const ecount = (await sql`SELECT count(*) c FROM embedding_chunks WHERE repository_id = '0aa69121-92ad-4750-af26-97ccbd3dbf2a'`)[0].c;
  console.log("SYMBOL_COUNT", scount);
  console.log("SYMBOL_IDS_SAMPLE", JSON.stringify(sid));
  console.log("EMBEDDING_COUNT", ecount);
  console.log("EMBEDDING_IDS_SAMPLE", JSON.stringify(eid));
  await sql.end();
}

main();
