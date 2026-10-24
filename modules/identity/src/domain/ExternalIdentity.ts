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
import { ExternalIdentityId } from './ExternalIdentityId.js';
import { UserId } from './UserId.js';
import { ExternalIdentityProvider } from './ExternalIdentityProvider.js';
import { Email } from './Email.js';
import type {
  ExternalIdentityCreatedEvent,
  ExternalIdentityMetadataUpdatedEvent,
} from './events/ExternalIdentityEvents.js';

export class ExternalIdentity extends AggregateRoot<ExternalIdentityId> {
  protected readonly entityType = 'ExternalIdentity';

  private _userId: UserId;
  private _provider: ExternalIdentityProvider;
  private _providerSubject: string;
  private _identityVerifiedAt: Date;
  private _providerEmail: Email | null;
  private _providerEmailVerified: boolean | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: ExternalIdentityId,
    userId: UserId,
    provider: ExternalIdentityProvider,
    providerSubject: string,
    identityVerifiedAt: Date,
    providerEmail: Email | null,
    providerEmailVerified: boolean | null,
    createdAt: Date,
    updatedAt: Date,
    version: number = 0,
  ) {
    super(id, version);
    this._userId = userId;
    this._provider = provider;
    this._providerSubject = providerSubject;
    this._identityVerifiedAt = identityVerifiedAt;
    this._providerEmail = providerEmail;
    this._providerEmailVerified = providerEmailVerified;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ─── Properties ───────────────────────────────────────────────────────────
  get userId(): UserId {
    return this._userId;
  }

  get provider(): ExternalIdentityProvider {
    return this._provider;
  }

  get providerSubject(): string {
    return this._providerSubject;
  }

  get identityVerifiedAt(): Date {
    return this._identityVerifiedAt;
  }

  get providerEmail(): Email | null {
    return this._providerEmail;
  }

  get providerEmailVerified(): boolean | null {
    return this._providerEmailVerified;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ─── Business Methods ──────────────────────────────────────────────────────
  hasProviderEmail(): boolean {
    return this._providerEmail !== null;
  }

  isProviderEmailVerified(): boolean {
    return this._providerEmailVerified === true;
  }

  // ─── Factory ─────────────────────────────────────────────────────────────
  /**
   * Create a new ExternalIdentity.
   *
   * @param userId - The User this external identity belongs to
   * @param provider - The external identity provider
   * @param providerSubject - Provider-specific subject identifier
   * @param identityVerifiedAt - Timestamp when provider verified this identity
   * @param providerEmail - Email provided by the provider (optional)
   * @param providerEmailVerified - Whether provider verified the email (optional)
   * @param clock - Clock for timestamps
   * @param idGenerator - ID generator for aggregate IDs
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<ExternalIdentity, DomainError>
   */
  static create(
    userId: UserId,
    provider: ExternalIdentityProvider,
    providerSubject: string,
    identityVerifiedAt: Date,
    providerEmail: Email | null,
    providerEmailVerified: boolean | null,
    clock: Clock,
    idGenerator: IdGenerator,
    eventIdGenerator: EventIdGenerator,
  ): Result<ExternalIdentity, DomainError> {
    const now = clock.now();
    const id = new ExternalIdentityId(idGenerator.generate());

    const externalIdentity = new ExternalIdentity(
      id,
      userId,
      provider,
      providerSubject,
      identityVerifiedAt,
      providerEmail,
      providerEmailVerified,
      now,
      now,
      0,
    );

    const event: ExternalIdentityCreatedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'identity.ExternalIdentityCreated',
      occurredAt: now,
      aggregateId: id.value,
      aggregateType: 'ExternalIdentity',
      userId: userId.value,
      provider: provider.value,
      providerSubject,
    };

    externalIdentity.apply(event);

    return ok(externalIdentity);
  }

  /**
   * Reconstruct an ExternalIdentity from persisted state.
   *
   * @param props - Persisted properties
   * @returns ExternalIdentity
   */
  static reconstruct(props: {
    id: string;
    userId: string;
    provider: string;
    providerSubject: string;
    identityVerifiedAt: Date;
    providerEmail: string | null;
    providerEmailVerified: boolean | null;
    createdAt: Date;
    updatedAt: Date;
    version?: number;
  }): ExternalIdentity {
    const provider = ExternalIdentityProvider.fromCanonical(props.provider);
    const email = props.providerEmail ? Email.fromCanonical(props.providerEmail) : null;

    return new ExternalIdentity(
      new ExternalIdentityId(props.id),
      new UserId(props.userId),
      provider,
      props.providerSubject,
      props.identityVerifiedAt,
      email,
      props.providerEmailVerified,
      props.createdAt,
      props.updatedAt,
      props.version ?? 0,
    );
  }

  // ─── Lifecycle Methods ────────────────────────────────────────────────────
  /**
   * Update provider metadata (email and verification status).
   *
   * Note: This does NOT modify the immutable identity key (provider, providerSubject).
   * It only updates mutable metadata provided by the provider.
   *
   * @param providerEmail - New email from provider (optional)
   * @param providerEmailVerified - New email verification status (optional)
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  updateProviderMetadata(
    providerEmail: Email | null,
    providerEmailVerified: boolean | null,
    clock: Clock,
    eventIdGenerator: EventIdGenerator,
  ): Result<void, DomainError> {
    this._providerEmail = providerEmail;
    this._providerEmailVerified = providerEmailVerified;
    this._updatedAt = clock.now();

    const event: ExternalIdentityMetadataUpdatedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'identity.ExternalIdentityMetadataUpdated',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'ExternalIdentity',
      userId: this._userId.value,
      provider: this._provider.value,
      providerSubject: this._providerSubject,
      providerEmail: providerEmail?.value ?? null,
      providerEmailVerified,
    };

    this.apply(event);

    return ok(undefined);
  }
}
