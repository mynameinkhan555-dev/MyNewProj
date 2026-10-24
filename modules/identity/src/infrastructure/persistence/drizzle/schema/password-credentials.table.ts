import { pgTable, uuid, text, timestamp } from '@workspace/platform-database/drizzle-pg-core';
import { users } from './users.table';

/**
 * password_credentials table
 * 
 * Domain: PasswordCredential aggregate
 * 
 * Constraints:
 * - PK: id (UUID)
 * - FK: user_id → users.id ON DELETE RESTRICT
 * - UNIQUE: user_id (at most one password per user) (added manually in migration)
 * 
 * Note: No cascade - Application orchestrates deletion
 */
export const passwordCredentials = pgTable('password_credentials', {
  id: uuid('id').primaryKey().notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  hashedPassword: text('hashed_password').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export type PasswordCredentialSelect = typeof passwordCredentials.$inferSelect;
export type PasswordCredentialInsert = typeof passwordCredentials.$inferInsert;
