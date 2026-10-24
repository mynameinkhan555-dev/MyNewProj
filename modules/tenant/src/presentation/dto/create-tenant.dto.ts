import { z } from 'zod';

export const CreateTenantRequestSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  slug: z.string().min(1, 'Tenant slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  industry: z.string().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
});

export type CreateTenantRequest = z.infer<typeof CreateTenantRequestSchema>;

export const CreateTenantResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    tenantId: z.string(),
    name: z.string(),
    slug: z.string(),
    membershipId: z.string(),
    role: z.string(),
  }),
});

export type CreateTenantResponse = z.infer<typeof CreateTenantResponseSchema>;
