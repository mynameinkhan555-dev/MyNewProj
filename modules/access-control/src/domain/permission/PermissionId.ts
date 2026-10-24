import { UniqueId } from '@workspace/kernel';

/**
 * Typed ID for Permission aggregate.
 */
export class PermissionId extends UniqueId {
  constructor(value: string) {
    super(value);
  }
}
