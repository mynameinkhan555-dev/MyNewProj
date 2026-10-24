import { z } from 'zod';
import { SeasonDtoSchema } from './SeasonDto.js';

export const GetSeasonsResponseSchema = z.array(SeasonDtoSchema);
export type GetSeasonsResponse = z.infer<typeof GetSeasonsResponseSchema>;
