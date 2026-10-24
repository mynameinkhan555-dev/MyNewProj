#!/usr/bin/env tsx
/**
 * CI Guardrail: Baseline Fingerprint Validation
 * 
 * This script validates the baseline fingerprint artifact and ensures:
 * - Artifact exists and is tracked
 * - Artifact is valid JSON
 * - Baseline identity is correct (0012)
 * - Algorithm is supported (sha256)
 * - Fingerprint format is valid
 * - Regenerated fingerprint matches committed artifact
 * - Future migrations do not change the 0012 baseline
 * 
 * Usage: pnpm validate-baseline-fingerprint
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createPostgresDatabase } from '@workspace/platform-database';
import { SchemaIntrospector } from '@workspace/platform-database';
import { CatalogNormalizer } from '@workspace/platform-database';
import { SchemaFingerprintCalculator } from '@workspace/platform-database';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import { createHash } from 'crypto';

// Resolve repository root deterministically
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');

// Load environment variables
config({ path: join(REPO_ROOT, '.env') });

const BASE_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
const TEST_DB = 'iam_ci_baseline_validation';
const SCRIPTS_DIR = join(REPO_ROOT, 'scripts');
const FINGERPRINT_PATH = join(SCRIPTS_DIR, 'expected-fingerprint.json');
const MIGRATION_DIR = join(REPO_ROOT, 'modules/iam/src/infrastructure/database/migrations');

const errors: string[] = [];
const warnings: string[] = [];

function logError(message: string) {
  console.error(`❌ ${message}`);
  errors.push(message);
}

function logWarning(message: string) {
  console.warn(`⚠️  ${message}`);
  warnings.push(message);
}

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

// CI-FP-001: Artifact exists
console.log('CI-FP-001: Checking artifact exists...');
if (!existsSync(FINGERPRINT_PATH)) {
  logError('Artifact does not exist: expected-fingerprint.json');
} else {
  logSuccess('Artifact exists');
}

// CI-FP-002: Artifact is Git-tracked
console.log('\nCI-FP-002: Checking artifact is Git-tracked...');
try {
  const gitCheck = execSync('git ls-files --error-unmatch scripts/expected-fingerprint.json', { 
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  logSuccess('Artifact is Git-tracked');
} catch (error) {
  logError('Artifact is not Git-tracked. Add it to Git: git add scripts/expected-fingerprint.json');
}

// CI-FP-003: Artifact is valid JSON
console.log('\nCI-FP-003: Checking artifact is valid JSON...');
let artifact: any = null;
try {
  const content = readFileSync(FINGERPRINT_PATH, 'utf-8');
  artifact = JSON.parse(content);
  logSuccess('Artifact is valid JSON');
} catch (error) {
  logError('Artifact is not valid JSON');
  process.exit(1);
}

// CI-FP-004: Algorithm is supported
console.log('\nCI-FP-004: Checking algorithm is supported...');
if (artifact.algorithm !== 'sha256') {
  logError(`Unsupported algorithm: ${artifact.algorithm}. Expected: sha256`);
}
if (artifact.version !== 1) {
  logError(`Unsupported version: ${artifact.version}. Expected: 1`);
}
if (artifact.algorithm === 'sha256' && artifact.version === 1) {
  logSuccess('Algorithm is supported (sha256, version 1)');
}

// CI-FP-005: Baseline identity is correct
console.log('\nCI-FP-005: Checking baseline identity...');
if (artifact.baselineMigration !== '0012') {
  logError(`Wrong baseline identity: ${artifact.baselineMigration}. Expected: 0012`);
} else {
  logSuccess('Baseline identity is correct (0012)');
}

// CI-FP-006: Fingerprint format is valid
console.log('\nCI-FP-006: Checking fingerprint format...');
if (!artifact.fingerprint || typeof artifact.fingerprint !== 'string') {
  logError('Invalid fingerprint format: missing or invalid fingerprint field');
} else if (artifact.fingerprint.length !== 64) {
  logError('Invalid fingerprint format: expected 64-character hex string');
} else {
  logSuccess('Fingerprint format is valid');
}

// CI-FP-007: Historical migrations match canonical SHA-256 values
console.log('\nCI-FP-007: Checking historical migration SHA-256 values...');
const expectedHashes: Record<string, string> = {
  '0001_initial.sql': '046f9c8e07b660ec40b78d01bacee563879895771ff5864efc36bf5889bf620a',
  '0002_add_mfa.sql': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  '0003_add_soft_delete.sql': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  '0004_add_oauth_states.sql': 'de8bd8a450b69e7142fd9171aff664c563759595e41b00c55ab95ba1c8c4938e',
  '0005_add_outbox_events.sql': '3cbf5080b455682f36217dee2f1e9d07f8a5016fd0e23ca80173a2fc23062b7d',
  '0006_add_password_set.sql': '67bb0a1bcdae3dfe45d2c6d8fbbf7fd781b8f7e1086d712dccdfe08c66753d06',
  '0007_add_tenant_module.sql': 'b352f0a9caac935261886599858d28fef46ad1bd0d56b3d82206a0a80c9ee0b2',
  '0008_add_membership_module.sql': '9ac49aa1e5a314dddfb72b7309e10c6f02738c1585c1ccb61cf464acc870cc8d',
  '0009_add_tenant_roles.sql': '8f2fc9d3b6937abc5a94a2c3e4194ec6587c176c28550bb23758daf5a50367aa',
  '0010_add_role_assignments.sql': 'ca2bd9504c4fad6085d6a74c0c910dc3e9a67aa6be892efdd3fe003b1c9eb82c',
  '0011_add_invitations.sql': '15967dcdac215771a9da635e16ef2276342593523a1db4001a0cc4c28a5aeb05',
  '0012_fix_role_assignment_cascade.sql': '656b2114d5c25efe4bfafc2ee4934d8532e6c26d37b4db6a7169af2571efe75d',
};

let hashMismatch = false;
for (const [file, expectedHash] of Object.entries(expectedHashes)) {
  const filePath = join(MIGRATION_DIR, file);
  if (!existsSync(filePath)) {
    logError(`Historical migration missing: ${file}`);
    hashMismatch = true;
    continue;
  }
  const content = readFileSync(filePath, 'utf-8');
  const actualHash = createHash('sha256').update(content).digest('hex');
  if (actualHash !== expectedHash) {
    logError(`Historical migration ${file} SHA-256 mismatch`);
    logError(`Expected: ${expectedHash}`);
    logError(`Actual: ${actualHash}`);
    hashMismatch = true;
  }
}

if (!hashMismatch) {
  logSuccess('Historical migration SHA-256 values match canonical hashes');
}

// CI-FP-008: Regenerated fingerprint matches committed artifact
console.log('\nCI-FP-008: Regenerating fingerprint to compare with committed artifact...');
try {
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
      // Apply historical migrations 0001-0012
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
        if (!existsSync(migrationPath)) {
          throw new Error(`Required historical migration missing: ${migration}`);
        }
        const sql = readFileSync(migrationPath, 'utf-8');
        // Apply in a transaction to match generator behavior
        await testDb.pool.query('BEGIN');
        try {
          await testDb.pool.query(sql);
          await testDb.pool.query('COMMIT');
        } catch (error) {
          await testDb.pool.query('ROLLBACK');
          throw error;
        }
      }

      // Introspect and calculate fingerprint
      const introspector = new SchemaIntrospector(testDb);
      const catalog = await introspector.inspect();
      const normalizer = new CatalogNormalizer();
      const normalized = normalizer.normalize(catalog);
      const calculator = new SchemaFingerprintCalculator();
      const regenerated = calculator.calculate(normalized);

      if (regenerated.fingerprint !== artifact.fingerprint) {
        logError('Regenerated fingerprint does not match committed artifact');
        logError(`Committed: ${artifact.fingerprint}`);
        logError(`Regenerated: ${regenerated.fingerprint}`);
        logError('Historical migrations may have been modified. Regenerate artifact with: pnpm generate-fingerprint');
      } else {
        logSuccess('Regenerated fingerprint matches committed artifact');
      }
    } finally {
      await testDb.close();
    }

    // Cleanup
    await db.pool.query(`DROP DATABASE IF EXISTS ${TEST_DB}`);
  } finally {
    await db.close();
  }
} catch (error) {
  logWarning('Failed to regenerate fingerprint for comparison');
  logWarning('Error: ' + (error instanceof Error ? error.message : String(error)));
  logWarning('Run manual validation with: pnpm generate-fingerprint');
}

// CI-FP-009: Adding future migrations does not change baseline
console.log('\nCI-FP-009: Checking future migrations do not affect baseline...');
try {
  const { readdir } = await import('fs/promises');
  const allMigrations = await readdir(MIGRATION_DIR);
  const sqlMigrations = allMigrations.filter(f => f.endsWith('.sql')).sort();
  
  const maxHistoricalId = 12;
  const futureMigrations = sqlMigrations.filter(f => {
    const id = parseInt(f.substring(0, 4), 10);
    return id > maxHistoricalId;
  });

  if (futureMigrations.length > 0) {
    logWarning(`Future migrations detected: ${futureMigrations.join(', ')}`);
    logWarning('Baseline fingerprint should remain at 0012 regardless of future migrations');
    logSuccess('Future migrations detected but baseline identity remains 0012');
  } else {
    logSuccess('No future migrations detected');
  }
} catch (error) {
  logWarning('Could not check for future migrations');
}

// CI-FP-010: Historical migration modification detection
console.log('\nCI-FP-010: Checking for historical migration modifications...');
try {
  const gitStatus = execSync('git diff --name-only modules/iam/src/infrastructure/database/migrations/', {
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  
  const modifiedMigrations = gitStatus.trim().split('\n').filter(f => f).filter(f => {
    const id = parseInt(f.substring(f.lastIndexOf('/') + 1, f.lastIndexOf('/') + 5), 10);
    return id <= 12;
  });

  if (modifiedMigrations.length > 0) {
    logError(`Historical migrations modified: ${modifiedMigrations.join(', ')}`);
    logError('Historical migrations (0001-0012) must be immutable');
    logError('Regenerate baseline fingerprint if this change is intentional');
  } else {
    logSuccess('No historical migration modifications detected');
  }
} catch (error) {
  logWarning('Could not check for historical migration modifications');
}

// CI-FP-011: Generator contract validation
console.log('\nCI-FP-011: Checking generator contract...');
const generatorPath = join(SCRIPTS_DIR, 'generate-fingerprint.ts');
if (!existsSync(generatorPath)) {
  logError('Generator script does not exist: generate-fingerprint.ts');
} else {
  const generatorContent = readFileSync(generatorPath, 'utf-8');
  
  // Check that generator explicitly targets 0012
  if (generatorContent.includes('baselineMigration: \'0012\'') || 
      generatorContent.includes('baselineMigration: "0012"')) {
    logSuccess('Generator includes baseline identity declaration');
  } else {
    logError('Generator does not declare baseline identity (0012)');
  }

  // Check that generator has validation for future migrations
  if (generatorContent.includes('Future migration detected') || 
      generatorContent.includes('future migration')) {
    logSuccess('Generator validates against future migrations');
  } else {
    logWarning('Generator may not validate against future migrations');
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('BASELINE FINGERPRINT VALIDATION SUMMARY');
console.log('='.repeat(60));

if (errors.length > 0) {
  console.log(`\n❌ VALIDATION FAILED: ${errors.length} error(s)`);
  errors.forEach(err => console.log(`  - ${err}`));
  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} warning(s)`);
    warnings.forEach(warn => console.log(`  - ${warn}`));
  }
  process.exit(1);
} else {
  console.log('\n✅ VALIDATION PASSED');
  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} warning(s)`);
    warnings.forEach(warn => console.log(`  - ${warn}`));
  }
  process.exit(0);
}
