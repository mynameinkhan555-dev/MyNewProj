import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

async function applyHashMigration() {
  try {
    console.log('Applying IAM hash migration...');
    
    // Step 1: Add column
    await client.unsafe(`ALTER TABLE iam_sessions ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT`);
    console.log('✅ Column added');
    
    // Step 2: Hash existing tokens
    await client.unsafe(`UPDATE iam_sessions SET refresh_token_hash = encode(digest(refresh_token, 'sha256'), 'hex') WHERE refresh_token_hash IS NULL`);
    console.log('✅ Existing tokens hashed');
    
    // Step 3: Create index
    await client.unsafe(`CREATE INDEX IF NOT EXISTS iam_session_refresh_token_hash_idx ON iam_sessions(refresh_token_hash)`);
    console.log('✅ Index created');
    
    console.log('✅ IAM hash migration applied successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyHashMigration();
