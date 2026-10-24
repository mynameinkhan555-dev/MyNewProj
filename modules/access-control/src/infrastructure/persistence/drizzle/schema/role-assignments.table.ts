import { pgTable, uuid, text, timestamp, index } from '@workspace/platform-database/drizzle-pg-core';

export const roleAssignments = pgTable(
  'role_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    membershipId: uuid('membership_id').notNull(),
    roleId: uuid('role_id').notNull(),
    status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'DELETED'
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    version: timestamp('version').notNull().defaultNow(),
  },
  (table) => ({
    membershipIdIdx: index('role_assignments_membership_id_idx').on(table.membershipId),
    roleIdIdx: index('role_assignments_role_id_idx').on(table.roleId),
    membershipRoleIdx: index('role_assignments_membership_role_idx').on(table.membershipId, table.roleId),
  }),
);

export type RoleAssignment = typeof roleAssignments.$inferSelect;
export type NewRoleAssignment = typeof roleAssignments.$inferInsert;
