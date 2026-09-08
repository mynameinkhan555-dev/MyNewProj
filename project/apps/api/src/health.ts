import { Router, type IRouter } from "express";
import { z } from "zod";
import { db } from "@workspace/db";

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

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  const checks = {
    database: await checkDatabase(),
  };

  const overallStatus = Object.values(checks).every((c) => c.status === "up")
    ? "ok"
    : Object.values(checks).some((c) => c.status === "up")
    ? "degraded"
    : "down";

  res.json(
    HealthCheckResponse.parse({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    }),
  );
});

async function checkDatabase(): Promise<{ status: "up" | "down"; latency?: number }> {
  const start = Date.now();
  try {
    await db.execute("SELECT 1");
    return { status: "up", latency: Date.now() - start };
  } catch {
    return { status: "down" };
  }
}

export default router;
