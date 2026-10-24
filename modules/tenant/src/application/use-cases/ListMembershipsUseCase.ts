import type { Result } from '@workspace/kernel';
import { ok } from '@workspace/kernel';
import { UserId } from '@workspace/identity/domain';
import { TenantId } from '../../domain/TenantId.js';
import type { IUserTenantMembershipRepository } from '../../domain/repositories/IUserTenantMembershipRepository.js';

export interface MembershipInfo {
  membershipId: string;
  tenantId: string;
  tenantName?: string;
  role: string;
  isActive: boolean;
  joinedAt: Date;
}

export interface ListMembershipsOutput {
  userId: string;
  memberships: MembershipInfo[];
}

export class ListMembershipsUseCase {
  constructor(
    private readonly membershipRepository: IUserTenantMembershipRepository
  ) {}

  async execute(userId: string): Promise<Result<ListMembershipsOutput, Error>> {
    const user = new UserId(userId);
    const memberships = await this.membershipRepository.findActiveByUserId(user);

    const membershipInfos: MembershipInfo[] = memberships.map((m) => ({
      membershipId: m.id.value,
      tenantId: m.tenantId.value,
      role: m.role,
      isActive: m.isActive,
      joinedAt: m.joinedAt,
    }));

    return ok({
      userId,
      memberships: membershipInfos,
    });
  }
}
