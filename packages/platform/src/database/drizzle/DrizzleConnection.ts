import type { Connection } from "../Connection.js";

export interface DrizzleExecutor {
  execute(query: unknown): Promise<{ rows?: unknown[] } | unknown[]>;
}
/** Adapter around a Drizzle database instance. The instance is supplied by the host. */
export class DrizzleConnection implements Connection {
  constructor(private readonly db: DrizzleExecutor) {}
  async query<T>(text: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.db.execute({ text, params });
    return (Array.isArray(result) ? result : result.rows ?? []) as T[];
  }
  getPool(): unknown { return this.db; }
}
