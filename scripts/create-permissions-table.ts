import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS permissions (
      id UUID PRIMARY KEY,
      key TEXT NOT NULL,
      scope TEXT NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      metadata JSONB,
      status TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
      CONSTRAINT chk_permissions_scope CHECK (scope IN ('TENANT', 'PLATFORM')),
      CONSTRAINT chk_permissions_status CHECK (status IN ('ACTIVE', 'DELETED'))
    );
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_permissions_key ON permissions(key);
  `;

  console.log('permissions table created');
  await sql.end();
}

main().catch(console.error);
