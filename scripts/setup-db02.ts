import { PostgresDatabase } from '../packages/platform-database/dist/database.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config();

const MIGRATION_DIR = join(process.cwd(), '..', 'l1_db02_migrations');

async function main() {
  const db = new PostgresDatabase({ url: 'postgresql://postgres:postgres@localhost:5432/l1_db02_new' });

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
        console.log(`Applied: ${migration}`);
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    }

    console.log('All 0001-0012 migrations applied successfully');
  } finally {
    await db.close();
  }
}

main().catch(console.error);
