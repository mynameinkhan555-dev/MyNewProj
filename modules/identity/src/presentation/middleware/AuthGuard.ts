import { Request, Response, NextFunction } from 'express';
import type { IUnitOfWork } from '@workspace/platform/ports';
import type { ITokenService } from '@workspace/identity/domain';
import { UnauthorizedApplicationError } from '@workspace/identity/application';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; tenantId?: string };
    }
  }
}

export class AuthGuard {
  constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly tokenService: ITokenService
  ) {}

  async guard(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ERROR',
          message: 'Missing or invalid authorization header',
        },
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const payload = await this.tokenService.verifyAccessToken(token);
      req.user = { userId: payload.userId, tenantId: payload.tenantId };
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ERROR',
          message: 'Invalid or expired token',
        },
      });
    }
  }

  static authenticate(req: Request, res: Response, next: NextFunction): void {
    // TODO: Implement proper authentication with token service
    // For now, just pass through
    next();
  }
}
