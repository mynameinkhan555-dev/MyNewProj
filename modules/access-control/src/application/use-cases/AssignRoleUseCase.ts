import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { RoleAssignment } from '../../domain/index.js';
import { RoleAssignmentId } from '../../domain/assignment/RoleAssignmentId.js';
import { RoleAssignmentStatus } from '../../domain/assignment/RoleAssignmentStatus.js';
import { Membership, MembershipStatus } from '@workspace/tenant/domain';
import { MembershipId } from '@workspace/tenant/domain';
import { TenantRole, TenantRoleStatus } from '../../domain/index.js';
import { TenantRoleId } from '../../domain/role/TenantRoleId.js';
import type { IMembershipRepository } from '@workspace/tenant/domain';
import type { ITenantRoleRepository } from '../../domain/index.js';
import type { IRoleAssignmentRepository } from '../../domain/index.js';
import type { IEventBus } from '../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import type { ApplicationError } from '../errors/ApplicationError.js';
import {
  ValidationApplicationError,
  NotFoundApplicationError,
  InternalApplicationError,
} from '../errors/ApplicationError.js';

export interface AssignRoleInput {
  membershipId: string;
  roleId: string;
  grantedBy: string;
}

export interface AssignRoleOutput {
  roleAssignmentId: string;
}

export class AssignRoleUseCase {
  constructor(
    private readonly membershipRepository: IMembershipRepository,
    private readonly tenantRoleRepository: ITenantRoleRepository,
    private readonly roleAssignmentRepository: IRoleAssignmentRepository,
    private readonly eventBus: IEventBus,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(
    input: AssignRoleInput
  ): Promise<Result<AssignRoleOutput, ApplicationError>> {
    // Validate input
    if (!input.membershipId || !input.roleId || !input.grantedBy) {
      return err(new ValidationApplicationError('Membership ID, role ID, and granted by are required'));
    }

    // Find membership
    const membership = await this.membershipRepository.findById(new MembershipId(input.membershipId));
    if (!membership) {
      return err(new NotFoundApplicationError('Membership not found'));
    }

    if (membership.status !== MembershipStatus.ACTIVE) {
      return err(new ValidationApplicationError('Membership is not active'));
    }

    // Find role
    const role = await this.tenantRoleRepository.findById(new TenantRoleId(input.roleId));
    if (!role) {
      return err(new NotFoundApplicationError('Role not found'));
    }

    if (role.status !== TenantRoleStatus.ACTIVE) {
      return err(new ValidationApplicationError('Role is not active'));
    }

    // Check tenant isolation
    if (membership.tenantId.value !== role.tenantId.value) {
      return err(new ValidationApplicationError('Membership and role belong to different tenants'));
    }

    // Create role assignment
    const now = new Date();
    const roleAssignment = RoleAssignment.reconstruct({
      id: crypto.randomUUID(),
      membershipId: membership.id.value,
      roleId: role.id.value,
      status: RoleAssignmentStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    // Save in transaction
    await this.unitOfWork.execute(async () => {
      await this.roleAssignmentRepository.insert(roleAssignment);
    });

    // TODO: Publish RoleAssignmentCreated event

    return ok({
      roleAssignmentId: roleAssignment.id.value,
    });
  }
}
