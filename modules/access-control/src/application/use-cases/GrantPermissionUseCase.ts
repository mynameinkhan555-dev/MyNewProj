import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { RolePermission } from '../../domain/index.js';
import { TenantRole, TenantRoleStatus } from '../../domain/index.js';
import { TenantRoleId } from '../../domain/role/TenantRoleId.js';
import { Permission, PermissionStatus } from '../../domain/index.js';
import { PermissionId } from '../../domain/permission/PermissionId.js';
import type { ITenantRoleRepository } from '../../domain/index.js';
import type { IPermissionRepository } from '../../domain/index.js';
import type { IRolePermissionRepository } from '../../domain/index.js';
import type { IEventBus } from '../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import type { ApplicationError } from '../errors/ApplicationError.js';
import {
  ValidationApplicationError,
  NotFoundApplicationError,
  InternalApplicationError,
} from '../errors/ApplicationError.js';

export interface GrantPermissionInput {
  roleId: string;
  permissionId: string;
  grantedBy: string;
}

export interface GrantPermissionOutput {
  success: boolean;
}

export class GrantPermissionUseCase {
  constructor(
    private readonly tenantRoleRepository: ITenantRoleRepository,
    private readonly permissionRepository: IPermissionRepository,
    private readonly rolePermissionRepository: IRolePermissionRepository,
    private readonly eventBus: IEventBus,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(
    input: GrantPermissionInput
  ): Promise<Result<GrantPermissionOutput, ApplicationError>> {
    // Validate input
    if (!input.roleId || !input.permissionId || !input.grantedBy) {
      return err(new ValidationApplicationError('Role ID, permission ID, and granted by are required'));
    }

    // Find role
    const role = await this.tenantRoleRepository.findById(new TenantRoleId(input.roleId));
    if (!role) {
      return err(new NotFoundApplicationError('Role not found'));
    }

    if (role.status !== TenantRoleStatus.ACTIVE) {
      return err(new ValidationApplicationError('Role is not active'));
    }

    // Find permission
    const permission = await this.permissionRepository.findById(new PermissionId(input.permissionId));
    if (!permission) {
      return err(new NotFoundApplicationError('Permission not found'));
    }

    if (permission.status !== PermissionStatus.ACTIVE) {
      return err(new ValidationApplicationError('Permission is not active'));
    }

    // Check scope compatibility (simplified)
    // In production, this would validate that the permission scope is compatible with the role's tenant scope

    // Check if already granted
    const exists = await this.rolePermissionRepository.exists(
      new TenantRoleId(input.roleId),
      new PermissionId(input.permissionId)
    );
    if (exists) {
      return err(new ValidationApplicationError('Permission already granted to role'));
    }

    // Grant permission
    await this.unitOfWork.execute(async () => {
      await this.rolePermissionRepository.grant(
        new TenantRoleId(input.roleId),
        new PermissionId(input.permissionId)
      );
    });

    // TODO: Publish RolePermissionGranted event

    return ok({ success: true });
  }
}
