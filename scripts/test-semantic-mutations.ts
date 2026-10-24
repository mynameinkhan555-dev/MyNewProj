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
  const addColumnUrl = 'postgresql://postgres:postgres@localhost:5432/l1_mutation_add_column';
  const nullabilityUrl = 'postgresql://postgres:postgres@localhost:5432/l1_mutation_nullability';
  const defaultUrl = 'postgresql://postgres:postgres@localhost:5432/l1_mutation_default';
  const constraintUrl = 'postgresql://postgres:postgres@localhost:5432/l1_mutation_constraint';
  const indexUrl = 'postgresql://postgres:postgres@localhost:5432/l1_mutation_index';

  // Cleanup
  const adminDb = new PostgresDatabase({ url: 'postgresql://postgres:postgres@localhost:5432/postgres' });
  try {
    await adminDb.query('DROP DATABASE IF EXISTS l1_baseline_test');
    await adminDb.query('DROP DATABASE IF EXISTS l1_mutation_add_column');
    await adminDb.query('DROP DATABASE IF EXISTS l1_mutation_nullability');
    await adminDb.query('DROP DATABASE IF EXISTS l1_mutation_default');
    await adminDb.query('DROP DATABASE IF EXISTS l1_mutation_constraint');
    await adminDb.query('DROP DATABASE IF EXISTS l1_mutation_index');
    await adminDb.query('CREATE DATABASE l1_baseline_test');
    await adminDb.query('CREATE DATABASE l1_mutation_add_column');
    await adminDb.query('CREATE DATABASE l1_mutation_nullability');
    await adminDb.query('CREATE DATABASE l1_mutation_default');
    await adminDb.query('CREATE DATABASE l1_mutation_constraint');
    await adminDb.query('CREATE DATABASE l1_mutation_index');
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

  // Add column mutation
  await applyMigrations(addColumnUrl, 'add_column');
  const addColumnDb = new PostgresDatabase({ url: addColumnUrl });
  try {
    await addColumnDb.query('ALTER TABLE identities ADD COLUMN test_column text');
  } finally {
    await addColumnDb.close();
  }
  const addColumnFingerprint = await calculateFingerprint(addColumnUrl, 'Add Column');

  // Nullability mutation
  await applyMigrations(nullabilityUrl, 'nullability');
  const nullabilityDb = new PostgresDatabase({ url: nullabilityUrl });
  try {
    await nullabilityDb.query('ALTER TABLE identities ALTER COLUMN email DROP NOT NULL');
  } finally {
    await nullabilityDb.close();
  }
  const nullabilityFingerprint = await calculateFingerprint(nullabilityUrl, 'Nullability');

  // Default mutation
  await applyMigrations(defaultUrl, 'default');
  const defaultDb = new PostgresDatabase({ url: defaultUrl });
  try {
    await defaultDb.query('ALTER TABLE identities ALTER COLUMN email SET DEFAULT \'test@example.com\'');
  } finally {
    await defaultDb.close();
  }
  const defaultFingerprint = await calculateFingerprint(defaultUrl, 'Default');

  // Constraint mutation
  await applyMigrations(constraintUrl, 'constraint');
  const constraintDb = new PostgresDatabase({ url: constraintUrl });
  try {
    await constraintDb.query('ALTER TABLE identities ADD CONSTRAINT test_check CHECK (length(email) > 5)');
  } finally {
    await constraintDb.close();
  }
  const constraintFingerprint = await calculateFingerprint(constraintUrl, 'Constraint');

  // Index mutation
  await applyMigrations(indexUrl, 'index');
  const indexDb = new PostgresDatabase({ url: indexUrl });
  try {
    await indexDb.query('CREATE INDEX test_idx ON identities (email)');
  } finally {
    await indexDb.close();
  }
  const indexFingerprint = await calculateFingerprint(indexUrl, 'Index');

  console.log('\n=== Semantic Mutation Tests ===');
  console.log(`Baseline: ${baselineFingerprint}`);
  console.log(`Add Column: ${addColumnFingerprint} - ${addColumnFingerprint !== baselineFingerprint ? 'CHANGED ✓' : 'UNCHANGED ✗'}`);
  console.log(`Nullability: ${nullabilityFingerprint} - ${nullabilityFingerprint !== baselineFingerprint ? 'CHANGED ✓' : 'UNCHANGED ✗'}`);
  console.log(`Default: ${defaultFingerprint} - ${defaultFingerprint !== baselineFingerprint ? 'CHANGED ✓' : 'UNCHANGED ✗'}`);
  console.log(`Constraint: ${constraintFingerprint} - ${constraintFingerprint !== baselineFingerprint ? 'CHANGED ✓' : 'UNCHANGED ✗'}`);
  console.log(`Index: ${indexFingerprint} - ${indexFingerprint !== baselineFingerprint ? 'CHANGED ✓' : 'UNCHANGED ✗'}`);

  const allChanged =
    addColumnFingerprint !== baselineFingerprint &&
    nullabilityFingerprint !== baselineFingerprint &&
    defaultFingerprint !== baselineFingerprint &&
    constraintFingerprint !== baselineFingerprint &&
    indexFingerprint !== baselineFingerprint;

  if (!allChanged) {
    console.error('SEMANTIC MUTATION TESTS FAILED');
    process.exit(1);
  }

  console.log('SEMANTIC MUTATION TESTS PASSED');
}

main().catch(console.error);
