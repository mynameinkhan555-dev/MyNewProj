import { pgTable, uuid, text, timestamp } from '@workspace/platform-database/drizzle-pg-core';
import { users } from '@workspace/identity/infrastructure/persistence/drizzle/schema';
import { tenants } from './tenants.table';

/**
 * memberships table
 *
 * Domain: Membership aggregate
 * Lifecycle: ACTIVE → DELETED
 *
 * Constraints:
 * - PK: id (UUID)
 * - FK: user_id → users.id ON DELETE RESTRICT
 * - FK: tenant_id → tenants.id ON DELETE RESTRICT
 * - PARTIAL UNIQUE: (user_id, tenant_id) WHERE status = 'ACTIVE' (added manually in migration)
 *
 * Note: No role_id, no permissions - Authorization is separate layer
 * Note: No cascade - Application orchestrates deletion
 */
export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  status: text('status').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export type MembershipSelect = typeof memberships.$inferSelect;
export type MembershipInsert = typeof memberships.$inferInsert;
