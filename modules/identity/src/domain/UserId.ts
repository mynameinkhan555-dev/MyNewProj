import { UniqueId } from '@workspace/kernel';

/**
 * Strongly typed User identifier.
 * Provides compile-time type safety to prevent accidental mixing with other IDs.
 */
export class UserId extends UniqueId {
  constructor(value?: string) {
    super(value);
  }
}
