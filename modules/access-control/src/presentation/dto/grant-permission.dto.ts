import { z } from 'zod';

export const GrantPermissionRequestSchema = z.object({
  roleId: z.string().min(1, 'Role ID is required'),
  permissionId: z.string().min(1, 'Permission ID is required'),
});

export type GrantPermissionRequest = z.infer<typeof GrantPermissionRequestSchema>;

export const GrantPermissionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    grantId: z.string(),
    roleId: z.string(),
    permissionId: z.string(),
  }),
});

export type GrantPermissionResponse = z.infer<typeof GrantPermissionResponseSchema>;
