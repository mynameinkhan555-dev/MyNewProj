import { z } from 'zod';

export const LogoutRequestSchema = z.object({
  sessionToken: z.string().min(1, 'Session token is required'),
});

export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;

export const LogoutResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    message: z.string(),
  }),
});

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
