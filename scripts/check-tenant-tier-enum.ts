import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  const result = await sql`
    SELECT enumlabel
    FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tenant_tier')
  `;
  console.log('tenant_tier enum values:', result);
  await sql.end();
}

main().catch(console.error);
