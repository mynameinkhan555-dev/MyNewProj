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
  const withJournalUrl = 'postgresql://postgres:postgres@localhost:5432/l1_journal_with';
  const withoutJournalUrl = 'postgresql://postgres:postgres@localhost:5432/l1_journal_without';

  // Cleanup
  const adminDb = new PostgresDatabase({ url: 'postgresql://postgres:postgres@localhost:5432/postgres' });
  try {
    await adminDb.query('DROP DATABASE IF EXISTS l1_journal_with');
    await adminDb.query('DROP DATABASE IF EXISTS l1_journal_without');
    await adminDb.query('CREATE DATABASE l1_journal_with');
    await adminDb.query('CREATE DATABASE l1_journal_without');
    console.log('Test databases created');
  } finally {
    await adminDb.close();
  }

  // Database WITH migration journal (apply migrations normally)
  await applyMigrations(withJournalUrl, 'with_journal');
  const withJournalFingerprint = await calculateFingerprint(withJournalUrl, 'With Journal');

  // Database WITHOUT migration journal (apply migrations, then drop journal table)
  await applyMigrations(withoutJournalUrl, 'without_journal');
  const withoutJournalDb = new PostgresDatabase({ url: withoutJournalUrl });
  try {
    await withoutJournalDb.query('DROP TABLE IF EXISTS __drizzle_migrations');
  } finally {
    await withoutJournalDb.close();
  }
  const withoutJournalFingerprint = await calculateFingerprint(withoutJournalUrl, 'Without Journal');

  console.log('\n=== Journal Exclusion Test ===');
  console.log(`With Journal: ${withJournalFingerprint}`);
  console.log(`Without Journal: ${withoutJournalFingerprint}`);
  console.log(`Match: ${withJournalFingerprint === withoutJournalFingerprint ? 'YES' : 'NO'}`);

  if (withJournalFingerprint !== withoutJournalFingerprint) {
    console.error('JOURNAL EXCLUSION TEST FAILED');
    process.exit(1);
  }

  console.log('JOURNAL EXCLUSION TEST PASSED');
}

main().catch(console.error);
