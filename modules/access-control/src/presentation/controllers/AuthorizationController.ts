import { Request, Response } from 'express';
import { AssignRoleUseCase } from '../../application/use-cases/AssignRoleUseCase.js';
import { GrantPermissionUseCase } from '../../application/use-cases/GrantPermissionUseCase.js';
import { RevokePermissionUseCase } from '../../application/use-cases/RevokePermissionUseCase.js';
import { CheckPermissionUseCase } from '../../application/use-cases/CheckPermissionUseCase.js';
import type { ApplicationError } from '../../application/errors/ApplicationError.js';

export class AuthorizationController {
  constructor(
    private readonly assignRoleUseCase: AssignRoleUseCase,
    private readonly grantPermissionUseCase: GrantPermissionUseCase,
    private readonly revokePermissionUseCase: RevokePermissionUseCase,
    private readonly checkPermissionUseCase: CheckPermissionUseCase
  ) {}

  async assignRole(req: Request, res: Response): Promise<void> {
    const { membershipId, roleId, grantedBy } = req.body;

    const result = await this.assignRoleUseCase.execute({
      membershipId,
      roleId,
      grantedBy,
    });

    if (result.isErr()) {
      this.handleError(result.error, res);
      return;
    }

    res.status(201).json({
      success: true,
      data: result.value,
    });
  }

  async grantPermission(req: Request, res: Response): Promise<void> {
    const { roleId, permissionId, grantedBy } = req.body;

    const result = await this.grantPermissionUseCase.execute({
      roleId,
      permissionId,
      grantedBy,
    });

    if (result.isErr()) {
      this.handleError(result.error, res);
      return;
    }

    res.status(201).json({
      success: true,
      data: result.value,
    });
  }

  async revokePermission(req: Request, res: Response): Promise<void> {
    const { roleId, permissionId, revokedBy } = req.body;

    const result = await this.revokePermissionUseCase.execute({
      roleId,
      permissionId,
      revokedBy,
    });

    if (result.isErr()) {
      this.handleError(result.error, res);
      return;
    }

    res.status(200).json({
      success: true,
      data: result.value,
    });
  }

  async checkPermission(req: Request, res: Response): Promise<void> {
    const { userId, tenantId, action, resource } = req.body;

    const result = await this.checkPermissionUseCase.execute({
      userId,
      tenantId,
      action,
      resource,
    });

    if (result.isErr()) {
      this.handleError(result.error, res);
      return;
    }

    res.status(200).json({
      success: true,
      data: result.value,
    });
  }

  private handleError(error: ApplicationError, res: Response): void {
    const statusCode = this.getStatusCode(error);
    res.status(statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  private getStatusCode(error: ApplicationError): number {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return 400;
      case 'NOT_FOUND_ERROR':
        return 404;
      case 'UNAUTHORIZED_ERROR':
        return 401;
      case 'FORBIDDEN_ERROR':
        return 403;
      case 'CONFLICT_ERROR':
        return 409;
      default:
        return 500;
    }
  }
}
