import { eq, and } from 'drizzle-orm';
import type { IRoleAssignmentRepository } from '../../../../src/domain/repositories/IRoleAssignmentRepository.js';
import { RoleAssignment } from '../../../../src/domain/assignment/RoleAssignment.js';
import { RoleAssignmentId } from '../../../../src/domain/assignment/RoleAssignmentId.js';
import { MembershipId } from '@workspace/tenant';
import { TenantRoleId } from '../../../../src/domain/role/TenantRoleId.js';
import { PersistenceNotFoundError } from '@workspace/platform-database/persistence';
import { roleAssignments } from '../schema/role-assignments.table.js';
import { RoleAssignmentMapper } from '../mappers/role-assignment.mapper.js';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';

/**
 * Drizzle RoleAssignment Repository Implementation (Infrastructure Layer)
 *
 * Implements IRoleAssignmentRepository port using Drizzle ORM.
 *
 * Transaction binding:
 * - Receives TransactionContext via constructor
 * - All operations use context.getTransaction()
 * - TransactionContext throws if inactive (enforces transaction boundary)
 *
 * Error handling:
 * - PostgreSQL constraint violations are mapped by DrizzleUnitOfWork
 * - UPDATE 0 rows → PersistenceNotFoundError
 */
export class DrizzleRoleAssignmentRepository implements IRoleAssignmentRepository {
  constructor(private readonly context: TransactionContext) {}

  async findById(id: RoleAssignmentId): Promise<RoleAssignment | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(roleAssignments)
      .where(eq(roleAssignments.id, id.value))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return RoleAssignmentMapper.toDomain(rows[0]);
  }

  async findByMembershipId(membershipId: MembershipId): Promise<RoleAssignment[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(roleAssignments)
      .where(eq(roleAssignments.membershipId, membershipId.value));
    return rows.map(RoleAssignmentMapper.toDomain);
  }

  async findByMembershipAndRole(
    membershipId: MembershipId,
    roleId: TenantRoleId,
  ): Promise<RoleAssignment | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(roleAssignments)
      .where(
        and(
          eq(roleAssignments.membershipId, membershipId.value),
          eq(roleAssignments.roleId, roleId.value)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return RoleAssignmentMapper.toDomain(rows[0]);
  }

  async findActiveByMembershipId(membershipId: MembershipId): Promise<RoleAssignment[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(roleAssignments)
      .where(
        and(
          eq(roleAssignments.membershipId, membershipId.value),
          eq(roleAssignments.status, 'ACTIVE')
        )
      );
    return rows.map(RoleAssignmentMapper.toDomain);
  }

  async insert(roleAssignment: RoleAssignment): Promise<void> {
    const db = this.context.getTransaction();
    const row = RoleAssignmentMapper.toPersistence(roleAssignment);
    await db.insert(roleAssignments).values(row);
  }

  async update(roleAssignment: RoleAssignment): Promise<void> {
    const db = this.context.getTransaction();
    const row = RoleAssignmentMapper.toPersistence(roleAssignment);
    const result = await db
      .update(roleAssignments)
      .set(row)
      .where(eq(roleAssignments.id, roleAssignment.id.value))
      .returning();

    if (result.length === 0) {
      throw new PersistenceNotFoundError('RoleAssignment', roleAssignment.id.value);
    }
  }
}
