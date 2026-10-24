import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const connectionString = process.env.DATABASE_URL;

async function main() {
  console.log('Applying migration 0014 via script...');

  const client = postgres(connectionString);

  try {
    // Use sql.begin for transaction
    await client.begin(async (sql) => {
      // Add refresh_token_hash column
      await sql`
        ALTER TABLE iam_sessions ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT
      `;
      console.log('Column added.');

      // Hash all existing refresh tokens
      await sql`
        UPDATE iam_sessions
        SET refresh_token_hash = encode(digest(refresh_token, 'sha256'), 'hex')
        WHERE refresh_token_hash IS NULL
      `;
      console.log('Existing tokens hashed.');

      // Create index on hash
      await sql`
        CREATE INDEX IF NOT EXISTS iam_session_refresh_token_hash_idx ON iam_sessions(refresh_token_hash)
      `;
      console.log('Index created.');
    });

    console.log('Migration 0014 applied successfully.');

    // Add to migration journal manually
    const migrationPath = join(process.cwd(), 'modules/iam/src/infrastructure/database/migrations/0014_hash_refresh_tokens.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');
    const { createHash } = await import('crypto');
    const hash = createHash('sha256').update(migrationSql).digest('hex');
    const now = Date.now().toString();

    await client`
      INSERT INTO __drizzle_migrations (hash, created_at, name)
      VALUES (${hash}, ${now}, '0014_hash_refresh_tokens')
    `;
    console.log('Migration journal updated successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(console.error);
