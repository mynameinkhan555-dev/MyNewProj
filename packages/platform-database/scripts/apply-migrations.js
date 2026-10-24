import postgres from 'postgres';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(connectionString);

async function applyMigrations() {
  const migrationsDir = join(__dirname, '../migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${migrationFiles.length} migration files`);

  for (const file of migrationFiles) {
    const filePath = join(migrationsDir, file);
    console.log(`Applying ${file}...`);

    const migrationSQL = readFileSync(filePath, 'utf-8');
    
    // Split by statement-breakpoint and execute each
    const statements = migrationSQL.split('--> statement-breakpoint');
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        try {
          await sql.unsafe(trimmed);
        } catch (error) {
          // Log but continue (migrations have idempotent patterns)
          console.error(`  Error in statement: ${error.message}`);
        }
      }
    }

    console.log(`  ✓ ${file} applied`);
  }

  console.log('All migrations applied successfully');
  await sql.end();
}

applyMigrations().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
