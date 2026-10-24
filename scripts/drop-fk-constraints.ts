import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  await sql`ALTER TABLE memberships DROP CONSTRAINT IF EXISTS fk_memberships_user_id;`;
  await sql`ALTER TABLE memberships DROP CONSTRAINT IF EXISTS fk_memberships_tenant_id;`;
  console.log('FK constraints dropped');
  await sql.end();
}

main().catch(console.error);
