import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  console.log('Checking database state...');

  // Check all tables
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `;
  console.log('All tables:', tables.map(t => t.table_name));

  // Check if iam_sessions exists
  const iamSessionsExists = tables.some(t => t.table_name === 'iam_sessions');
  console.log('iam_sessions exists:', iamSessionsExists);

  if (iamSessionsExists) {
    // Check columns in iam_sessions
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'iam_sessions'
      ORDER BY ordinal_position
    `;
    console.log('iam_sessions columns:', columns);

    // Check if refresh_token_hash exists
    const hasHashColumn = columns.some(c => c.column_name === 'refresh_token_hash');
    console.log('refresh_token_hash column exists:', hasHashColumn);

    if (hasHashColumn) {
      // Check how many sessions have hashed tokens
      const hashedCount = await sql`
        SELECT COUNT(*) as count
        FROM iam_sessions
        WHERE refresh_token_hash IS NOT NULL
      `;
      console.log('Sessions with hashed tokens:', hashedCount[0].count);

      const totalCount = await sql`
        SELECT COUNT(*) as count
        FROM iam_sessions
      `;
      console.log('Total sessions:', totalCount[0].count);
    }
  }

  await sql.end();
}

main().catch(console.error);
