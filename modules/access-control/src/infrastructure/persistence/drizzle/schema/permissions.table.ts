import { pgTable, uuid, text, timestamp, index } from '@workspace/platform-database/drizzle-pg-core';

export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull().unique(),
    scope: text('scope').notNull(), // 'TENANT' | 'PLATFORM'
    status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'DELETED'
    displayName: text('display_name').notNull(),
    description: text('description'),
    metadata: text('metadata'), // JSON string
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    version: timestamp('version').notNull().defaultNow(),
  },
  (table) => ({
    keyIdx: index('permissions_key_idx').on(table.key),
    scopeIdx: index('permissions_scope_idx').on(table.scope),
  }),
);

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
