import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

export interface PostgresDatabase {
  db: ReturnType<typeof drizzle>;
  pool: InstanceType<typeof Pool>;
  close(): Promise<void>;
}

/**
 * Creates the application's PostgreSQL/Drizzle connection.
 * The host owns the lifecycle; platform owns the technical implementation.
 */
export function createPostgresDatabase(connectionString: string): PostgresDatabase {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  return {
    db,
    pool,
    close: () => pool.end(),
  };
}
