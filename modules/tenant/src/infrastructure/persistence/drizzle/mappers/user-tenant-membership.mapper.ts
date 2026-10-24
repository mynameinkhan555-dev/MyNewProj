import { UserTenantMembership } from '../../../../domain/UserTenantMembership.js';
import { UserTenantMembershipId } from '../../../../domain/UserTenantMembershipId.js';
import { UserId } from '@workspace/identity/domain';
import { TenantId } from '../../../../domain/TenantId.js';
import { MembershipRole } from '../../../../domain/MembershipRole.js';
import type { UserTenantMembershipSelect } from '../schema/user-tenant-memberships.table';

export class UserTenantMembershipMapper {
  static toDomain(row: UserTenantMembershipSelect): UserTenantMembership {
    return UserTenantMembership.reconstruct({
      id: row.id,
      userId: row.userId,
      tenantId: row.tenantId,
      role: row.role,
      isActive: row.isActive,
      joinedAt: row.joinedAt,
      leftAt: row.leftAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(membership: UserTenantMembership): UserTenantMembershipSelect {
    return {
      id: membership.id.value,
      userId: membership.userId.value,
      tenantId: membership.tenantId.value,
      role: membership.role,
      isActive: membership.isActive,
      joinedAt: membership.joinedAt,
      leftAt: membership.leftAt,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    };
  }
}
