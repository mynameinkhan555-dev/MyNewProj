import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as platformSchema from './schema/index.js';

/**
 * Drizzle Database Client Factory
 * 
 * PostgreSQL client for Drizzle ORM.
 * 
 * Connection string from environment variable DATABASE_URL.
 * Schema composition happens in Composition Root.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);

/**
 * Create Drizzle database client with schema.
 * 
 * Called by Composition Root to assemble complete application schema.
 * 
 * @param schema - Complete Drizzle schema (platform + module schemas)
 * @param logger - Enable SQL query logging (default: false)
 * @returns Drizzle database client
 */
export function createDatabaseClient(schema: any, logger: boolean = false) {
  return drizzle(client, { schema, logger });
}

/**
 * Default database client with platform schema only.
 * 
 * DEPRECATED: Use createDatabaseClient with complete schema in Composition Root.
 * Kept for backward compatibility during migration.
 */
export const db = drizzle(client, { 
  schema: platformSchema,
  logger: false,
});

/**
 * Close database connection.
 * 
 * Call this when shutting down the application.
 */
export async function closeDrizzleClient(): Promise<void> {
  await client.end();
}
