import { z } from 'zod';

export const AcceptInvitationRequestSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type AcceptInvitationRequest = z.infer<typeof AcceptInvitationRequestSchema>;

export const AcceptInvitationResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    userId: z.string(),
    membershipId: z.string(),
    tenantId: z.string(),
    role: z.string(),
  }),
});

export type AcceptInvitationResponse = z.infer<typeof AcceptInvitationResponseSchema>;
