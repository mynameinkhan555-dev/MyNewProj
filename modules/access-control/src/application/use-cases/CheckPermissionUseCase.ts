import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { UserId } from '@workspace/identity/domain';
import { TenantId } from '@workspace/tenant/domain';
import { Membership, MembershipStatus } from '@workspace/tenant/domain';
import { Tenant, TenantStatus } from '@workspace/tenant/domain';
import { User, UserStatus } from '@workspace/identity/domain';
import type { IMembershipRepository } from '@workspace/tenant/domain';
import type { ITenantRepository } from '@workspace/tenant/domain';
import type { IUserRepository } from '@workspace/identity/domain';
import type { IRoleAssignmentRepository } from '../../domain/index.js';
import type { IRolePermissionRepository } from '../../domain/index.js';
import type { IPermissionRepository } from '../../domain/index.js';
import type { ApplicationError } from '../errors/ApplicationError.js';
import {
  ValidationApplicationError,
  NotFoundApplicationError,
  InternalApplicationError,
} from '../errors/ApplicationError.js';

export interface CheckPermissionInput {
  userId: string;
  tenantId: string;
  action: string;
  resource: string;
}

export interface CheckPermissionOutput {
  allowed: boolean;
  reason?: string;
}

export class CheckPermissionUseCase {
  constructor(
    private readonly membershipRepository: IMembershipRepository,
    private readonly tenantRepository: ITenantRepository,
    private readonly userRepository: IUserRepository,
    private readonly roleAssignmentRepository: IRoleAssignmentRepository,
    private readonly rolePermissionRepository: IRolePermissionRepository,
    private readonly permissionRepository: IPermissionRepository
  ) {}

  async execute(
    input: CheckPermissionInput
  ): Promise<Result<CheckPermissionOutput, ApplicationError>> {
    // Validate input
    if (!input.userId || !input.tenantId || !input.action || !input.resource) {
      return err(new ValidationApplicationError('User ID, tenant ID, action, and resource are required'));
    }

    // Find user
    const user = await this.userRepository.findById(new UserId(input.userId));
    if (!user) {
      return err(new NotFoundApplicationError('User not found'));
    }

    if (user.status !== UserStatus.ACTIVE) {
      return ok({ allowed: false, reason: 'User is not active' });
    }

    // Find tenant
    const tenant = await this.tenantRepository.findById(new TenantId(input.tenantId));
    if (!tenant) {
      return err(new NotFoundApplicationError('Tenant not found'));
    }

    if (tenant.status !== TenantStatus.ACTIVE) {
      return ok({ allowed: false, reason: 'Tenant is not active' });
    }

    // Find user memberships in tenant
    const memberships = await this.membershipRepository.findByUserIdAndTenantId(
      new UserId(input.userId),
      new TenantId(input.tenantId)
    );

    // Filter active memberships
    const activeMemberships = memberships.filter((m: Membership) => m.status === MembershipStatus.ACTIVE);

    if (activeMemberships.length === 0) {
      return ok({ allowed: false, reason: 'No active membership in tenant' });
    }

    // Find role assignments for memberships
    const membershipIds = activeMemberships.map((m: any) => m.id.value);
    const roleAssignments = await this.roleAssignmentRepository.findByMembershipIds(membershipIds);

    if (roleAssignments.length === 0) {
      return ok({ allowed: false, reason: 'No roles assigned' });
    }

    // Find role permissions
    const roleIds = roleAssignments.map((ra: any) => ra._roleId);
    const permissionIds = await this.rolePermissionRepository.findByRoleIds(roleIds);

    if (permissionIds.length === 0) {
      return ok({ allowed: false, reason: 'No permissions granted to roles' });
    }

    // Find permissions
    const permissions = await this.permissionRepository.findByIds(permissionIds);

    // Check if any permission matches the action and resource
    const hasPermission = permissions.some((p: any) => {
      // Simplified matching - in production, this would use more sophisticated pattern matching
      return p._key.value === input.action && p._scope === input.resource;
    });

    // TODO: Apply UBAC overrides
    // TODO: Apply ABAC policies

    return ok({
      allowed: hasPermission,
      reason: hasPermission ? 'Permission granted' : 'Permission not found',
    });
  }
}
