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
import { PermissionId } from './PermissionId.js';
import { PermissionKey } from './PermissionKey.js';
import { PermissionScope } from './PermissionScope.js';
import { PermissionStatus } from './PermissionStatus.js';
import type { PermissionCreatedEvent } from './events/PermissionEvents.js';

/**
 * Platform-wide permission.
 *
 * Scope is fixed to PLATFORM to prevent cross-scope confusion.
 * Examples: platform.audit, platform.user.manage, platform.system.manage
 */
export class PlatformPermission extends AggregateRoot<PermissionId> {
  protected readonly entityType = 'PlatformPermission';

  private _key: PermissionKey;
  private _status: PermissionStatus;
  private _displayName: string;
  private _description: string;
  private _metadata: Record<string, unknown>;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: PermissionId,
    key: PermissionKey,
    status: PermissionStatus,
    displayName: string,
    description: string,
    metadata: Record<string, unknown>,
    createdAt: Date,
    updatedAt: Date,
    version: number = 0,
  ) {
    super(id, version);
    this._key = key;
    this._status = status;
    this._displayName = displayName;
    this._description = description;
    this._metadata = metadata;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ─── Properties ───────────────────────────────────────────────────────────
  get key(): PermissionKey {
    return this._key;
  }

  get status(): PermissionStatus {
    return this._status;
  }

  get displayName(): string {
    return this._displayName;
  }

  get description(): string {
    return this._description;
  }

  get metadata(): Record<string, unknown> {
    return this._metadata;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ─── Factory ─────────────────────────────────────────────────────────────
  /**
   * Create a new PlatformPermission.
   *
   * Scope is automatically set to PLATFORM.
   *
   * @param key - Permission key (e.g., "platform.audit")
   * @param displayName - UI-friendly name
   * @param description - Human-readable description
   * @param metadata - Future Policy layer context
   * @param clock - Clock for timestamps
   * @param idGenerator - ID generator for aggregate IDs
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<PlatformPermission, DomainError>
   */
  static create(
    key: string,
    displayName: string,
    description: string,
    metadata: Record<string, unknown>,
    clock: Clock,
    idGenerator: IdGenerator,
    eventIdGenerator: EventIdGenerator,
  ): Result<PlatformPermission, DomainError> {
    const keyResult = PermissionKey.create(key);
    if (keyResult.isErr()) {
      return err(keyResult.error);
    }

    if (!displayName || displayName.trim().length === 0) {
      return err(new DomainError('DISPLAY_NAME_REQUIRED', 'Display name is required'));
    }

    const now = clock.now();
    const id = new PermissionId(idGenerator.generate());

    const permission = new PlatformPermission(
      id,
      keyResult.value,
      PermissionStatus.ACTIVE,
      displayName.trim(),
      description,
      metadata,
      now,
      now,
      0,
    );

    const event: PermissionCreatedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'permission.PermissionCreated',
      occurredAt: now,
      aggregateId: id.value,
      aggregateType: 'PlatformPermission',
      permissionKey: keyResult.value.value,
      scope: PermissionScope.PLATFORM,
    };

    permission.apply(event);

    return ok(permission);
  }

  /**
   * Reconstruct a PlatformPermission from persisted state.
   *
   * @param props - Persisted properties
   * @returns PlatformPermission
   */
  static reconstruct(props: {
    id: string;
    key: string;
    status: PermissionStatus;
    displayName: string;
    description: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    version?: number;
  }): PlatformPermission {
    const key = PermissionKey.reconstruct(props.key);
    return new PlatformPermission(
      new PermissionId(props.id),
      key,
      props.status,
      props.displayName,
      props.description,
      props.metadata,
      props.createdAt,
      props.updatedAt,
      props.version ?? 0,
    );
  }

  // ─── Mutation Methods ─────────────────────────────────────────────────────
  /**
   * Update display information.
   *
   * @param displayName - UI-friendly name
   * @param description - Human-readable description
   * @param metadata - Future Policy layer context
   * @param clock - Clock for timestamps
   * @returns Result<void, DomainError>
   */
  updateDisplay(
    displayName: string,
    description: string,
    metadata: Record<string, unknown>,
    clock: Clock,
  ): Result<void, DomainError> {
    if (this._status === PermissionStatus.DELETED) {
      return err(new DomainError('PERMISSION_DELETED', 'Cannot update deleted permission'));
    }

    if (!displayName || displayName.trim().length === 0) {
      return err(new DomainError('DISPLAY_NAME_REQUIRED', 'Display name is required'));
    }

    this._displayName = displayName.trim();
    this._description = description;
    this._metadata = metadata;
    this._updatedAt = clock.now();

    return ok(undefined);
  }

  /**
   * Delete a permission (soft deletion).
   *
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  delete(clock: Clock, eventIdGenerator: EventIdGenerator): Result<void, DomainError> {
    if (this._status === PermissionStatus.DELETED) {
      return err(new DomainError('PERMISSION_ALREADY_DELETED', 'Permission is already deleted'));
    }

    this._status = PermissionStatus.DELETED;
    this._updatedAt = clock.now();

    const event = {
      eventId: eventIdGenerator.generate(),
      eventName: 'permission.PermissionDeleted',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'PlatformPermission',
      permissionKey: this._key.value,
      scope: PermissionScope.PLATFORM,
    };

    this.apply(event);

    return ok(undefined);
  }
}
