import { pgTable, uuid, text, timestamp, boolean } from '@workspace/platform-database/drizzle-pg-core';

/**
 * user_tenant_memberships table
 *
 * Domain: UserTenantMembership aggregate
 * Lifecycle: ACTIVE → INACTIVE
 *
 * Constraints:
 * - PK: id (UUID)
 * - UNIQUE: (user_id, tenant_id)
 * - CHECK: role IN ('ADMIN', 'MEMBER', 'GUEST')
 *
 * Note: Connects global User accounts to Tenant aggregates
 */
export const userTenantMemberships = pgTable('user_tenant_memberships', {
  id: uuid('id').primaryKey().notNull(),
  userId: uuid('user_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  role: text('role').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull(),
  leftAt: timestamp('left_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export type UserTenantMembershipSelect = typeof userTenantMemberships.$inferSelect;
export type UserTenantMembershipInsert = typeof userTenantMemberships.$inferInsert;
