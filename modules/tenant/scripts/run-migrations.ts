import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load .env from project root
config({ path: join(__dirname, '..', '..', '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

async function runMigrations() {
  console.log('Starting PostgreSQL migrations...');

  const client = postgres(DATABASE_URL);
  const db = drizzle(client);

  try {
    // Create user_tenant_memberships table
    console.log('Creating user_tenant_memberships table...');
    const createTableSQL = readFileSync(
      join(__dirname, '..', 'drizzle', '0000_create_user_tenant_memberships.sql'),
      'utf-8'
    );
    await client.unsafe(createTableSQL);
    console.log('✅ user_tenant_memberships table created');

    // Enable RLS
    console.log('Enabling Row-Level Security...');
    const rlsSQL = readFileSync(
      join(__dirname, '..', 'drizzle', '0001_enable_rls.sql'),
      'utf-8'
    );
    await client.unsafe(rlsSQL);
    console.log('✅ RLS enabled');

    console.log('Migrations completed successfully! 🎉');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigrations().catch(console.error);
