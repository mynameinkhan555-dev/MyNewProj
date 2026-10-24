import { pgTable, uuid, text, timestamp, index } from '@workspace/platform-database/drizzle-pg-core';
import { users } from './users.table';

/**
 * sessions table
 * 
 * Domain: Session aggregate
 * 
 * Constraints:
 * - PK: id (UUID)
 * - FK: user_id → users.id ON DELETE RESTRICT
 * 
 * Security model:
 * - refreshTokenHash: hashed refresh token (never plaintext)
 * - revokedAt: nullable - if not null, session is revoked
 * - isValid = (revokedAt IS NULL) AND (expiresAt > NOW())
 * 
 * Note: No tenant_id - Session is identity-centric, not tenant-centric
 * Note: No cascade - Application orchestrates deletion
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
}, (table) => ({
  userIdIndex: index('idx_sessions_user_id').on(table.userId),
  expiresAtIndex: index('idx_sessions_expires_at').on(table.expiresAt),
}));

export type SessionSelect = typeof sessions.$inferSelect;
export type SessionInsert = typeof sessions.$inferInsert;
