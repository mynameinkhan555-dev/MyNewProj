import {
  AggregateRoot,
  DomainError,
  Result,
  ok,
  err,
  type Clock,
} from '@workspace/kernel';
import { PermissionId } from './PermissionId.js';
import { PermissionKey } from './PermissionKey.js';
import { PermissionScope } from './PermissionScope.js';
import { PermissionStatus } from './PermissionStatus.js';

/**
 * Permission aggregate - capability definition for authorization.
 *
 * Permissions represent WHAT can be done, not WHO can do it.
 * Role = WHO gets WHAT (permission grouping)
 * Policy = UNDER WHICH CONDITIONS (future extension point)
 *
 * Immutable fields:
 * - id: Entity identity
 * - key: Canonical business identity (reference for cache, logs, audit)
 * - scope: TENANT or PLATFORM (immutable to prevent cross-scope confusion)
 * - createdAt: Creation timestamp
 *
 * Mutable fields:
 * - displayName: UI-friendly name
 * - description: Human-readable description
 * - metadata: Future Policy layer context
 * - updatedAt: Last modification timestamp
 *
 * Lifecycle:
 * ACTIVE → DELETED (terminal)
 * No SUSPENDED state - temporary disabling via RolePermission or application policy
 */
export class Permission extends AggregateRoot<PermissionId> {
  protected readonly entityType = 'Permission';

  private _key: PermissionKey;
  private _scope: PermissionScope;
  private _status: PermissionStatus;
  private _displayName: string;
  private _description: string;
  private _metadata: Record<string, unknown>;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: PermissionId,
    key: PermissionKey,
    scope: PermissionScope,
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
    this._scope = scope;
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

  get scope(): PermissionScope {
    return this._scope;
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

  // ─── Mutation Methods ─────────────────────────────────────────────────────
  /**
   * Update display information (displayName, description, metadata).
   *
   * Note: This does NOT emit a domain event as it's typically
   * a CRUD operation. If audit requirements demand it,
   * PermissionUpdated event can be added in future.
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

  // ─── Reconstruct ─────────────────────────────────────────────────────────
  /**
   * Reconstruct a Permission from persisted state.
   *
   * @param props - Persisted properties
   * @returns Permission
   */
  static reconstruct(props: {
    id: string;
    key: string;
    scope: PermissionScope;
    status: PermissionStatus;
    displayName: string;
    description: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    version?: number;
  }): Permission {
    const key = PermissionKey.reconstruct(props.key);
    return new Permission(
      new PermissionId(props.id),
      key,
      props.scope,
      props.status,
      props.displayName,
      props.description,
      props.metadata,
      props.createdAt,
      props.updatedAt,
      props.version ?? 0,
    );
  }
}
