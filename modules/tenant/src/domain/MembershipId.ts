import { UniqueId } from '@workspace/kernel';

/**
 * Typed ID for Membership aggregate.
 */
export class MembershipId extends UniqueId {
  constructor(value: string) {
    super(value);
  }
}
