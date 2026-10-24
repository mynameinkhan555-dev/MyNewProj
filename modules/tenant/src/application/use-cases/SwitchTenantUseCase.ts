import type { Result } from '@workspace/kernel';
import { ok, err } from '@workspace/kernel';
import { UserId } from '@workspace/identity/domain';
import { TenantId } from '../../domain/TenantId.js';
import { MembershipRole } from '../../domain/MembershipRole.js';
import type { IUserTenantMembershipRepository } from '../../domain/repositories/IUserTenantMembershipRepository.js';
import type { ApplicationError } from '@workspace/tenant/application';
import {
  NotFoundApplicationError,
  ForbiddenApplicationError,
} from '@workspace/tenant/application';

export interface SwitchTenantInput {
  userId: string;
  tenantId: string;
}

export interface SwitchTenantOutput {
  userId: string;
  tenantId: string;
  role: MembershipRole;
  isActive: boolean;
}

export class SwitchTenantUseCase {
  constructor(
    private readonly membershipRepository: IUserTenantMembershipRepository
  ) {}

  async execute(
    input: SwitchTenantInput
  ): Promise<Result<SwitchTenantOutput, ApplicationError>> {
    if (!input.userId || !input.tenantId) {
      return err(new NotFoundApplicationError('userId and tenantId are required'));
    }

    const userId = new UserId(input.userId);
    const tenantId = new TenantId(input.tenantId);

    const membership = await this.membershipRepository.findByUserAndTenant(userId, tenantId);

    if (!membership) {
      return err(new NotFoundApplicationError('Membership not found'));
    }

    if (!membership.isActive) {
      return err(new ForbiddenApplicationError('Membership is not active'));
    }

    return ok({
      userId: input.userId,
      tenantId: input.tenantId,
      role: membership.role,
      isActive: membership.isActive,
    });
  }
}
