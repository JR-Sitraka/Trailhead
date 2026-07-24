import postgres from "postgres";

const url = process.env.DATABASE_URL!;
if (!url) { console.error("DATABASE_URL missing"); process.exit(1); }
const sql = postgres(url, { prepare: false });

async function main() {
  const sid = await sql`SELECT id FROM symbols WHERE "repositoryId" = '0aa69121-92ad-4750-af26-97ccbd3dbf2a' ORDER BY id LIMIT 5`;
  const eid = await sql`SELECT id FROM embedding_chunks WHERE "repositoryId" = '0aa69121-92ad-4750-af26-97ccbd3dbf2a' ORDER BY id LIMIT 5`;
  const scount = (await sql`SELECT count(*) as c FROM symbols WHERE "repositoryId" = '0aa69121-92ad-4750-af26-97ccbd3dbf2a'`)[0].c;
  const ecount = (await sql`SELECT count(*) as c FROM embedding_chunks WHERE "repositoryId" = '0aa69121-92ad-4750-af26-97ccbd3dbf2a'`)[0].c;
  console.log('SYMBOL_COUNT', scount);
  console.log('SYMBOL_IDS_SAMPLE', JSON.stringify(sid));
  console.log('EMBEDDING_COUNT', ecount);
  console.log('EMBEDDING_IDS_SAMPLE', JSON.stringify(eid));
  await sql.end();
}

main();
