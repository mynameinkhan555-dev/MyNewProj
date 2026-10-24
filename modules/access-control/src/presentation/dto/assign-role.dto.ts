import { z } from 'zod';

export const AssignRoleRequestSchema = z.object({
  membershipId: z.string().min(1, 'Membership ID is required'),
  roleId: z.string().min(1, 'Role ID is required'),
});

export type AssignRoleRequest = z.infer<typeof AssignRoleRequestSchema>;

export const AssignRoleResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    assignmentId: z.string(),
    membershipId: z.string(),
    roleId: z.string(),
  }),
});

export type AssignRoleResponse = z.infer<typeof AssignRoleResponseSchema>;
