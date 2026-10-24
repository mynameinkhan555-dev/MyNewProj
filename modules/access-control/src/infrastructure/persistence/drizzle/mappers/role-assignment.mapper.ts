import { RoleAssignment } from '@workspace/access-control/domain/assignment/RoleAssignment.js';
import type { RoleAssignmentStatus } from '@workspace/access-control/domain/assignment/index.js';
import type { NewRoleAssignment } from '../schema/role-assignments.table.js';

export function roleAssignmentToDb(roleAssignment: RoleAssignment): NewRoleAssignment {
  return {
    id: roleAssignment.id.value,
    membershipId: roleAssignment.membershipId.value,
    roleId: roleAssignment.roleId.value,
    status: roleAssignment.status as string,
    createdAt: roleAssignment.createdAt,
    updatedAt: roleAssignment.updatedAt,
    version: new Date(), // Version as timestamp
  };
}

export function dbToRoleAssignment(row: {
  id: string;
  membershipId: string;
  roleId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  version: Date;
}): RoleAssignment {
  const status = row.status as RoleAssignmentStatus;

  return RoleAssignment.reconstruct({
    id: row.id,
    membershipId: row.membershipId,
    roleId: row.roleId,
    status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
