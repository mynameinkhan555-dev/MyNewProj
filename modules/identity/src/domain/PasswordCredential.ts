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
import { PasswordCredentialId } from './PasswordCredentialId.js';
import { UserId } from './UserId.js';
import type {
  PasswordCredentialCreatedEvent,
  PasswordCredentialChangedEvent,
} from './events/PasswordCredentialEvents.js';

export class PasswordCredential extends AggregateRoot<PasswordCredentialId> {
  protected readonly entityType = 'PasswordCredential';

  private _userId: UserId;
  private _hashedPassword: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: PasswordCredentialId,
    userId: UserId,
    hashedPassword: string,
    createdAt: Date,
    updatedAt: Date,
    version: number = 0,
  ) {
    super(id, version);
    this._userId = userId;
    this._hashedPassword = hashedPassword;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ─── Properties ───────────────────────────────────────────────────────────
  get userId(): UserId {
    return this._userId;
  }

  get hashedPassword(): string {
    return this._hashedPassword;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ─── Factory ─────────────────────────────────────────────────────────────
  /**
   * Create a new PasswordCredential.
   *
   * Note: This method accepts a pre-hashed password string.
   * Password hashing (bcrypt, argon2, etc.) is the responsibility of the infrastructure layer.
   * The domain does NOT know about hashing algorithms, salts, or cost factors.
   *
   * @param userId - The User this password credential belongs to
   * @param hashedPassword - Pre-hashed password string from infrastructure
   * @param clock - Clock for timestamps
   * @param idGenerator - ID generator for aggregate IDs
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<PasswordCredential, DomainError>
   */
  static create(
    userId: UserId,
    hashedPassword: string,
    clock: Clock,
    idGenerator: IdGenerator,
    eventIdGenerator: EventIdGenerator,
  ): Result<PasswordCredential, DomainError> {
    const now = clock.now();
    const id = new PasswordCredentialId(idGenerator.generate());

    const passwordCredential = new PasswordCredential(
      id,
      userId,
      hashedPassword,
      now,
      now,
      0,
    );

    const event: PasswordCredentialCreatedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'identity.PasswordCredentialCreated',
      occurredAt: now,
      aggregateId: id.value,
      aggregateType: 'PasswordCredential',
      userId: userId.value,
    };

    passwordCredential.apply(event);

    return ok(passwordCredential);
  }

  /**
   * Reconstruct a PasswordCredential from persisted state.
   *
   * @param props - Persisted properties
   * @returns PasswordCredential
   */
  static reconstruct(props: {
    id: string;
    userId: string;
    hashedPassword: string;
    createdAt: Date;
    updatedAt: Date;
    version?: number;
  }): PasswordCredential {
    return new PasswordCredential(
      new PasswordCredentialId(props.id),
      new UserId(props.userId),
      props.hashedPassword,
      props.createdAt,
      props.updatedAt,
      props.version ?? 0,
    );
  }

  // ─── Lifecycle Methods ────────────────────────────────────────────────────
  /**
   * Change the password credential.
   *
   * Note: This is a pure state transition.
   * It does NOT:
   * - Verify the old password (application layer concern)
   * - Validate password strength (application layer concern)
   * - Check password history (application layer concern)
   * - Hash the password (infrastructure layer concern)
   * - Revoke sessions (application layer concern)
   *
   * @param newHashedPassword - New pre-hashed password string from infrastructure
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  changePassword(
    newHashedPassword: string,
    clock: Clock,
    eventIdGenerator: EventIdGenerator,
  ): Result<void, DomainError> {
    this._hashedPassword = newHashedPassword;
    this._updatedAt = clock.now();

    const event: PasswordCredentialChangedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'identity.PasswordCredentialChanged',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'PasswordCredential',
      userId: this._userId.value,
    };

    this.apply(event);

    return ok(undefined);
  }
}
