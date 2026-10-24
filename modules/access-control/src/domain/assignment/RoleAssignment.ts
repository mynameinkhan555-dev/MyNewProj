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
import { MembershipId } from '@workspace/tenant';
import { TenantRoleId } from '../role/TenantRoleId.js';
import { RoleAssignmentId } from './RoleAssignmentId.js';
import { RoleAssignmentStatus } from './RoleAssignmentStatus.js';
import type { RoleAssignmentCreatedEvent, RoleAssignmentDeletedEvent } from './events/RoleAssignmentEvents.js';

/**
 * RoleAssignment - authorization relationship between Membership and TenantRole.
 *
 * This represents: "This Membership has this TenantRole."
 *
 * Authorization chain:
 * User → Membership → RoleAssignment → TenantRole → Permission
 *
 * RoleAssignment is an independent aggregate (not an entity inside Membership or Role).
 * This enables:
 * - Independent lifecycle (ACTIVE → DELETED)
 * - Own domain events for security audit
 * - Separate concurrency control
 * - Optimized authorization decisions
 *
 * Immutable fields:
 * - id: Entity identity
 * - membershipId: Reference to Membership
 * - roleId: Reference to TenantRole
 * - createdAt: Creation timestamp
 *
 * Mutable fields:
 * - status: ACTIVE or DELETED
 * - updatedAt: Last modification timestamp
 *
 * Important design decisions:
 * - Does NOT store userId (available through Membership)
 * - Does NOT store tenantId (available through Membership and Role)
 * - Cross-tenant validation (membership.tenantId === role.tenantId) is Application responsibility
 * - Duplicate assignment prevention (UNIQUE(membership_id, role_id)) is DB responsibility
 *
 * Lifecycle:
 * ACTIVE → DELETED (terminal)
 * No SUSPENDED state - temporary disabling via Membership or Role lifecycle
 *
 * Aggregate boundary:
 * - Does NOT own Membership
 * - Does NOT own TenantRole
 * - Does NOT own User
 * - Role deletion does NOT cascade in Domain (Application orchestration)
 */
export class RoleAssignment extends AggregateRoot<RoleAssignmentId> {
  protected readonly entityType = 'RoleAssignment';

  private _membershipId: MembershipId;
  private _roleId: TenantRoleId;
  private _status: RoleAssignmentStatus;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: RoleAssignmentId,
    membershipId: MembershipId,
    roleId: TenantRoleId,
    status: RoleAssignmentStatus,
    createdAt: Date,
    updatedAt: Date,
    version: number = 0,
  ) {
    super(id, version);
    this._membershipId = membershipId;
    this._roleId = roleId;
    this._status = status;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ─── Properties ───────────────────────────────────────────────────────────
  get membershipId(): MembershipId {
    return this._membershipId;
  }

  get roleId(): TenantRoleId {
    return this._roleId;
  }

  get status(): RoleAssignmentStatus {
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
   * Create a new RoleAssignment.
   *
   * Domain validates:
   * - membershipId is provided
   * - roleId is provided
   *
   * Application layer validates:
   * - Membership exists
   * - Role exists
   * - Membership.tenantId === Role.tenantId (cross-tenant protection)
   * - No duplicate assignment (UNIQUE(membership_id, role_id))
   *
   * @param membershipId - Reference to Membership
   * @param roleId - Reference to TenantRole
   * @param clock - Clock for timestamps
   * @param idGenerator - ID generator for aggregate IDs
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<RoleAssignment, DomainError>
   */
  static create(
    membershipId: MembershipId,
    roleId: TenantRoleId,
    clock: Clock,
    idGenerator: IdGenerator,
    eventIdGenerator: EventIdGenerator,
  ): Result<RoleAssignment, DomainError> {
    const now = clock.now();
    const id = new RoleAssignmentId(idGenerator.generate());

    const assignment = new RoleAssignment(
      id,
      membershipId,
      roleId,
      RoleAssignmentStatus.ACTIVE,
      now,
      now,
      0,
    );

    const event: RoleAssignmentCreatedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'roleAssignment.RoleAssignmentCreated',
      occurredAt: now,
      aggregateId: id.value,
      aggregateType: 'RoleAssignment',
      membershipId: membershipId.value,
      roleId: roleId.value,
    };

    assignment.apply(event);

    return ok(assignment);
  }

  /**
   * Reconstruct a RoleAssignment from persisted state.
   *
   * @param props - Persisted properties
   * @returns RoleAssignment
   */
  static reconstruct(props: {
    id: string;
    membershipId: string;
    roleId: string;
    status: RoleAssignmentStatus;
    createdAt: Date;
    updatedAt: Date;
    version?: number;
  }): RoleAssignment {
    return new RoleAssignment(
      new RoleAssignmentId(props.id),
      new MembershipId(props.membershipId),
      new TenantRoleId(props.roleId),
      props.status,
      props.createdAt,
      props.updatedAt,
      props.version ?? 0,
    );
  }

  // ─── Mutation Methods ─────────────────────────────────────────────────────
  /**
   * Delete a role assignment (soft deletion).
   *
   * This marks the assignment as DELETED. Application layer must handle:
   * - Authorization cache invalidation
   * - Audit logging
   * - Last-admin policy enforcement (if applicable)
   *
   * @param clock - Clock for timestamps
   * @param eventIdGenerator - Event ID generator for domain events
   * @returns Result<void, DomainError>
   */
  delete(clock: Clock, eventIdGenerator: EventIdGenerator): Result<void, DomainError> {
    if (this._status === RoleAssignmentStatus.DELETED) {
      return err(new DomainError('ASSIGNMENT_ALREADY_DELETED', 'Role assignment is already deleted'));
    }

    this._status = RoleAssignmentStatus.DELETED;
    this._updatedAt = clock.now();

    const event: RoleAssignmentDeletedEvent = {
      eventId: eventIdGenerator.generate(),
      eventName: 'roleAssignment.RoleAssignmentDeleted',
      occurredAt: this._updatedAt,
      aggregateId: this.id.value,
      aggregateType: 'RoleAssignment',
      membershipId: this._membershipId.value,
      roleId: this._roleId.value,
    };

    this.apply(event);

    return ok(undefined);
  }
}
