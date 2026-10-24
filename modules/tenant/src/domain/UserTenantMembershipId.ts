import { UniqueId } from '@workspace/kernel';

/**
 * Typed ID for UserTenantMembership aggregate.
 */
export class UserTenantMembershipId extends UniqueId {
  constructor(value: string) {
    super(value);
  }

  static generate(): UserTenantMembershipId {
    return new UserTenantMembershipId(crypto.randomUUID());
  }
}
