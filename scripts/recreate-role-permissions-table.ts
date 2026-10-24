import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  await sql`DROP TABLE IF EXISTS role_permissions CASCADE;`;

  await sql`
    CREATE TABLE role_permissions (
      role_id UUID NOT NULL,
      permission_id UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      PRIMARY KEY (role_id, permission_id)
    );
  `;

  await sql`
    CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
  `;

  await sql`
    CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
  `;

  console.log('role_permissions table recreated');
  await sql.end();
}

main().catch(console.error);
