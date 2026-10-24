import { pgTable, uuid, text, timestamp, boolean, index } from '@workspace/platform-database/drizzle-pg-core';
import { users } from './users.table';

/**
 * email_identities table
 * 
 * Domain: EmailIdentity aggregate
 * 
 * Constraints:
 * - PK: id (UUID)
 * - FK: user_id → users.id ON DELETE RESTRICT
 * - UNIQUE: email
 * - PARTIAL UNIQUE: user_id WHERE primary = TRUE (added manually in migration)
 * 
 * Note: No cascade - Application orchestrates deletion
 */
export const emailIdentities = pgTable('email_identities', {
  id: uuid('id').primaryKey().notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  email: text('email').notNull().unique(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  primary: boolean('primary').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
}, (table) => ({
  userIdIndex: index('idx_email_identities_user_id').on(table.userId),
}));

export type EmailIdentitySelect = typeof emailIdentities.$inferSelect;
export type EmailIdentityInsert = typeof emailIdentities.$inferInsert;
