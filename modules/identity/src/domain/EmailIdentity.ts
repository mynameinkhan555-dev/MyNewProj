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
import { EmailIdentityId } from './EmailIdentityId.js';
import { UserId } from './UserId.js';
import { Email } from './Email.js';
import type {
  EmailIdentityCreatedEvent,
  EmailIdentityVerifiedEvent,
  EmailIdentityPromotedToPrimaryEvent,
  EmailIdentityDemotedFromPrimaryEvent,
} from './events/EmailIdentityEvents.js';

export class EmailIdentity extends AggregateRoot<EmailIdentityId> {
  protected readonly entityType = 'EmailIdentity';

  private _userId: UserId;
  private _email: Email;
  private _verifiedAt: Date | null;
  private _primary: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: EmailIdentityId,
    userId: UserId,
    email: Email,
    verifiedAt: Date | null,
    primary: boolean,
    createdAt: Date,
    updatedAt: Date,
    version: number = 0,
  ) {
    super(id, version);
    this._userId = userId;
    this._email = email;
    this._verifiedAt = verifiedAt;
    this._primary = primary;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ─── Properties ───────────────────────────────────────────────────────────
  get userId(): UserId {
    return this._userId;
  }

  get email(): Email {
    return this._email;
  }

  get verifiedAt(): Date | null {
    return this._verifiedAt;
  }

  get primary(): boolean {
    return this._primary;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ─── Business Methods ──────────────────────────────────────────────────────
  isVerified(): boolean {
    return this._verifiedAt !== null;
  }

  isPrimary(): boolean {
    return this._primary;
  }

  // ─── Factory ─────────────────────────────────────────────────────────────
  /**
   * Create a new EmailIdentity.
   *
   * @param userId - The User this email belongs to
   * @param email - The email value object
   * @param clock - Clock for timestamps
   * @param idGenerator - ID generator for aggregate IDs
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<EmailIdentity, DomainError>
   */
  static create(
    userId: UserId,
    email: Email,
    clock: Clock,
    idGenerator: IdGenerator,
    eventIdGenerator: EventIdGenerator,
  ): Result<EmailIdentity, DomainError> {
    const now = clock.now();
    const id = new EmailIdentityId(idGenerator.generate());

    const emailIdentity = new EmailIdentity(
      id,
      userId,
      email,
      null, // verifiedAt
      false, // primary
      now,
      now,
      0, // version
    );

    const event: EmailIdentityCreatedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'identity.EmailIdentityCreated',
      occurredAt: now,
      aggregateId: id.value,
      aggregateType: 'EmailIdentity',
      userId: userId.value,
      email: email.value,
    };

    emailIdentity.apply(event);

    return ok(emailIdentity);
  }

  /**
   * Reconstruct an EmailIdentity from persisted state.
   *
   * @param props - Persisted properties
   * @returns EmailIdentity
   */
  static reconstruct(props: {
    id: string;
    userId: string;
    email: string;
    verifiedAt: Date | null;
    primary: boolean;
    createdAt: Date;
    updatedAt: Date;
    version?: number;
  }): EmailIdentity {
    // Assume persisted email is valid - bypass validation for reconstruction
    // In production, this would be validated by DB constraints or application layer
    const email = Email.fromCanonical(props.email);
    return new EmailIdentity(
      new EmailIdentityId(props.id),
      new UserId(props.userId),
      email,
      props.verifiedAt,
      props.primary,
      props.createdAt,
      props.updatedAt,
      props.version ?? 0,
    );
  }

  // ─── Lifecycle Methods ────────────────────────────────────────────────────
  /**
   * Verify the email identity.
   *
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  verify(clock: Clock, eventIdGenerator: EventIdGenerator): Result<void, DomainError> {
    if (this._verifiedAt !== null) {
      return err(new DomainError('EMAIL_ALREADY_VERIFIED', 'Email is already verified'));
    }

    this._verifiedAt = clock.now();
    this._updatedAt = clock.now();

    const event: EmailIdentityVerifiedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'identity.EmailIdentityVerified',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'EmailIdentity',
      userId: this._userId.value,
      email: this._email.value,
    };

    this.apply(event);

    return ok(undefined);
  }

  /**
   * Promote this email to primary.
   *
   * Note: Cross-aggregate invariant "User has only one primary email"
   * is enforced at Application Layer + Database constraint.
   *
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  promoteToPrimary(clock: Clock, eventIdGenerator: EventIdGenerator): Result<void, DomainError> {
    if (this._primary) {
      return err(new DomainError('EMAIL_ALREADY_PRIMARY', 'Email is already primary'));
    }

    this._primary = true;
    this._updatedAt = clock.now();

    const event: EmailIdentityPromotedToPrimaryEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'identity.EmailIdentityPromotedToPrimary',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'EmailIdentity',
      userId: this._userId.value,
      email: this._email.value,
    };

    this.apply(event);

    return ok(undefined);
  }

  /**
   * Demote this email from primary.
   *
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  demoteFromPrimary(clock: Clock, eventIdGenerator: EventIdGenerator): Result<void, DomainError> {
    if (!this._primary) {
      return err(new DomainError('EMAIL_NOT_PRIMARY', 'Email is not primary'));
    }

    this._primary = false;
    this._updatedAt = clock.now();

    const event: EmailIdentityDemotedFromPrimaryEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'identity.EmailIdentityDemotedFromPrimary',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'EmailIdentity',
      userId: this._userId.value,
      email: this._email.value,
    };

    this.apply(event);

    return ok(undefined);
  }
}
