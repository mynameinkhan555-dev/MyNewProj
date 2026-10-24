import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export class ValidationMiddleware {
  static validate(schema: z.ZodSchema, target: 'body' | 'query' | 'params' = 'body') {
    return (req: Request, res: Response, next: NextFunction): void => {
      const data = req[target];

      try {
        const validated = schema.parse(data);
        req.validated = req.validated || {};
        req.validated[target] = validated;
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request validation failed',
              details: error.errors,
            },
          });
        } else {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
            },
          });
        }
      }
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}
