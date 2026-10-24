import {
  AggregateRoot,
  DomainError,
  Result,
  ok,
  err,
  type Clock,
  type IdGenerator,
  type EventIdGenerator,
} from '@workspace/kernel';
import { TenantId } from './TenantId.js';
import { TenantStatus } from './TenantStatus.js';
import type {
  TenantCreatedEvent,
  TenantActivatedEvent,
  TenantSuspendedEvent,
  TenantDeletedEvent,
} from './events/TenantEvents.js';

export class Tenant extends AggregateRoot<TenantId> {
  protected readonly entityType = 'Tenant';

  private _name: string;
  private _status: TenantStatus;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: TenantId,
    name: string,
    status: TenantStatus,
    createdAt: Date,
    updatedAt: Date,
    version: number = 0,
  ) {
    super(id, version);
    this._name = name;
    this._status = status;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ─── Properties ───────────────────────────────────────────────────────────
  get name(): string {
    return this._name;
  }

  get status(): TenantStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ─── Factory ─────────────────────────────────────────────────────────────
  /**
   * Create a new Tenant.
   *
   * @param name - Tenant name
   * @param clock - Clock for timestamps
   * @param idGenerator - ID generator for aggregate IDs
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<Tenant, DomainError>
   */
  static create(
    name: string,
    clock: Clock,
    idGenerator: IdGenerator,
    eventIdGenerator: EventIdGenerator,
  ): Result<Tenant, DomainError> {
    if (!name || name.trim().length === 0) {
      return err(new DomainError('TENANT_NAME_REQUIRED', 'Tenant name is required'));
    }

    const now = clock.now();
    const id = new TenantId(idGenerator.generate());

    const tenant = new Tenant(
      id,
      name.trim(),
      TenantStatus.ACTIVE,
      now,
      now,
      0,
    );

    const event: TenantCreatedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'tenant.TenantCreated',
      occurredAt: now,
      aggregateId: id.value,
      aggregateType: 'Tenant',
      tenantName: name.trim(),
    };

    tenant.apply(event);

    return ok(tenant);
  }

  /**
   * Reconstruct a Tenant from persisted state.
   *
   * @param props - Persisted properties
   * @returns Tenant
   */
  static reconstruct(props: {
    id: string;
    name: string;
    status: TenantStatus;
    createdAt: Date;
    updatedAt: Date;
    version?: number;
  }): Tenant {
    return new Tenant(
      new TenantId(props.id),
      props.name,
      props.status,
      props.createdAt,
      props.updatedAt,
      props.version ?? 0,
    );
  }

  // ─── Lifecycle Methods ────────────────────────────────────────────────────
  /**
   * Activate a suspended tenant.
   *
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  activate(clock: Clock, eventIdGenerator: EventIdGenerator): Result<void, DomainError> {
    if (this._status === TenantStatus.ACTIVE) {
      return err(new DomainError('TENANT_ALREADY_ACTIVE', 'Tenant is already active'));
    }

    if (this._status === TenantStatus.DELETED) {
      return err(new DomainError('TENANT_DELETED', 'Cannot activate deleted tenant'));
    }

    this._status = TenantStatus.ACTIVE;
    this._updatedAt = clock.now();

    const event: TenantActivatedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'tenant.TenantActivated',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'Tenant',
    };

    this.apply(event);

    return ok(undefined);
  }

  /**
   * Suspend an active tenant.
   *
   * @param reason - Reason for suspension
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  suspend(
    reason: string,
    clock: Clock,
    eventIdGenerator: EventIdGenerator,
  ): Result<void, DomainError> {
    if (this._status === TenantStatus.SUSPENDED) {
      return err(new DomainError('TENANT_ALREADY_SUSPENDED', 'Tenant is already suspended'));
    }

    if (this._status === TenantStatus.DELETED) {
      return err(new DomainError('TENANT_DELETED', 'Cannot suspend deleted tenant'));
    }

    this._status = TenantStatus.SUSPENDED;
    this._updatedAt = clock.now();

    const event: TenantSuspendedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'tenant.TenantSuspended',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'Tenant',
      reason,
    };

    this.apply(event);

    return ok(undefined);
  }

  /**
   * Delete a tenant (soft deletion).
   *
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  delete(clock: Clock, eventIdGenerator: EventIdGenerator): Result<void, DomainError> {
    if (this._status === TenantStatus.DELETED) {
      return err(new DomainError('TENANT_ALREADY_DELETED', 'Tenant is already deleted'));
    }

    this._status = TenantStatus.DELETED;
    this._updatedAt = clock.now();

    const event: TenantDeletedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'tenant.TenantDeleted',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'Tenant',
    };

    this.apply(event);

    return ok(undefined);
  }
}
