import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  const columns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'memberships'
    ORDER BY ordinal_position
  `;
  console.log('memberships table columns:', columns);
  await sql.end();
}

main().catch(console.error);
