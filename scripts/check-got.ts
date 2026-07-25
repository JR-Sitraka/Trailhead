import postgres from 'postgres';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  const client = postgres(connectionString, { prepare: false });

  try {
    const rows = await client`SELECT id, name, status FROM repositories WHERE name::TEXT LIKE '%got%' LIMIT 10`;
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
