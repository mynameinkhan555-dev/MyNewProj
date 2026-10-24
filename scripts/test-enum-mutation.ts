import { PostgresDatabase } from '../packages/platform-database/dist/database.js';
import { SchemaIntrospector } from '../packages/platform-database/dist/introspection.js';
import { CatalogNormalizer } from '../packages/platform-database/dist/normalizer.js';
import { SchemaFingerprintCalculator } from '../packages/platform-database/dist/fingerprint.js';
import { readFileSync } from 'fs';
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
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await db.close();
  }
}

async function calculateFingerprint(dbUrl: string, label: string) {
  const db = new PostgresDatabase({ url: dbUrl });

  try {
    const introspector = new SchemaIntrospector(db);
    const catalog = await introspector.inspect();
    const normalizer = new CatalogNormalizer();
    const normalized = normalizer.normalize(catalog);
    const calculator = new SchemaFingerprintCalculator();
    const fingerprint = calculator.calculate(normalized);
    console.log(`  ${label}: ${fingerprint.fingerprint}`);
    return fingerprint.fingerprint;
  } finally {
    await db.close();
  }
}

async function main() {
  const baselineUrl = 'postgresql://postgres:postgres@localhost:5432/l1_baseline_test';
  const enumMutationUrl = 'postgresql://postgres:postgres@localhost:5432/l1_mutation_enum';

  // Cleanup
  const adminDb = new PostgresDatabase({ url: 'postgresql://postgres:postgres@localhost:5432/postgres' });
  try {
    await adminDb.query('DROP DATABASE IF EXISTS l1_baseline_test');
    await adminDb.query('DROP DATABASE IF EXISTS l1_mutation_enum');
    await adminDb.query('CREATE DATABASE l1_baseline_test');
    await adminDb.query('CREATE DATABASE l1_mutation_enum');
    console.log('Test databases created');
  } finally {
    await adminDb.close();
  }

  // Baseline
  await applyMigrations(baselineUrl, 'baseline');
  const baselineFingerprint = await calculateFingerprint(baselineUrl, 'Baseline');
  const expectedBaseline = 'ec185b12543774b218b7c7e484dd961c5479c33e9e06fd22a47cf7e260d231c4';

  if (baselineFingerprint !== expectedBaseline) {
    console.error(`BASELINE MISMATCH: Expected ${expectedBaseline}, got ${baselineFingerprint}`);
    process.exit(1);
  }

  // Enum mutation - add a new enum value
  await applyMigrations(enumMutationUrl, 'enum_mutation');
  const enumDb = new PostgresDatabase({ url: enumMutationUrl });
  try {
    await enumDb.query("ALTER TYPE tenant_status ADD VALUE 'test_value'");
  } finally {
    await enumDb.close();
  }
  const enumFingerprint = await calculateFingerprint(enumMutationUrl, 'Enum Mutation');

  console.log('\n=== Enum Mutation Test ===');
  console.log(`Baseline: ${baselineFingerprint}`);
  console.log(`Enum Mutation: ${enumFingerprint} - ${enumFingerprint !== baselineFingerprint ? 'CHANGED ✓' : 'UNCHANGED ✗'}`);

  if (enumFingerprint === baselineFingerprint) {
    console.error('ENUM MUTATION TEST FAILED');
    process.exit(1);
  }

  console.log('ENUM MUTATION TEST PASSED');
}

main().catch(console.error);
