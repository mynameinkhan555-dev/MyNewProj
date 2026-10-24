import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  console.log('Checking migration journal...');

  const migrations = await sql`
    SELECT *
    FROM __drizzle_migrations
    ORDER BY created_at DESC
  `;

  console.log('Total migrations:', migrations.length);
  console.log('Recent migrations:');
  migrations.slice(0, 5).forEach(m => {
    console.log(`- ${m.name} (${m.hash.substring(0, 8)}...)`);
  });

  const migration0014 = migrations.find(m => m.name === '0014_hash_refresh_tokens');
  console.log('\nMigration 0014 in journal:', migration0014 ? 'YES' : 'NO');

  await sql.end();
}

main().catch(console.error);
