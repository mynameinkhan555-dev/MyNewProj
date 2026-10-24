import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  await sql`DROP TABLE IF EXISTS role_assignments CASCADE;`;

  await sql`
    CREATE TABLE role_assignments (
      id UUID PRIMARY KEY,
      membership_id UUID NOT NULL,
      role_id UUID NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
      CONSTRAINT chk_role_assignments_status CHECK (status IN ('ACTIVE', 'DELETED'))
    );
  `;

  await sql`
    CREATE INDEX idx_role_assignments_membership_id ON role_assignments(membership_id);
  `;

  await sql`
    CREATE INDEX idx_role_assignments_role_id ON role_assignments(role_id);
  `;

  await sql`
    CREATE UNIQUE INDEX uq_role_assignments_membership_role_active
    ON role_assignments(membership_id, role_id)
    WHERE status = 'ACTIVE';
  `;

  console.log('role_assignments table recreated');
  await sql.end();
}

main().catch(console.error);
