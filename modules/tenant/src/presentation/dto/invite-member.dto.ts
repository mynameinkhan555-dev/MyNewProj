import { z } from 'zod';

export const InviteMemberRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
});

export type InviteMemberRequest = z.infer<typeof InviteMemberRequestSchema>;

export const InviteMemberResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    invitationId: z.string(),
    email: z.string(),
    role: z.string(),
    expiresAt: z.string(),
  }),
});

export type InviteMemberResponse = z.infer<typeof InviteMemberResponseSchema>;
