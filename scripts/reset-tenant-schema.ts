import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  console.log('Resetting tenant schema to match migration...');

  // Drop existing tables in correct order (children first)
  await sql`DROP TABLE IF EXISTS memberships CASCADE`;
  console.log('Dropped memberships table');

  await sql`DROP TABLE IF EXISTS tenants CASCADE`;
  console.log('Dropped tenants table');

  await sql.end();
}

main().catch(console.error);
