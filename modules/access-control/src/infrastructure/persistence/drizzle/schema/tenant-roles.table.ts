import { pgTable, uuid, text, timestamp, index } from '@workspace/platform-database/drizzle-pg-core';

export const tenantRoles = pgTable(
  'tenant_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    key: text('key').notNull(),
    status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'DELETED'
    displayName: text('display_name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    version: timestamp('version').notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index('tenant_roles_tenant_id_idx').on(table.tenantId),
    tenantKeyIdx: index('tenant_roles_tenant_key_idx').on(table.tenantId, table.key),
  }),
);

export type TenantRole = typeof tenantRoles.$inferSelect;
export type NewTenantRole = typeof tenantRoles.$inferInsert;
