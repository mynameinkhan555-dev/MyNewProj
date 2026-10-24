import express, { type Express } from 'express';
import { applyMiddleware } from './middleware.js';
import { createErrorHandler } from './errors.js';
import { createRoutes } from './routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getMetrics, register } from './observability/metrics.js';
import healthRoutes from './routes/health-routes.js';
import type { AppContainer } from './container.js';

export function createServer(container: AppContainer): Express {
  const app: Express = express();

  applyMiddleware(app);

  // Health check endpoints (no authentication required)
  app.use(healthRoutes);

  // Metrics endpoint for Prometheus
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await getMetrics());
  });

  app.use('/api', createRoutes(container));
  app.use(createErrorHandler(container.logger));
  app.use(errorHandler);

  return app;
}
