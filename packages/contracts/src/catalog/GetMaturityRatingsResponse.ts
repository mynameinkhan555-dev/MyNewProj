import { z } from 'zod';
import { MaturityRatingDtoSchema } from './MaturityRatingDto.js';

export const GetMaturityRatingsResponseSchema = z.array(MaturityRatingDtoSchema);
export type GetMaturityRatingsResponse = z.infer<typeof GetMaturityRatingsResponseSchema>;
