import { z } from 'zod';

export const VerifyEmailRequestSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

export const VerifyEmailResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    userId: z.string(),
    email: z.string(),
    isEmailVerified: z.boolean(),
  }),
});

export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponseSchema>;
