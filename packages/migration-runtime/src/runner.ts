/**
 * Migration Runner
 * Executes migrations with two-tier transaction support
 */

import { PostgresDatabase, SchemaIntrospector, CatalogNormalizer, SchemaFingerprintCalculator, LockHandle, pg } from '@workspace/platform-database';
import { createLogger, Logger } from '@workspace/platform-logger';
import { MigrationClassifier, MigrationType } from './classifier.js';
import { JournalManager } from './journal.js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export type SchemaFingerprint = {
  fingerprint: string;
  algorithm: string;
  version: number;
  catalog?: any;
};

export type MigrationRunnerConfig = {
  databaseUrl: string;
  migrationDirectory: string;
  expectedFingerprint?: SchemaFingerprint;
  logger?: Logger;
};

export type MigrationResult = {
  success: boolean;
  mode: 'normal' | 'baseline';
  migrationsExecuted: number;
  reason?: string;
};

export type MigrationFile = {
  id: string;
  filename: string;
  content: string;
  hash: string;
  type: MigrationType;
};

const ADVISORY_LOCK_KEY = 5432100001;

export class MigrationRunner {
  private db: PostgresDatabase;
  private logger: Logger;
  private classifier: MigrationClassifier;
  private journal: JournalManager;
  private config: MigrationRunnerConfig;

  constructor(config: MigrationRunnerConfig) {
    this.config = config;
    this.logger = config.logger || createLogger('migration-runner');
    this.db = new PostgresDatabase({ url: config.databaseUrl });
    this.classifier = new MigrationClassifier();
    this.journal = new JournalManager(this.db, this.logger);
  }

  async run(): Promise<MigrationResult> {
    let lockHandle: LockHandle | null = null;

    try {
      await this.journal.ensureTable();

      // Acquire session-scoped advisory lock on dedicated client
      lockHandle = await this.db.acquireSessionAdvisoryLock(ADVISORY_LOCK_KEY);
      if (!lockHandle) {
        return {
          success: false,
          mode: 'normal',
          migrationsExecuted: 0,
          reason: 'Could not acquire advisory lock - another migration may be in progress',
        };
      }

      try {
        // Check if this is a baseline scenario
        const journalEntries = await this.journal.getEntries();
        const isBaseline = journalEntries.length === 0;

        if (isBaseline && this.config.expectedFingerprint && this.config.expectedFingerprint.fingerprint) {
          return await this.runBaseline(lockHandle.client);
        }

        return await this.runNormal(lockHandle.client);
      } finally {
        // Release session-scoped lock
        if (lockHandle) {
          await lockHandle.release();
        }
      }
    } catch (error) {
      this.logger.error('Migration failed', error);
      return {
        success: false,
        mode: 'normal',
        migrationsExecuted: 0,
        reason: error instanceof Error ? error.message : String(error),
      };
    } finally {
      await this.db.close();
    }
  }

  private discoverMigrations(): MigrationFile[] {
    const files = readdirSync(this.config.migrationDirectory);
    const sqlFiles = files.filter(f => f.endsWith('.sql'));

    const migrations: MigrationFile[] = sqlFiles.map(filename => {
      const content = readFileSync(join(this.config.migrationDirectory, filename), 'utf-8');
      const hash = this.journal.calculateHash(content);
      const type = this.classifier.classify(content);
      const id = filename.replace('.sql', '');

      return { id, filename, content, hash, type };
    });

    // Sort by migration ID for deterministic ordering
    return migrations.sort((a, b) => a.id.localeCompare(b.id));
  }

  private async runBaseline(lockClient: pg.PoolClient): Promise<MigrationResult> {
    this.logger.info('Running baseline mode');

    if (!this.config.expectedFingerprint) {
      return {
        success: false,
        mode: 'baseline',
        migrationsExecuted: 0,
        reason: 'Baseline mode requires expected fingerprint configuration',
      };
    }

    try {
      // Inspect current schema
      const introspector = new SchemaIntrospector(this.db);
      const catalog = await introspector.inspect();

      // Normalize schema
      const normalizer = new CatalogNormalizer();
      const normalized = normalizer.normalize(catalog);

      // Calculate fingerprint
      const calculator = new SchemaFingerprintCalculator();
      const fingerprint = calculator.calculate(normalized);

      // Verify against authoritative baseline
      if (fingerprint.fingerprint !== this.config.expectedFingerprint.fingerprint) {
        return {
          success: false,
          mode: 'baseline',
          migrationsExecuted: 0,
          reason: `Schema fingerprint mismatch. Expected: ${this.config.expectedFingerprint.fingerprint}, Actual: ${fingerprint.fingerprint}`,
        };
      }

      this.logger.info('Schema fingerprint verified successfully');

      // Discover migrations
      const migrations = this.discoverMigrations();

      // Initialize journal for historical migrations only
      const historicalMigrations = migrations.filter(m => {
        const idNum = parseInt(m.id.substring(0, 4), 10);
        return idNum <= 12; // Historical migrations are 0001-0012
      });

      for (const migration of historicalMigrations) {
        const existingEntry = await this.journal.getEntry(migration.id);
        if (!existingEntry) {
          await this.journal.insert(migration.id, migration.hash, lockClient);
          this.logger.info(`Baseline journaled: ${migration.id}`);
        }
      }

      // Do NOT journal pending migrations (0013+)
      const pendingCount = migrations.length - historicalMigrations.length;
      if (pendingCount > 0) {
        this.logger.info(`Baseline completed. ${pendingCount} pending migrations not journaled.`);
      }

      return {
        success: true,
        mode: 'baseline',
        migrationsExecuted: historicalMigrations.length,
      };
    } catch (error) {
      this.logger.error('Baseline failed', error);
      return {
        success: false,
        mode: 'baseline',
        migrationsExecuted: 0,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async runNormal(lockClient: pg.PoolClient): Promise<MigrationResult> {
    this.logger.info('Running normal mode');

    const migrations = this.discoverMigrations();
    const journalEntries = await this.journal.getEntries();

    // Validate journal/filesystem completeness before execution
    // Every journaled migration must have a corresponding file on disk
    const migrationIds = new Set(migrations.map(m => m.id));
    for (const journalEntry of journalEntries) {
      if (!migrationIds.has(journalEntry.name)) {
        throw new Error(
          `Migration history integrity violation: migration "${journalEntry.name}" is journaled ` +
          `but is missing from the authoritative migration directory. ` +
          `This indicates incomplete migration history.`
        );
      }
    }

    const executedCount = await this.executePendingMigrations(migrations, journalEntries, lockClient);

    return {
      success: true,
      mode: 'normal',
      migrationsExecuted: executedCount,
    };
  }

  private async executePendingMigrations(
    migrations: MigrationFile[],
    journalEntries: any[],
    lockClient: pg.PoolClient
  ): Promise<number> {
    let executedCount = 0;

    for (const migration of migrations) {
      const journalEntry = journalEntries.find(e => e.name === migration.id);

      // Skip if already journaled and hash matches
      if (journalEntry && journalEntry.hash === migration.hash) {
        this.logger.info(`Skipping already applied migration: ${migration.id}`);
        continue;
      }

      // Hash mismatch - fail closed
      if (journalEntry && journalEntry.hash !== migration.hash) {
        throw new Error(
          `Migration ${migration.id} hash mismatch. Journal: ${journalEntry.hash}, File: ${migration.hash}`
        );
      }

      // Execute migration
      await this.executeMigration(migration, lockClient);
      executedCount++;
    }

    return executedCount;
  }

  private async executeMigration(migration: MigrationFile, lockClient: pg.PoolClient): Promise<void> {
    this.logger.info(`Executing migration: ${migration.id}`);

    const idNum = parseInt(migration.id.substring(0, 4), 10);
    const isHistorical = idNum <= 12;

    if (isHistorical) {
      // Historical migrations preserve their own transaction ownership
      if (migration.content.trim()) {
        await lockClient.query(migration.content);
      }
      // Always journal historical migrations
      await this.journal.insert(migration.id, migration.hash, lockClient);
    } else if (migration.type === MigrationType.Atomic) {
      // Future migrations use atomic execution
      await this.db.transaction(async (client) => {
        if (migration.content.trim()) {
          await client.query(migration.content);
        }
        await this.journal.insert(migration.id, migration.hash, client);
      });
    } else if (migration.type === MigrationType.Empty) {
      // Empty migrations just get journaled
      await this.journal.insert(migration.id, migration.hash, lockClient);
    }

    this.logger.info(`Migration completed: ${migration.id}`);
  }
}
