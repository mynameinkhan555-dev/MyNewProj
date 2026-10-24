import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  // Tenant schema FK constraints
  await sql`
    ALTER TABLE memberships
    ADD CONSTRAINT fk_memberships_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  `;

  await sql`
    ALTER TABLE memberships
    ADD CONSTRAINT fk_memberships_tenant_id
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  `;

  console.log('Tenant schema FK constraints restored');
  await sql.end();
}

main().catch(console.error);
