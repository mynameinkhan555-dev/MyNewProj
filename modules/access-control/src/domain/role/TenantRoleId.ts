import { UniqueId } from '@workspace/kernel';

/**
 * Typed ID for TenantRole aggregate.
 */
export class TenantRoleId extends UniqueId {
  constructor(value: string) {
    super(value);
  }
}
