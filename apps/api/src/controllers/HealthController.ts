import { Request, Response } from 'express';

export class HealthController {
  async check(req: Request, res: Response): Promise<void> {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '0.0.0',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    };

    res.status(200).json(health);
  }

  async ready(req: Request, res: Response): Promise<void> {
    // Add database connection check if needed
    const ready = {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(ready);
  }
}
