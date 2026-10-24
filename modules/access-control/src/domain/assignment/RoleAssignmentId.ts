import { UniqueId } from '@workspace/kernel';

/**
 * Typed ID for RoleAssignment aggregate.
 */
export class RoleAssignmentId extends UniqueId {
  constructor(value: string) {
    super(value);
  }
}
