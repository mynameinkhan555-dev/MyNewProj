import { RoleAssignment } from '../../../../src/domain/assignment/RoleAssignment.js';
import type { RoleAssignmentSelect, RoleAssignmentInsert } from '../schema/role-assignments.table.js';

/**
 * Mapper between RoleAssignment domain entity and persistence model
 */
export class RoleAssignmentMapper {
  static toDomain(row: RoleAssignmentSelect): RoleAssignment {
    return RoleAssignment.reconstruct({
      id: row.id,
      membershipId: row.membershipId,
      roleId: row.roleId,
      status: row.status as any, // RoleAssignmentStatus enum
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(roleAssignment: RoleAssignment): RoleAssignmentInsert {
    return {
      id: roleAssignment.id.value,
      membershipId: roleAssignment.membershipId.value,
      roleId: roleAssignment.roleId.value,
      status: roleAssignment.status,
      createdAt: roleAssignment.createdAt,
      updatedAt: roleAssignment.updatedAt,
    };
  }
}
