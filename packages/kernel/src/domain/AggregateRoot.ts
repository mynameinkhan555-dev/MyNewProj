import type { DomainEvent } from './DomainEvent.js';
import { Entity } from './Entity.js';
import { UniqueId } from './UniqueId.js';

/**
 * Aggregate root — the consistency boundary of a DDD aggregate.
 * Only aggregate roots are directly loaded from and persisted to repositories.
 *
 * AggregateRoot responsibilities:
 * - Represent aggregate boundary
 * - Collect domain events
 * - Expose pending/uncommitted events
 * - Preserve aggregate identity
 * - Version tracking for optimistic concurrency
 *
 * Domain event lifecycle:
 * - Aggregate records domain events via addDomainEvent() or apply()
 * - Aggregate exposes pending events via domainEvents
 * - Application/UnitOfWork drains events via pullDomainEvents()
 * - Aggregate does NOT know about: Outbox, Database, Dispatcher, Event Bus
 *
 * Future architecture:
 * Aggregate → Pending Events → Application/UnitOfWork → Outbox → Database Transaction → Commit → Dispatcher → Event Bus
 */
export abstract class AggregateRoot<TId extends UniqueId = UniqueId> extends Entity<TId> {
  /** Accumulated domain events not yet dispatched. */
  readonly #domainEvents: DomainEvent[] = [];

  /**
   * Aggregate version for change tracking.
   * Incremented on each domain event application.
   *
   * Note: This version represents the number of state changes/events in the aggregate,
   * NOT necessarily the persistence/optimistic-locking version used by repositories.
   * Repositories may implement their own optimistic concurrency mechanism independent of this field.
   */
  #version: number;

  protected constructor(id: TId, version = 0) {
    super(id);
    this.#version = version;
  }

  get version(): number {
    return this.#version;
  }

  /** Accumulated domain events not yet dispatched. */
  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this.#domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this.#domainEvents.push(event);
  }

  /** Drains and returns all accumulated events. Call after persisting. */
  pullDomainEvents(): DomainEvent[] {
    return this.#domainEvents.splice(0);
  }

  /**
   * Apply a domain event to this aggregate.
   * Increments internal aggregate version and records the event.
   *
   * This is for aggregate-level change tracking only.
   * Repository-level optimistic concurrency is a separate concern.
   */
  protected apply(event: DomainEvent): void {
    this.addDomainEvent(event);
    this.#version += 1;
  }
}
