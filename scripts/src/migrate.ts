#!/usr/bin/env node
/**
 * Production Migration CLI
 * Entry point for database migrations
 */

import { MigrationRunner } from '@workspace/migration-runtime';
import { createLogger } from '@workspace/platform-logger';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config();

const DATABASE_URL = process.env.DATABASE_URL;
const MIGRATION_DIRECTORY = process.env.MIGRATION_DIRECTORY || join(process.cwd(), 'modules/iam/src/infrastructure/database/migrations');
const EXPECTED_FINGERPRINT_PATH = process.env.EXPECTED_FINGERPRINT_PATH || join(process.cwd(), 'scripts/expected-fingerprint.json');
const SKIP_FINGERPRINT = process.env.SKIP_FINGERPRINT === 'true';

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

let expectedFingerprint;
if (!SKIP_FINGERPRINT) {
  try {
    const fingerprintContent = readFileSync(EXPECTED_FINGERPRINT_PATH, 'utf-8');
    expectedFingerprint = JSON.parse(fingerprintContent);
  } catch (error) {
    console.error(`Failed to read expected fingerprint from ${EXPECTED_FINGERPRINT_PATH}: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

const logger = createLogger('migrate-cli');

const runner = new MigrationRunner({
  databaseUrl: DATABASE_URL,
  migrationDirectory: MIGRATION_DIRECTORY,
  expectedFingerprint,
  logger,
});

runner.run().then((result) => {
  if (!result.success) {
    console.error(`Migration failed: ${result.reason}`);
    process.exit(1);
  }

  console.log(`Migration completed successfully. Mode: ${result.mode}, Migrations executed: ${result.migrationsExecuted}`);
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
