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
import { UserId } from './UserId.js';
import { UserStatus } from './UserStatus.js';
import { EmailIdentity } from './EmailIdentity.js';
import { EmailIdentityId } from './EmailIdentityId.js';
import { PasswordCredential } from './PasswordCredential.js';
import { PasswordCredentialId } from './PasswordCredentialId.js';
import type {
  UserCreatedEvent,
  UserActivatedEvent,
  UserSuspendedEvent,
  UserDeletedEvent,
} from './events/UserEvents.js';

/**
 * User AggregateRoot - canonical global account.
 * 
 * User represents the existence of an account in the platform.
 * It does NOT contain:
 * - email (moved to EmailIdentity)
 * - password (moved to PasswordCredential)
 * - identities (cross-aggregate reference)
 * - sessions (cross-aggregate reference)
 * - memberships (Tenant context)
 * - roles (Authorization context)
 * 
 * Aggregate invariants:
 * - User ID is immutable
 * - User status follows valid lifecycle transitions
 * - Deleted users cannot be reactivated or suspended
 * - updatedAt changes on any mutation
 */
export class User extends AggregateRoot<UserId> {
  protected readonly entityType = 'User';

  private _status: UserStatus;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: UserId,
    status: UserStatus,
    createdAt: Date,
    updatedAt: Date,
    version: number = 0
  ) {
    super(id, version);
    this._status = status;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ─── Getters ────────────────────────────────────────────────────────────
  get status(): UserStatus {
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
   * Create a new User.
   *
   * @param clock - Clock for timestamps (injected for testability)
   * @param idGenerator - ID generator for creating User ID (injected for testability)
   * @param eventIdGenerator - Event ID generator for domain events (injected for testability)
   * @returns Result<User, DomainError>
   */
  static create(
    clock: Clock,
    idGenerator: IdGenerator,
    eventIdGenerator: EventIdGenerator,
  ): Result<User, DomainError> {
    const now = clock.now();
    const id = new UserId(idGenerator.generate());
    const user = new User(id, UserStatus.ACTIVE, now, now);

    const event: UserCreatedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'identity.UserCreated',
      occurredAt: now,
      aggregateId: id.value,
      aggregateType: 'User',
      userId: id.value,
    };

    user.apply(event);

    return ok(user);
  }

  /**
   * Reconstruct a User from persisted state.
   * 
   * Used by repositories to hydrate aggregates.
   * Does NOT emit UserCreated event.
   * 
   * @param props - Persisted user properties
   * @returns User
   */
  static reconstruct(props: {
    id: string;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
    version?: number;
  }): User {
    return new User(
      new UserId(props.id),
      props.status,
      props.createdAt,
      props.updatedAt,
      props.version ?? 0
    );
  }

  // ─── Lifecycle Methods ────────────────────────────────────────────────────
  /**
   * Activate the user.
   *
   * Valid transitions:
   * - SUSPENDED → ACTIVE
   *
   * Invalid transitions:
   * - ACTIVE → ACTIVE (no-op, returns error)
   * - DELETED → ACTIVE (error)
   *
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  activate(clock: Clock, eventIdGenerator: EventIdGenerator): Result<void, DomainError> {
    if (this._status === UserStatus.ACTIVE) {
      return err(new DomainError('USER_ALREADY_ACTIVE', 'User is already active'));
    }

    if (this._status === UserStatus.DELETED) {
      return err(new DomainError('USER_DELETED', 'Cannot activate a deleted user'));
    }

    this._status = UserStatus.ACTIVE;
    this._updatedAt = clock.now();

    const event: UserActivatedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'identity.UserActivated',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'User',
      userId: this.id.value,
    };

    this.apply(event);

    return ok(undefined);
  }

  /**
   * Suspend the user.
   *
   * Valid transitions:
   * - ACTIVE → SUSPENDED
   *
   * Invalid transitions:
   * - SUSPENDED → SUSPENDED (no-op, returns error)
   * - DELETED → SUSPENDED (error)
   *
   * @param reason - Optional reason for suspension
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  suspend(
    reason: string | undefined,
    clock: Clock,
    eventIdGenerator: EventIdGenerator,
  ): Result<void, DomainError> {
    if (this._status === UserStatus.SUSPENDED) {
      return err(new DomainError('USER_ALREADY_SUSPENDED', 'User is already suspended'));
    }

    if (this._status === UserStatus.DELETED) {
      return err(new DomainError('USER_DELETED', 'Cannot suspend a deleted user'));
    }

    this._status = UserStatus.SUSPENDED;
    this._updatedAt = clock.now();

    const event: UserSuspendedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'identity.UserSuspended',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'User',
      userId: this.id.value,
      reason,
    };

    this.apply(event);

    return ok(undefined);
  }

  /**
   * Delete the user.
   *
   * Valid transitions:
   * - ACTIVE → DELETED
   * - SUSPENDED → DELETED
   *
   * Invalid transitions:
   * - DELETED → DELETED (no-op, returns error)
   *
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  delete(clock: Clock, eventIdGenerator: EventIdGenerator): Result<void, DomainError> {
    if (this._status === UserStatus.DELETED) {
      return err(new DomainError('USER_ALREADY_DELETED', 'User is already deleted'));
    }

    this._status = UserStatus.DELETED;
    this._updatedAt = clock.now();

    const event: UserDeletedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'identity.UserDeleted',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'User',
      userId: this.id.value,
    };

    this.apply(event);

    return ok(undefined);
  }

  // ─── Business Methods ────────────────────────────────────────────────────
  /**
   * Check if user is active.
   */
  isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  /**
   * Check if user is suspended.
   */
  isSuspended(): boolean {
    return this._status === UserStatus.SUSPENDED;
  }

  /**
   * Check if user is deleted.
   */
  isDeleted(): boolean {
    return this._status === UserStatus.DELETED;
  }
}
