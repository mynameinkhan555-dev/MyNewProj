import { eq, and, inArray } from 'drizzle-orm';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';
import { roleAssignments } from '../schema/role-assignments.table';
import { RoleAssignment } from '@workspace/access-control/domain/assignment/RoleAssignment';
import { RoleAssignmentId } from '@workspace/access-control/domain/assignment/RoleAssignmentId';
import type { MembershipId } from '@workspace/tenant';
import { TenantRoleId } from '@workspace/access-control/domain/role/TenantRoleId';
import type { IRoleAssignmentRepository } from '@workspace/access-control/domain/repositories/IRoleAssignmentRepository';
import { roleAssignmentToDb, dbToRoleAssignment } from '../mappers/role-assignment.mapper';

export class DrizzleRoleAssignmentRepository implements IRoleAssignmentRepository {
  constructor(private readonly context: TransactionContext) {}

  private get db() {
    return this.context.getTransaction();
  }

  async findById(id: RoleAssignmentId): Promise<RoleAssignment | null> {
    const rows = await this.db
      .select()
      .from(roleAssignments)
      .where(eq(roleAssignments.id, id.value))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return dbToRoleAssignment(rows[0]);
  }

  async findByMembershipId(membershipId: MembershipId): Promise<RoleAssignment[]> {
    const rows = await this.db
      .select()
      .from(roleAssignments)
      .where(eq(roleAssignments.membershipId, membershipId.value));

    return rows.map((row: any) => dbToRoleAssignment(row));
  }

  async findByMembershipIds(membershipIds: MembershipId[]): Promise<RoleAssignment[]> {
    if (membershipIds.length === 0) {
      return [];
    }

    const idValues = membershipIds.map((id) => id.value);
    const rows = await this.db
      .select()
      .from(roleAssignments)
      .where(inArray(roleAssignments.membershipId, idValues));

    return rows.map((row: any) => dbToRoleAssignment(row));
  }

  async findByMembershipAndRole(
    membershipId: MembershipId,
    roleId: TenantRoleId,
  ): Promise<RoleAssignment | null> {
    const rows = await this.db
      .select()
      .from(roleAssignments)
      .where(
        and(
          eq(roleAssignments.membershipId, membershipId.value),
          eq(roleAssignments.roleId, roleId.value),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return dbToRoleAssignment(rows[0]);
  }

  async findActiveByMembershipId(membershipId: MembershipId): Promise<RoleAssignment[]> {
    const rows = await this.db
      .select()
      .from(roleAssignments)
      .where(
        and(
          eq(roleAssignments.membershipId, membershipId.value),
          eq(roleAssignments.status, 'ACTIVE'),
        ),
      );

    return rows.map((row: any) => dbToRoleAssignment(row));
  }

  async insert(roleAssignment: RoleAssignment): Promise<void> {
    const dbRoleAssignment = roleAssignmentToDb(roleAssignment);
    await this.db.insert(roleAssignments).values(dbRoleAssignment);
  }

  async update(roleAssignment: RoleAssignment): Promise<void> {
    const dbRoleAssignment = roleAssignmentToDb(roleAssignment);
    await this.db
      .update(roleAssignments)
      .set(dbRoleAssignment)
      .where(eq(roleAssignments.id, roleAssignment.id.value));
  }
}
