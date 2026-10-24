import * as Sentry from '@sentry/node';

export function initializeSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.log('Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.headers;
        delete event.request.cookies;
      }
      return event;
    },
  });

  console.log(`Sentry initialized (environment: ${process.env.SENTRY_ENVIRONMENT || 'development'})`);
}

export function captureException(error: Error, context?: any): void {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, context);
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, { level });
  }
}
