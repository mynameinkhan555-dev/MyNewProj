import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  // Authorization schema FK constraints
  await sql`
    ALTER TABLE tenant_roles
    ADD CONSTRAINT fk_tenant_roles_tenant_id
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  `;

  await sql`
    ALTER TABLE role_assignments
    ADD CONSTRAINT fk_role_assignments_membership_id
    FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE;
  `;

  await sql`
    ALTER TABLE role_assignments
    ADD CONSTRAINT fk_role_assignments_role_id
    FOREIGN KEY (role_id) REFERENCES tenant_roles(id) ON DELETE CASCADE;
  `;

  await sql`
    ALTER TABLE role_permissions
    ADD CONSTRAINT fk_role_permissions_role_id
    FOREIGN KEY (role_id) REFERENCES tenant_roles(id) ON DELETE CASCADE;
  `;

  await sql`
    ALTER TABLE role_permissions
    ADD CONSTRAINT fk_role_permissions_permission_id
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;
  `;

  console.log('Authorization schema FK constraints restored');
  await sql.end();
}

main().catch(console.error);
