import { Request, Response, NextFunction } from 'express';
import { captureException } from '../observability/sentry.js';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  // Capture error in Sentry
  captureException(err, {
    request: {
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
      },
    },
  });

  // Log error
  console.error('[ERROR]', err);

  // Send error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    },
  });
}
