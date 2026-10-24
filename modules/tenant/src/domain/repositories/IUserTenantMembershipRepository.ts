import type { UserTenantMembership } from '../UserTenantMembership.js';
import type { UserTenantMembershipId } from '../UserTenantMembershipId.js';
import type { UserId } from '@workspace/identity/domain';
import type { TenantId } from '../TenantId.js';

export interface IUserTenantMembershipRepository {
  findById(id: UserTenantMembershipId): Promise<UserTenantMembership | null>;
  findByUserAndTenant(userId: UserId, tenantId: TenantId): Promise<UserTenantMembership | null>;
  findByUserId(userId: UserId): Promise<UserTenantMembership[]>;
  findByTenantId(tenantId: TenantId): Promise<UserTenantMembership[]>;
  findActiveByUserId(userId: UserId): Promise<UserTenantMembership[]>;
  findActiveByTenantId(tenantId: TenantId): Promise<UserTenantMembership[]>;
  insert(membership: UserTenantMembership): Promise<void>;
  update(membership: UserTenantMembership): Promise<void>;
  delete(id: UserTenantMembershipId): Promise<void>;
}
