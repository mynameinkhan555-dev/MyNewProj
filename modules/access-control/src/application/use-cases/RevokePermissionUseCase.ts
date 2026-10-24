import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { TenantRoleId } from '../../domain/role/TenantRoleId.js';
import { PermissionId } from '../../domain/permission/PermissionId.js';
import type { IRolePermissionRepository } from '../../domain/index.js';
import type { IEventBus } from '../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import type { ApplicationError } from '../errors/ApplicationError.js';
import {
  ValidationApplicationError,
  NotFoundApplicationError,
  InternalApplicationError,
} from '../errors/ApplicationError.js';

export interface RevokePermissionInput {
  roleId: string;
  permissionId: string;
  revokedBy: string;
}

export interface RevokePermissionOutput {
  success: boolean;
}

export class RevokePermissionUseCase {
  constructor(
    private readonly rolePermissionRepository: IRolePermissionRepository,
    private readonly eventBus: IEventBus,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(
    input: RevokePermissionInput
  ): Promise<Result<RevokePermissionOutput, ApplicationError>> {
    // Validate input
    if (!input.roleId || !input.permissionId || !input.revokedBy) {
      return err(new ValidationApplicationError('Role ID, permission ID, and revoked by are required'));
    }

    // Check if permission is granted
    const exists = await this.rolePermissionRepository.exists(
      new TenantRoleId(input.roleId),
      new PermissionId(input.permissionId)
    );
    if (!exists) {
      return err(new NotFoundApplicationError('Role-permission association not found'));
    }

    // Revoke permission
    await this.unitOfWork.execute(async () => {
      await this.rolePermissionRepository.revoke(
        new TenantRoleId(input.roleId),
        new PermissionId(input.permissionId)
      );
    });

    // TODO: Publish RolePermissionRevoked event

    return ok({ success: true });
  }
}
