import { UniqueId } from './UniqueId.js';

/**
 * Base class for all domain entities.
 * Identity equality: two entities are equal iff their IDs are equal,
 * regardless of attribute values.
 *
 * Entity responsibilities:
 * - Hold immutable identity
 * - Provide identity-based equality
 * - Expose ID safely
 *
 * Domain events are managed by AggregateRoot, not Entity.
 */
export abstract class Entity<TId extends UniqueId = UniqueId> {
  readonly #id: TId;

  /**
   * Entity type identifier for equality comparison.
   * Subclasses must provide this to ensure type-safe equality
   * independent of minification or class name changes.
   */
  protected abstract readonly entityType: string;

  protected constructor(id: TId) {
    this.#id = id;
  }

  get id(): TId {
    return this.#id;
  }

  equals(other: Entity<TId>): boolean {
    if (other === this) return true;
    if (!(other instanceof Entity)) return false;
    // Different entity types are never equal, even if IDs match
    if (this.entityType !== other.entityType) return false;
    return this.#id.equals(other.#id);
  }
}
