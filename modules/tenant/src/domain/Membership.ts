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
import { MembershipId } from './MembershipId.js';
import { MembershipStatus } from './MembershipStatus.js';
import { UserId } from '@workspace/identity';
import { TenantId } from './TenantId.js';
import type {
  MembershipCreatedEvent,
  MembershipActivatedEvent,
  MembershipSuspendedEvent,
  MembershipDeletedEvent,
} from './events/MembershipEvents-legacy.js';

export class Membership extends AggregateRoot<MembershipId> {
  protected readonly entityType = 'Membership';

  private _userId: UserId;
  private _tenantId: TenantId;
  private _status: MembershipStatus;
  private _joinedAt: Date;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: MembershipId,
    userId: UserId,
    tenantId: TenantId,
    status: MembershipStatus,
    joinedAt: Date,
    createdAt: Date,
    updatedAt: Date,
    version: number = 0,
  ) {
    super(id, version);
    this._userId = userId;
    this._tenantId = tenantId;
    this._status = status;
    this._joinedAt = joinedAt;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ─── Properties ───────────────────────────────────────────────────────────
  get userId(): UserId {
    return this._userId;
  }

  get tenantId(): TenantId {
    return this._tenantId;
  }

  get status(): MembershipStatus {
    return this._status;
  }

  get joinedAt(): Date {
    return this._joinedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ─── Factory ─────────────────────────────────────────────────────────────
  /**
   * Create a new Membership.
   *
   * Note: This method does NOT check if User or Tenant exists.
   * That is an Application + DB responsibility.
   *
   * @param userId - User ID
   * @param tenantId - Tenant ID
   * @param clock - Clock for timestamps
   * @param idGenerator - ID generator for aggregate IDs
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<Membership, DomainError>
   */
  static create(
    userId: UserId,
    tenantId: TenantId,
    clock: Clock,
    idGenerator: IdGenerator,
    eventIdGenerator: EventIdGenerator,
  ): Result<Membership, DomainError> {
    const now = clock.now();
    const id = new MembershipId(idGenerator.generate());

    const membership = new Membership(
      id,
      userId,
      tenantId,
      MembershipStatus.ACTIVE,
      now,
      now,
      now,
      0,
    );

    const event: MembershipCreatedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'tenant.MembershipCreated',
      eventType: 'MembershipCreated',
      occurredAt: now,
      aggregateId: id.value,
      aggregateType: 'Membership',
      userId: userId.value,
      tenantId: tenantId.value,
    };

    membership.apply(event);

    return ok(membership);
  }

  /**
   * Reconstruct a Membership from persisted state.
   *
   * @param props - Persisted properties
   * @returns Membership
   */
  static reconstruct(props: {
    id: string;
    userId: string;
    tenantId: string;
    status: MembershipStatus;
    joinedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    version?: number;
  }): Membership {
    return new Membership(
      new MembershipId(props.id),
      new UserId(props.userId),
      new TenantId(props.tenantId),
      props.status,
      props.joinedAt,
      props.createdAt,
      props.updatedAt,
      props.version ?? 0,
    );
  }

  // ─── Lifecycle Methods ────────────────────────────────────────────────────
  /**
   * Activate a suspended membership.
   *
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  activate(clock: Clock, eventIdGenerator: EventIdGenerator): Result<void, DomainError> {
    if (this._status === MembershipStatus.ACTIVE) {
      return err(new DomainError('MEMBERSHIP_ALREADY_ACTIVE', 'Membership is already active'));
    }

    if (this._status === MembershipStatus.DELETED) {
      return err(new DomainError('MEMBERSHIP_DELETED', 'Cannot activate deleted membership'));
    }

    this._status = MembershipStatus.ACTIVE;
    this._updatedAt = clock.now();

    const event: MembershipActivatedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'tenant.MembershipActivated',
      eventType: 'MembershipActivated',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'Membership',
      userId: this._userId.value,
      tenantId: this._tenantId.value,
    };

    this.apply(event);

    return ok(undefined);
  }

  /**
   * Suspend an active membership.
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
    if (this._status === MembershipStatus.SUSPENDED) {
      return err(new DomainError('MEMBERSHIP_ALREADY_SUSPENDED', 'Membership is already suspended'));
    }

    if (this._status === MembershipStatus.DELETED) {
      return err(new DomainError('MEMBERSHIP_DELETED', 'Cannot suspend deleted membership'));
    }

    this._status = MembershipStatus.SUSPENDED;
    this._updatedAt = clock.now();

    const event: MembershipSuspendedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'tenant.MembershipSuspended',
      eventType: 'MembershipSuspended',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'Membership',
      userId: this._userId.value,
      tenantId: this._tenantId.value,
    };

    this.apply(event);

    return ok(undefined);
  }

  /**
   * Delete a membership (terminate User–Tenant relationship).
   *
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  delete(clock: Clock, eventIdGenerator: EventIdGenerator): Result<void, DomainError> {
    if (this._status === MembershipStatus.DELETED) {
      return err(new DomainError('MEMBERSHIP_ALREADY_DELETED', 'Membership is already deleted'));
    }

    this._status = MembershipStatus.DELETED;
    this._updatedAt = clock.now();

    const event: MembershipDeletedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'tenant.MembershipDeleted',
      eventType: 'MembershipDeleted',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'Membership',
      userId: this._userId.value,
      tenantId: this._tenantId.value,
    };

    this.apply(event);

    return ok(undefined);
  }
}
