import { z } from 'zod';
import { CastMemberDtoSchema } from './CastMemberDto.js';

export const GetCastResponseSchema = z.array(CastMemberDtoSchema);
export type GetCastResponse = z.infer<typeof GetCastResponseSchema>;
