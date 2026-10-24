import { createPostgresDatabase } from '../packages/platform-database/src/database.js';
import { SchemaIntrospector } from '../packages/platform-database/src/introspection.js';
import { CatalogNormalizer } from '../packages/platform-database/src/normalizer.js';
import { SchemaFingerprintCalculator } from '../packages/platform-database/src/fingerprint.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { config } from 'dotenv';

config();

const BASE_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
const TEST_DB = 'iam_fingerprint_gen';

async function main() {
  console.log('Generating schema fingerprint...');

  // Connect to postgres database to create/drop test database
  const adminDbUrl = BASE_DATABASE_URL.replace(/\/[^/]+$/, '/postgres');
  const db = createPostgresDatabase(adminDbUrl);

  try {
    // Create test database
    await db.pool.query(`DROP DATABASE IF EXISTS ${TEST_DB}`);
    await db.pool.query(`CREATE DATABASE ${TEST_DB}`);
    console.log(`Created database: ${TEST_DB}`);

    // Connect to test database
    const testDbUrl = BASE_DATABASE_URL.replace(/\/[^/]+$/, `/${TEST_DB}`);
    const testDb = createPostgresDatabase(testDbUrl);

    try {
      // Run migrations - resolve repo root from either scripts/ or repo root
      let repoRoot = process.cwd();
      // If in scripts directory, go up to repo root
      if (repoRoot.endsWith('scripts') || repoRoot.includes('\\scripts')) {
        repoRoot = join(repoRoot, '..');
      }
      const migrationDir = join(repoRoot, 'modules/iam/src/infrastructure/database/migrations');
      
      const historicalMigrations = [
        '0001_initial.sql',
        '0002_add_mfa.sql',
        '0003_add_soft_delete.sql',
        '0004_add_oauth_states.sql',
        '0005_add_outbox_events.sql',
        '0006_add_password_set.sql',
        '0007_add_tenant_module.sql',
        '0008_add_membership_module.sql',
        '0009_add_tenant_roles.sql',
        '0010_add_role_assignments.sql',
        '0011_add_invitations.sql',
        '0012_fix_role_assignment_cascade.sql',
      ];

      // Validate historical migrations exist
      for (const migration of historicalMigrations) {
        const migrationPath = join(migrationDir, migration);
        if (!existsSync(migrationPath)) {
          throw new Error(`Required historical migration missing: ${migration}`);
        }
      }

      // Validate no future migrations are accidentally included
      const allMigrations = await (await import('fs/promises')).readdir(migrationDir);
      const sqlMigrations = allMigrations.filter(f => f.endsWith('.sql')).sort();
      const expectedId = parseInt(historicalMigrations[historicalMigrations.length - 1].substring(0, 4), 10);
      
      for (const migration of sqlMigrations) {
        const migrationId = parseInt(migration.substring(0, 4), 10);
        if (migrationId > expectedId) {
          throw new Error(
            `Future migration detected: ${migration}. ` +
            `Baseline fingerprint should only target historical migrations up to ${expectedId}. ` +
            `Do not include future migrations in baseline fingerprint generation.`
          );
        }
      }

      for (const migration of historicalMigrations) {
        const migrationPath = join(migrationDir, migration);
        const sql = readFileSync(migrationPath, 'utf8');
        // Apply in a transaction to match MigrationRunner legacy behavior
        await testDb.pool.query('BEGIN');
        try {
          await testDb.pool.query(sql);
          await testDb.pool.query('COMMIT');
          console.log(`Applied: ${migration}`);
        } catch (error) {
          await testDb.pool.query('ROLLBACK');
          throw error;
        }
      }

      // Introspect schema
      const introspector = new SchemaIntrospector(testDb);
      const catalog = await introspector.inspect();
      console.log('Schema introspected');

      // Normalize
      const normalizer = new CatalogNormalizer();
      const normalized = normalizer.normalize(catalog);
      console.log('Schema normalized');

      // Calculate fingerprint
      const calculator = new SchemaFingerprintCalculator();
      const fingerprint = calculator.calculate(normalized);
      console.log(`Fingerprint: ${fingerprint.fingerprint}`);

      // Write to file with baseline identity
      const artifact = {
        baselineMigration: '0012',
        algorithm: fingerprint.algorithm,
        version: fingerprint.version,
        fingerprint: fingerprint.fingerprint,
        catalog: fingerprint.catalog
      };
      const outputPath = join(repoRoot, 'scripts', 'expected-fingerprint.json');
      writeFileSync(outputPath, JSON.stringify(artifact, null, 2));
      console.log(`Written to ${outputPath}`);

    } finally {
      await testDb.close();
    }

    // Cleanup
    await db.pool.query(`DROP DATABASE ${TEST_DB}`);
    console.log(`Dropped database: ${TEST_DB}`);

  } finally {
    await db.close();
  }
}

main().catch(console.error);
