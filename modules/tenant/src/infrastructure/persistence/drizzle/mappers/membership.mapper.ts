import { Membership } from '../../../../domain/Membership';
import type { MembershipSelect, MembershipInsert } from '../schema/memberships.table';

/**
 * Mapper between Membership domain entity and persistence model
 */
export class MembershipMapper {
  static toDomain(row: MembershipSelect): Membership {
    return Membership.reconstruct({
      id: row.id,
      userId: row.userId,
      tenantId: row.tenantId,
      status: row.status as any, // MembershipStatus enum
      joinedAt: row.joinedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(membership: Membership): MembershipInsert {
    return {
      id: membership.id.value,
      userId: membership.userId.value,
      tenantId: membership.tenantId.value,
      status: membership.status,
      joinedAt: membership.joinedAt,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    };
  }
}
