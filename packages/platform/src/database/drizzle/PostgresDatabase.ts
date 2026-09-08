import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { DrizzleConnection } from "./DrizzleConnection.js";

const { Pool } = pg;

export interface PostgresDatabase {
  db: ReturnType<typeof drizzle>;
  pool: InstanceType<typeof Pool>;
  connection: DrizzleConnection;
  close(): Promise<void>;
}

/**
 * Creates the application's PostgreSQL/Drizzle connection.
 * The host owns the lifecycle; platform owns the technical implementation.
 */
export function createPostgresDatabase(connectionString: string): PostgresDatabase {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);
  const connection = new DrizzleConnection(db as never);

  return {
    db,
    pool,
    connection,
    close: () => pool.end(),
  };
}
