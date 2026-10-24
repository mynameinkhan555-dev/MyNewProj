import { z } from 'zod';

export const CheckPermissionRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
  permission: z.string().min(1, 'Permission is required'),
});

export type CheckPermissionRequest = z.infer<typeof CheckPermissionRequestSchema>;

export const CheckPermissionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    allowed: z.boolean(),
    userId: z.string(),
  }),
});

export type CheckPermissionResponse = z.infer<typeof CheckPermissionResponseSchema>;
