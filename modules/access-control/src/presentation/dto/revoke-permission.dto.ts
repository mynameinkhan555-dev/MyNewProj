import { z } from 'zod';

export const RevokePermissionRequestSchema = z.object({
  roleId: z.string().min(1, 'Role ID is required'),
  permissionId: z.string().min(1, 'Permission ID is required'),
});

export type RevokePermissionRequest = z.infer<typeof RevokePermissionRequestSchema>;

export const RevokePermissionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    message: z.string(),
  }),
});

export type RevokePermissionResponse = z.infer<typeof RevokePermissionResponseSchema>;
