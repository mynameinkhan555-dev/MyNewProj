import type { Result } from '@workspace/kernel';
import { ok, err } from '@workspace/kernel';
import { UserTenantMembership } from '../../domain/UserTenantMembership.js';
import { UserTenantMembershipId } from '../../domain/UserTenantMembershipId.js';
import { UserId } from '@workspace/identity/domain';
import { TenantId } from '../../domain/TenantId.js';
import { MembershipRole } from '../../domain/MembershipRole.js';
import type { IUserTenantMembershipRepository } from '../../domain/repositories/IUserTenantMembershipRepository.js';
import type { IEventBus } from '../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import type { ApplicationError } from '../../application/errors/ApplicationError.js';
import {
  ValidationApplicationError,
  ConflictApplicationError,
  InternalApplicationError,
} from '../../application/errors/ApplicationError.js';

export interface AddMembershipInput {
  userId: string;
  tenantId: string;
  role?: MembershipRole | string;
}

export interface AddMembershipOutput {
  membershipId: string;
  userId: string;
  tenantId: string;
  role: MembershipRole;
}

export class AddMembershipUseCase {
  constructor(
    private readonly membershipRepository: IUserTenantMembershipRepository,
    private readonly eventBus: IEventBus,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(
    input: AddMembershipInput
  ): Promise<Result<AddMembershipOutput, ApplicationError>> {
    if (!input.userId || !input.tenantId) {
      return err(new ValidationApplicationError('userId and tenantId are required'));
    }

    const userId = new UserId(input.userId);
    const tenantId = new TenantId(input.tenantId);
    const role = input.role ? MembershipRole.parse(input.role as string) : MembershipRole.MEMBER;

    await this.unitOfWork.execute(async () => {
      const existing = await this.membershipRepository.findByUserAndTenant(userId, tenantId);
      if (existing) {
        throw new ConflictApplicationError('Membership already exists');
      }

      const membershipResult = UserTenantMembership.create(userId, tenantId, role);
      if (membershipResult.isErr()) {
        throw new InternalApplicationError('Failed to create membership');
      }

      const membership = membershipResult.value;
      await this.membershipRepository.insert(membership);

      // TODO: Publish MembershipCreatedEvent
    });

    return ok({
      membershipId: '', // Will be set after event
      userId: input.userId,
      tenantId: input.tenantId,
      role,
    });
  }
}
