import { PostgresDatabase } from '../packages/platform-database/dist/database.js';
import { SchemaIntrospector } from '../packages/platform-database/dist/introspection.js';
import { CatalogNormalizer } from '../packages/platform-database/dist/normalizer.js';
import { SchemaFingerprintCalculator } from '../packages/platform-database/dist/fingerprint.js';
import { readFileSync, existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { config } from 'dotenv';

config();

const MIGRATION_DIR = join(process.cwd(), '..', 'modules/iam/src/infrastructure/database/migrations');

async function applyMigrations(dbUrl: string, dbName: string) {
  console.log(`Applying migrations to ${dbName}...`);

  const db = new PostgresDatabase({ url: dbUrl });

  try {
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

    for (const migration of historicalMigrations) {
      const migrationPath = join(MIGRATION_DIR, migration);
      const sql = readFileSync(migrationPath, 'utf8');
      await db.query('BEGIN');
      try {
        await db.query(sql);
        await db.query('COMMIT');
        console.log(`  Applied: ${migration} to ${dbName}`);
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await db.close();
  }
}

async function calculateFingerprint(dbUrl: string, dbName: string) {
  console.log(`Calculating fingerprint for ${dbName}...`);

  const db = new PostgresDatabase({ url: dbUrl });

  try {
    const introspector = new SchemaIntrospector(db);
    const catalog = await introspector.inspect();
    console.log(`  Schema introspected for ${dbName}`);

    const normalizer = new CatalogNormalizer();
    const normalized = normalizer.normalize(catalog);
    console.log(`  Schema normalized for ${dbName}`);

    const calculator = new SchemaFingerprintCalculator();
    const fingerprint = calculator.calculate(normalized);
    console.log(`  Fingerprint for ${dbName}: ${fingerprint.fingerprint}`);

    return fingerprint.fingerprint;
  } finally {
    await db.close();
  }
}

async function main() {
  const dbAUrl = 'postgresql://postgres:postgres@localhost:5432/l1_oid_test_a';
  const dbBUrl = 'postgresql://postgres:postgres@localhost:5432/l1_oid_test_b';

  await applyMigrations(dbAUrl, 'Database A');
  await applyMigrations(dbBUrl, 'Database B');

  const fingerprintA = await calculateFingerprint(dbAUrl, 'Database A');
  const fingerprintB = await calculateFingerprint(dbBUrl, 'Database B');

  console.log('\n=== OID Independence Test ===');
  console.log(`Database A: ${fingerprintA}`);
  console.log(`Database B: ${fingerprintB}`);
  console.log(`Match: ${fingerprintA === fingerprintB ? 'YES' : 'NO'}`);

  if (fingerprintA !== fingerprintB) {
    console.error('OID INDEPENDENCE TEST FAILED');
    process.exit(1);
  }

  console.log('OID INDEPENDENCE TEST PASSED');
}

main().catch(console.error);
