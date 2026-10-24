import { pgTable, uuid, text, timestamp, boolean } from '@workspace/platform-database/drizzle-pg-core';
import { users } from './users.table';

/**
 * external_identities table
 * 
 * Domain: ExternalIdentity aggregate
 * 
 * Constraints:
 * - PK: id (UUID)
 * - FK: user_id → users.id ON DELETE RESTRICT
 * - UNIQUE: (provider, provider_subject) (added manually in migration)
 * - INDEX: user_id (added manually in migration)
 * 
 * Note: No cascade - Application orchestrates deletion
 */
export const externalIdentities = pgTable('external_identities', {
  id: uuid('id').primaryKey().notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  provider: text('provider').notNull(),
  providerSubject: text('provider_subject').notNull(),
  identityVerifiedAt: timestamp('identity_verified_at', { withTimezone: true }).notNull(),
  providerEmail: text('provider_email'),
  providerEmailVerified: boolean('provider_email_verified'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export type ExternalIdentitySelect = typeof externalIdentities.$inferSelect;
export type ExternalIdentityInsert = typeof externalIdentities.$inferInsert;
