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
import { TenantId } from '@workspace/tenant';
import { TenantRoleId } from './TenantRoleId.js';
import { RoleKey } from './RoleKey.js';
import { RoleStatus } from './RoleStatus.js';
import type { RoleCreatedEvent, RoleDeletedEvent } from './events/RoleEvents.js';

/**
 * Tenant-specific role.
 *
 * Role = permission grouping / capability collection.
 * "WHO gets WHAT" layer in authorization.
 *
 * TenantRole is scoped to a specific tenant (tenantId immutable).
 * It cannot be moved between tenants.
 *
 * Immutable fields:
 * - id: Entity identity
 * - tenantId: Owner tenant (immutable to prevent cross-tenant migration)
 * - key: Canonical business identity (reference for cache, logs, audit)
 * - createdAt: Creation timestamp
 *
 * Mutable fields:
 * - displayName: UI-friendly name
 * - description: Human-readable description
 * - status: ACTIVE or DELETED
 * - updatedAt: Last modification timestamp
 *
 * Lifecycle:
 * ACTIVE → DELETED (terminal)
 * No SUSPENDED state - temporary disabling via RoleAssignment or application policy
 *
 * Aggregate boundary:
 * - Does NOT own Permissions
 * - Does NOT own RoleAssignments
 * - Does NOT own Users or Memberships
 * - Relationships via TenantRolePermission and RoleAssignment (future)
 */
export class TenantRole extends AggregateRoot<TenantRoleId> {
  protected readonly entityType = 'TenantRole';

  private _tenantId: TenantId;
  private _key: RoleKey;
  private _status: RoleStatus;
  private _displayName: string;
  private _description: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: TenantRoleId,
    tenantId: TenantId,
    key: RoleKey,
    status: RoleStatus,
    displayName: string,
    description: string,
    createdAt: Date,
    updatedAt: Date,
    version: number = 0,
  ) {
    super(id, version);
    this._tenantId = tenantId;
    this._key = key;
    this._status = status;
    this._displayName = displayName;
    this._description = description;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ─── Properties ───────────────────────────────────────────────────────────
  get tenantId(): TenantId {
    return this._tenantId;
  }

  get key(): RoleKey {
    return this._key;
  }

  get status(): RoleStatus {
    return this._status;
  }

  get displayName(): string {
    return this._displayName;
  }

  get description(): string {
    return this._description;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ─── Factory ─────────────────────────────────────────────────────────────
  /**
   * Create a new TenantRole.
   *
   * @param tenantId - Owner tenant ID (immutable)
   * @param key - Role key (e.g., "admin", "member")
   * @param displayName - UI-friendly name
   * @param description - Human-readable description
   * @param clock - Clock for timestamps
   * @param idGenerator - ID generator for aggregate IDs
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<TenantRole, DomainError>
   */
  static create(
    tenantId: TenantId,
    key: string,
    displayName: string,
    description: string,
    clock: Clock,
    idGenerator: IdGenerator,
    eventIdGenerator: EventIdGenerator,
  ): Result<TenantRole, DomainError> {
    const keyResult = RoleKey.create(key);
    if (keyResult.isErr()) {
      return err(keyResult.error);
    }

    if (!displayName || displayName.trim().length === 0) {
      return err(new DomainError('DISPLAY_NAME_REQUIRED', 'Display name is required'));
    }

    const now = clock.now();
    const id = new TenantRoleId(idGenerator.generate());

    const role = new TenantRole(
      id,
      tenantId,
      keyResult.value,
      RoleStatus.ACTIVE,
      displayName.trim(),
      description,
      now,
      now,
      0,
    );

    const event: RoleCreatedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'role.RoleCreated',
      occurredAt: now,
      aggregateId: id.value,
      aggregateType: 'TenantRole',
      tenantId: tenantId.value,
      roleKey: keyResult.value.value,
    };

    role.apply(event);

    return ok(role);
  }

  /**
   * Reconstruct a TenantRole from persisted state.
   *
   * @param props - Persisted properties
   * @returns TenantRole
   */
  static reconstruct(props: {
    id: string;
    tenantId: string;
    key: string;
    status: RoleStatus;
    displayName: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    version?: number;
  }): TenantRole {
    const key = RoleKey.reconstruct(props.key);
    return new TenantRole(
      new TenantRoleId(props.id),
      new TenantId(props.tenantId),
      key,
      props.status,
      props.displayName,
      props.description,
      props.createdAt,
      props.updatedAt,
      props.version ?? 0,
    );
  }

  // ─── Mutation Methods ─────────────────────────────────────────────────────
  /**
   * Update display information (displayName, description).
   *
   * Note: This does NOT emit a domain event as it's typically
   * a CRUD operation. If audit requirements demand it,
   * RoleUpdated event can be added in future.
   *
   * @param displayName - UI-friendly name
   * @param description - Human-readable description
   * @param clock - Clock for timestamps
   * @returns Result<void, DomainError>
   */
  updateDisplay(
    displayName: string,
    description: string,
    clock: Clock,
  ): Result<void, DomainError> {
    if (this._status === RoleStatus.DELETED) {
      return err(new DomainError('ROLE_DELETED', 'Cannot update deleted role'));
    }

    if (!displayName || displayName.trim().length === 0) {
      return err(new DomainError('DISPLAY_NAME_REQUIRED', 'Display name is required'));
    }

    this._displayName = displayName.trim();
    this._description = description;
    this._updatedAt = clock.now();

    return ok(undefined);
  }

  /**
   * Delete a role (soft deletion).
   *
   * This marks the role as DELETED. Application layer must handle:
   * - RolePermission relationship cleanup
   * - RoleAssignment cleanup
   * - Last-admin policy enforcement
   *
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  delete(clock: Clock, eventIdGenerator: EventIdGenerator): Result<void, DomainError> {
    if (this._status === RoleStatus.DELETED) {
      return err(new DomainError('ROLE_ALREADY_DELETED', 'Role is already deleted'));
    }

    this._status = RoleStatus.DELETED;
    this._updatedAt = clock.now();

    const event: RoleDeletedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'role.RoleDeleted',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'TenantRole',
      tenantId: this._tenantId.value,
      roleKey: this._key.value,
    };

    this.apply(event);

    return ok(undefined);
  }
}
