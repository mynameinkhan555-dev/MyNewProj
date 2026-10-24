import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function main() {
  console.log('Dropping manual refresh_token_hash column...');

  // Check if column exists
  const columnCheck = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'iam_sessions'
    AND column_name = 'refresh_token_hash'
  `;

  if (columnCheck.length === 0) {
    console.log('Column does not exist. Nothing to drop.');
    await sql.end();
    return;
  }

  console.log('Column exists. Dropping...');

  // Drop the column
  await sql`
    ALTER TABLE iam_sessions DROP COLUMN IF EXISTS refresh_token_hash
  `;

  console.log('Column dropped successfully.');

  // Drop the index if it exists
  await sql`
    DROP INDEX IF EXISTS iam_session_refresh_token_hash_idx
  `;

  console.log('Index dropped successfully.');

  await sql.end();
}

main().catch(console.error);
