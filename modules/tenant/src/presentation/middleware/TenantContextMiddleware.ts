import { Request, Response, NextFunction } from 'express';

export class TenantContextMiddleware {
  async guard(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Extract tenant ID from header, subdomain, or query
    const tenantId =
      req.headers['x-tenant-id'] as string ||
      req.query.tenantId as string ||
      req.subdomains[0];

    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST_ERROR',
          message: 'Missing tenant context',
        },
      });
      return;
    }

    // TODO: Validate tenant ID and set PostgreSQL context
    // await this.tenantService.validateTenant(tenantId);
    // await this.db.execute('SET LOCAL app.current_tenant_id = $1', [tenantId]);

    req.tenantId = tenantId;
    next();
  }

  static requireTenantContext(req: Request, res: Response, next: NextFunction): void {
    // TODO: Implement proper tenant context validation
    // For now, just pass through
    next();
  }
}

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      user?: { userId: string };
    }
  }
}
