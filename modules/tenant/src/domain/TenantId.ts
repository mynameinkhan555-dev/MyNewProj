import { UniqueId } from '@workspace/kernel';

/**
 * Typed ID for Tenant aggregate.
 */
export class TenantId extends UniqueId {
  constructor(value: string) {
    super(value);
  }
}
