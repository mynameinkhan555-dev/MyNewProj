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
import { SessionId } from './SessionId.js';
import { UserId } from './UserId.js';
import type { SessionRevokedEvent } from './events/SessionEvents.js';

export class Session extends AggregateRoot<SessionId> {
  protected readonly entityType = 'Session';

  private _userId: UserId;
  private _refreshTokenHash: string;
  private _expiresAt: Date;
  private _revokedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: SessionId,
    userId: UserId,
    refreshTokenHash: string,
    expiresAt: Date,
    revokedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
    version: number = 0,
  ) {
    super(id, version);
    this._userId = userId;
    this._refreshTokenHash = refreshTokenHash;
    this._expiresAt = expiresAt;
    this._revokedAt = revokedAt;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ─── Properties ───────────────────────────────────────────────────────────
  get userId(): UserId {
    return this._userId;
  }

  get refreshTokenHash(): string {
    return this._refreshTokenHash;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ─── Factory ─────────────────────────────────────────────────────────────
  /**
   * Create a new Session.
   *
   * Note: This method accepts a pre-hashed refresh token string.
   * Refresh token hashing is the responsibility of the infrastructure layer.
   * The domain does NOT know about hashing algorithms, salts, or cost factors.
   *
   * @param userId - The User this session belongs to
   * @param refreshTokenHash - Pre-hashed refresh token string from infrastructure
   * @param expiresAt - Expiration timestamp (immutable)
   * @param clock - Clock for timestamps
   * @param idGenerator - ID generator for creating IDs
   * @returns Result<Session, DomainError>
   */
  static create(
    userId: UserId,
    refreshTokenHash: string,
    expiresAt: Date,
    clock: Clock,
    idGenerator: IdGenerator,
  ): Result<Session, DomainError> {
    const now = clock.now();
    const id = new SessionId(idGenerator.generate());

    const session = new Session(
      id,
      userId,
      refreshTokenHash,
      expiresAt,
      null, // revokedAt
      now,
      now,
      0,
    );

    // Note: SessionCreated is NOT a domain event (CRUD-only principle)
    // Only meaningful state transitions emit domain events

    return ok(session);
  }

  /**
   * Reconstruct a Session from persisted state.
   *
   * @param props - Persisted properties
   * @returns Session
   */
  static reconstruct(props: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    version?: number;
  }): Session {
    return new Session(
      new SessionId(props.id),
      new UserId(props.userId),
      props.refreshTokenHash,
      props.expiresAt,
      props.revokedAt,
      props.createdAt,
      props.updatedAt,
      props.version ?? 0,
    );
  }

  // ─── Lifecycle Methods ────────────────────────────────────────────────────
  /**
   * Revoke the session.
   *
   * Note: Already revoked sessions cannot be revoked again.
   * However, expired sessions CAN be revoked (security best practice).
   *
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  revoke(clock: Clock, eventIdGenerator: EventIdGenerator): Result<void, DomainError> {
    if (this._revokedAt !== null) {
      return err(new DomainError('SESSION_ALREADY_REVOKED', 'Session is already revoked'));
    }

    this._revokedAt = clock.now();
    this._updatedAt = clock.now();

    const event: SessionRevokedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'identity.SessionRevoked',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'Session',
      userId: this._userId.value,
    };

    this.apply(event);

    return ok(undefined);
  }

  // ─── Derived States ──────────────────────────────────────────────────────
  /**
   * Check if session is expired based on expiration timestamp.
   *
   * @param clock - Clock for current time
   * @returns true if expired, false otherwise
   */
  isExpired(clock: Clock): boolean {
    return this._expiresAt <= clock.now();
  }

  /**
   * Check if session is revoked.
   *
   * @returns true if revoked, false otherwise
   */
  isRevoked(): boolean {
    return this._revokedAt !== null;
  }

  /**
   * Check if session is valid (not expired and not revoked).
   *
   * @param clock - Clock for current time
   * @returns true if valid, false otherwise
   */
  isValid(clock: Clock): boolean {
    return !this.isExpired(clock) && !this.isRevoked();
  }
}
