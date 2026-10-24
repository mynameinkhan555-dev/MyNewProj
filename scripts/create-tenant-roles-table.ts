import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS tenant_roles (
      id UUID PRIMARY KEY,
      tenant_id UUID NOT NULL,
      key TEXT NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
      CONSTRAINT chk_tenant_roles_status CHECK (status IN ('ACTIVE', 'DELETED'))
    );
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_roles_tenant_key ON tenant_roles(tenant_id, key);
  `;

  console.log('tenant_roles table created');
  await sql.end();
}

main().catch(console.error);
