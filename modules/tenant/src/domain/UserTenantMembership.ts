import {
  AggregateRoot,
  Result,
  ok,
  err,
} from '@workspace/kernel';
import { UserTenantMembershipId } from './UserTenantMembershipId.js';
import { UserId } from '@workspace/identity/domain';
import { TenantId } from './TenantId.js';
import { MembershipRole } from './MembershipRole.js';
import type {
  MembershipCreatedEvent,
  MembershipRoleChangedEvent,
  MembershipDeletedEvent,
} from './events/UserTenantMembershipEvents.js';

/**
 * UserTenantMembership AggregateRoot
 *
 * Represents the relationship between a User and a Tenant.
 * One user can belong to multiple tenants with different roles.
 *
 * Aggregate invariants:
 * - Membership ID is immutable
 * - Role transitions must be valid
 * - Active membership requires valid user and tenant
 * - Deleted memberships cannot be reactivated
 */
export class UserTenantMembership extends AggregateRoot<UserTenantMembershipId> {
  protected readonly entityType = 'UserTenantMembership';

  private _userId: UserId;
  private _tenantId: TenantId;
  private _role: MembershipRole;
  private _isActive: boolean;
  private _joinedAt: Date;
  private _leftAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: UserTenantMembershipId,
    userId: UserId,
    tenantId: TenantId,
    role: MembershipRole,
    isActive: boolean,
    joinedAt: Date,
    leftAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
    version: number = 0
  ) {
    super(id, version);
    this._userId = userId;
    this._tenantId = tenantId;
    this._role = role;
    this._isActive = isActive;
    this._joinedAt = joinedAt;
    this._leftAt = leftAt;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static create(
    userId: UserId,
    tenantId: TenantId,
    role: MembershipRole = MembershipRole.MEMBER
  ): Result<UserTenantMembership, Error> {
    const now = new Date();
    const id = UserTenantMembershipId.generate();

    const membership = new UserTenantMembership(
      id,
      userId,
      tenantId,
      role,
      true,
      now,
      null,
      now,
      now
    );

    // TODO: Emit MembershipCreatedEvent
    return ok(membership);
  }

  static reconstruct(data: {
    id: string;
    userId: string;
    tenantId: string;
    role: string;
    isActive: boolean;
    joinedAt: Date;
    leftAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    version?: number;
  }): UserTenantMembership {
    return new UserTenantMembership(
      new UserTenantMembershipId(data.id),
      new UserId(data.userId),
      new TenantId(data.tenantId),
      MembershipRole.parse(data.role),
      data.isActive,
      data.joinedAt,
      data.leftAt,
      data.createdAt,
      data.updatedAt,
      data.version
    );
  }

  // Getters
  get userId(): UserId {
    return this._userId;
  }

  get tenantId(): TenantId {
    return this._tenantId;
  }

  get role(): MembershipRole {
    return this._role;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get joinedAt(): Date {
    return this._joinedAt;
  }

  get leftAt(): Date | null {
    return this._leftAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Domain logic
  changeRole(newRole: MembershipRole): Result<void, Error> {
    if (!this._isActive) {
      return err(new Error('Cannot change role of inactive membership'));
    }

    if (this._role === newRole) {
      return ok(undefined);
    }

    this._role = newRole;
    this._updatedAt = new Date();

    // TODO: Emit MembershipRoleChangedEvent
    return ok(undefined);
  }

  leave(): Result<void, Error> {
    if (!this._isActive) {
      return err(new Error('Membership is already inactive'));
    }

    this._isActive = false;
    this._leftAt = new Date();
    this._updatedAt = new Date();

    // TODO: Emit MembershipDeletedEvent
    return ok(undefined);
  }
}
