import { z } from 'zod';
import { AuthUserDtoSchema } from './AuthUserDto.js';

export const MagicLinkVerifyResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: AuthUserDtoSchema,
});
export type MagicLinkVerifyResponse = z.infer<typeof MagicLinkVerifyResponseSchema>;
