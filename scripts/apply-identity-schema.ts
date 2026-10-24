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

async function applyMigration() {
  try {
    const sql = readFileSync('packages/platform-database/migrations/0000_identity.sql', 'utf-8');
    
    console.log('Applying Identity schema migration...');
    await client.unsafe(sql);
    console.log('✅ Identity schema applied successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
