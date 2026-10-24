/**
 * Journal Manager
 * Manages migration journal in PostgreSQL
 */

import { createHash } from 'crypto';
import { PostgresDatabase } from '@workspace/platform-database';
import { createLogger, Logger } from '@workspace/platform-logger';
import type { pg } from '@workspace/platform-database';

export type JournalEntry = {
  id: number;
  hash: string;
  createdAt: number;
  name: string;
};

export class JournalManager {
  private readonly tableName = '__drizzle_migrations';

  constructor(
    private db: PostgresDatabase,
    private logger: Logger = createLogger('journal')
  ) {}

  async ensureTable(): Promise<void> {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at NUMERIC NOT NULL,
        name TEXT NOT NULL
      )
    `);
  }

  async getEntries(): Promise<JournalEntry[]> {
    const result = await this.db.query(
      `SELECT id, hash, created_at, name FROM ${this.tableName} ORDER BY id`
    );
    return result.rows.map(row => ({
      id: row.id,
      hash: row.hash,
      createdAt: row.created_at,
      name: row.name,
    }));
  }

  async getEntry(name: string): Promise<JournalEntry | null> {
    const result = await this.db.query(
      `SELECT id, hash, created_at, name FROM ${this.tableName} WHERE name = $1`,
      [name]
    );
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    return {
      id: row.id,
      hash: row.hash,
      createdAt: row.created_at,
      name: row.name,
    };
  }

  async insert(name: string, hash: string, client?: pg.PoolClient): Promise<void> {
    const createdAt = Date.now();
    if (client) {
      await this.db.queryOnClient(
        `INSERT INTO ${this.tableName} (hash, created_at, name) VALUES ($1, $2, $3)`,
        [hash, createdAt, name],
        client
      );
    } else {
      await this.db.query(
        `INSERT INTO ${this.tableName} (hash, created_at, name) VALUES ($1, $2, $3)`,
        [hash, createdAt, name]
      );
    }
    this.logger.info('Journal entry inserted', { name, hash });
  }

  calculateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  async verifyHash(name: string, content: string): Promise<boolean> {
    const entry = await this.getEntry(name);
    if (!entry) {
      return false;
    }
    const expectedHash = this.calculateHash(content);
    return entry.hash === expectedHash;
  }
}
