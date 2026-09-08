import { Router, type IRouter } from "express";
import {
  checkDatabaseHealth,
  DrizzleConnection,
  type PostgresDatabase,
} from "@workspace/platform";
import { z } from "zod";

const HealthCheckResponse = z.object({
  status: z.enum(["ok", "degraded", "down"]),
  timestamp: z.string(),
  checks: z.object({
    database: z.object({
      status: z.enum(["up", "down"]),
      latency: z.number().optional(),
    }),
  }),
});

export function createHealthRouter(database: PostgresDatabase): IRouter {
  const router: IRouter = Router();
  const connection = new DrizzleConnection(database.db);

  router.get("/healthz", async (_req, res) => {
    const databaseHealth = await checkDatabaseHealth(connection);
    const databaseCheck = databaseHealth.healthy
      ? { status: "up" as const, latency: databaseHealth.latency }
      : { status: "down" as const };

    const status = databaseCheck.status === "up" ? "ok" : "down";

    res.status(status === "ok" ? 200 : 503).json(
      HealthCheckResponse.parse({
        status,
        timestamp: new Date().toISOString(),
        checks: { database: databaseCheck },
      }),
    );
  });

  return router;
}
