import { Request, Response, NextFunction } from 'express';

export class AuthorizationMiddleware {
  constructor(
    private readonly checkPermission: (
      userId: string,
      tenantId: string,
      permission: string,
    ) => Promise<boolean>,
  ) {}

  async guard(requiredPermission: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const userId = req.user?.userId;
      const tenantId = req.tenantId;

      if (!userId || !tenantId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN_ERROR',
            message: 'Authentication or tenant context required',
          },
        });
        return;
      }

      try {
        const hasPermission = await this.checkPermission(userId, tenantId, requiredPermission);

        if (!hasPermission) {
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN_ERROR',
              message: 'Insufficient permissions',
            },
          });
          return;
        }

        next();
      } catch (error) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN_ERROR',
            message: 'Authorization check failed',
          },
        });
      }
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
      tenantId?: string;
    }
  }
}
