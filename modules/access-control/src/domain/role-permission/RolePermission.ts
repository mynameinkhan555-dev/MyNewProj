import { TenantRoleId } from '../role/TenantRoleId.js';
import { PermissionId } from '../permission/PermissionId.js';

/**
 * RolePermission - relationship model between TenantRole and Permission.
 *
 * This is NOT an AggregateRoot or Entity. It's a persistence relationship model.
 *
 * Relationship:
 * TenantRole ↔ Permission
 *
 * Model:
 * ┌──────────────┐
 * │  TenantRole  │
 * └──────┬───────┘
 *        │ roleId
 *        ▼
 * ┌──────────────┐
 * │RolePermission│ (relationship)
 * ├──────────────┤
 * │ roleId       │
 * │ permissionId │
 * │ createdAt    │
 * └──────┬───────┘
 *        │ permissionId
 *        ▼
 * ┌──────────────┐
 * │  Permission  │
 * └──────────────┘
 *
 * Important design decisions:
 * - NO id (composite PK: role_id + permission_id in DB)
 * - NO status (relationship either exists or doesn't)
 * - NO updatedAt (relationship immutable once created)
 * - NO own domain events (grant/revoke are Application Use Case operations)
 * - NOT part of TenantRole aggregate boundary
 * - NOT AggregateRoot
 * - NOT Entity
 *
 * Lifecycle:
 * Grant → INSERT relationship
 * Revoke → DELETE relationship
 *
 * Business semantics:
 * Grant: "Role R1 now has capability P1"
 * Revoke: "Role R1 no longer has capability P1"
 *
 * These are Application/Use Case operations, not Domain aggregate mutations.
 * Security events (RolePermissionGranted, RolePermissionRevoked) are emitted
 * at Application/Outbox level, not as TenantRole domain events.
 *
 * Audit: createdAt records when permission was granted to role.
 */
export interface RolePermission {
  roleId: TenantRoleId;
  permissionId: PermissionId;
  createdAt: Date;
}

/**
 * Create a RolePermission relationship.
 *
 * @param roleId - TenantRole ID
 * @param permissionId - Permission ID
 * @param createdAt - When permission was granted
 * @returns RolePermission
 */
export function createRolePermission(
  roleId: TenantRoleId,
  permissionId: PermissionId,
  createdAt: Date,
): RolePermission {
  return {
    roleId,
    permissionId,
    createdAt,
  };
}
