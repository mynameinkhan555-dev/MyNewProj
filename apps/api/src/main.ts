import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: join(__dirname, '../../../.env') });

import { initializeSentry } from './observability/sentry.js';

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  initializeSentry();
}

import { bootstrap } from './bootstrap.js';

const jwtSecret = process.env.JWT_SECRET || '';
const jwtSecretFingerprint = jwtSecret ? createHash('sha256').update(jwtSecret).digest('hex') : 'none';

console.log('[FORENSIC] Environment loaded:', {
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL ? 'present' : 'missing',
  JWT_SECRET: process.env.JWT_SECRET ? 'present' : 'missing',
  JWT_SECRET_FINGERPRINT: jwtSecretFingerprint,
  NODE_ENV: process.env.NODE_ENV,
  envPath: join(__dirname, '../../../.env')
});

const { app, config, container } = await bootstrap();

console.log('[FORENSIC] Container created', {
  identityContainerExists: !!container.identityContainer,
  tenantContainerExists: !!container.tenantContainer,
  authorizationContainerExists: !!container.authorizationContainer,
  // TODO: Restore when IAM is fixed
  // iamContainerExists: !!container.iamContainer,
  // tokenServiceExists: !!container.iamContainer?.tokenService,
  // authServiceExists: !!container.iamContainer?.authService
});

const server = app.listen(config.port, '0.0.0.0', (err?: Error) => {
  if (err) {
    container.logger.error('Error listening on port', { err });
    process.exit(1);
  }

  container.logger.info('API server listening', { port: config.port });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  container.logger.info(`${signal} received, starting graceful shutdown`);

  server.close(async (err) => {
    if (err) {
      container.logger.error('Error closing server', { err });
      process.exit(1);
    }

    container.logger.info('Server closed successfully');

    // Close database connections if needed
    // Close other resources if needed

    container.logger.info('Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    container.logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
