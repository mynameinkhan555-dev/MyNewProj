import { pgTable, uuid, text, timestamp } from '@workspace/platform-database/drizzle-pg-core';

/**
 * users table
 * 
 * Domain: User aggregate
 * Lifecycle: ACTIVE → SUSPENDED → DELETED
 * 
 * Constraints:
 * - PK: id (UUID)
 * - CHECK: status IN ('ACTIVE', 'SUSPENDED', 'DELETED') (added manually in migration)
 * 
 * Note: No FK constraints - User is a root aggregate
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
