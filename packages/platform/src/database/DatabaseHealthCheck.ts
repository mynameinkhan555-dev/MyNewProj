import type { Connection } from "./Connection.js";

export interface DatabaseHealthResult {
  healthy: boolean;
  latency: number;
  error?: string;
}

export async function checkDatabaseHealth(
  connection: Connection,
): Promise<DatabaseHealthResult> {
  const start = Date.now();
  try {
    await connection.query("SELECT 1");
    return { healthy: true, latency: Date.now() - start };
  } catch (err: unknown) {
    return {
      healthy: false,
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
