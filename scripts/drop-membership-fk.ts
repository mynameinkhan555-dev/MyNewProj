import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  // Drop FK constraints for membership tests
  await sql`
    ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_user_id_fkey;
  `;
  await sql`
    ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_tenant_id_fkey;
  `;

  console.log('FK constraints dropped for membership tests');
  await sql.end();
}

main().catch(console.error);
