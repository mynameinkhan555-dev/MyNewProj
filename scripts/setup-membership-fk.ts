import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  // Create temporary users table for membership tests
  await sql`
    CREATE TABLE IF NOT EXISTS temp_users (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
  `;

  // Create temporary tenants table for membership tests
  await sql`
    CREATE TABLE IF NOT EXISTS temp_tenants (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
      CONSTRAINT chk_temp_tenants_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED'))
    );
  `;

  // Drop existing FK constraints on memberships
  await sql`
    ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_user_id_fkey;
  `;
  await sql`
    ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_tenant_id_fkey;
  `;

  // Add FK constraints to temp tables
  await sql`
    ALTER TABLE memberships
    ADD CONSTRAINT memberships_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES temp_users(id) ON DELETE CASCADE;
  `;
  await sql`
    ALTER TABLE memberships
    ADD CONSTRAINT memberships_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES temp_tenants(id) ON DELETE CASCADE;
  `;

  console.log('FK constraints updated to temp tables');
  await sql.end();
}

main().catch(console.error);
