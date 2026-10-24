/**
 * Platform Database
 * Production database abstraction for PostgreSQL
 */

import pg from 'pg';

export interface DatabaseConfig {
  url: string;
}

export interface LockHandle {
  client: pg.PoolClient;
  release: () => Promise<void>;
}

export class PostgresDatabase {
  private _pool: pg.Pool;

  constructor(config: DatabaseConfig) {
    this._pool = new pg.Pool({
      connectionString: config.url,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  get pool(): pg.Pool {
    return this._pool;
  }

  async query(sql: string, params?: any[]): Promise<pg.QueryResult> {
    return await this._pool.query(sql, params);
  }

  async queryOnClient(sql: string, params: any[], client: pg.PoolClient): Promise<pg.QueryResult> {
    return await client.query(sql, params);
  }

  async transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Acquire a session-scoped advisory lock on a dedicated client.
   * The lock remains held until the returned handle is released.
   * This provides long-lived lock ownership for migration execution.
   */
  async acquireSessionAdvisoryLock(key: number): Promise<LockHandle | null> {
    const client = await this._pool.connect();
    try {
      const result = await client.query('SELECT pg_try_advisory_lock($1) as acquired', [key]);
      if (!result.rows[0].acquired) {
        client.release();
        return null;
      }

      // Lock acquired - return handle for manual release
      return {
        client,
        release: async () => {
          await client.query('SELECT pg_advisory_unlock($1)', [key]);
          client.release();
        },
      };
    } catch (error) {
      client.release();
      throw error;
    }
  }

  async close(): Promise<void> {
    await this._pool.end();
  }

  async checkHealth(): Promise<{ healthy: boolean; latency: number }> {
    const start = Date.now();
    try {
      await this._pool.query('SELECT 1');
      return { healthy: true, latency: Date.now() - start };
    } catch {
      return { healthy: false, latency: Date.now() - start };
    }
  }
}

export function createPostgresDatabase(url: string): PostgresDatabase {
  return new PostgresDatabase({ url });
}

export function checkPostgresDatabaseHealth(db: PostgresDatabase): Promise<{ healthy: boolean; latency: number }> {
  return db.checkHealth();
}

export default createPostgresDatabase;
