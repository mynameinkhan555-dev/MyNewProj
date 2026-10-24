import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    userId: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    sessionToken: z.string(),
    expiresAt: z.string(),
  }),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
