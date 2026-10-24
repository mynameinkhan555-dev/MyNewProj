import { z } from 'zod';
import { UserRatingItemDtoSchema } from './UserRatingItemDto.js';

export const UserRatingsResponseSchema = z.array(UserRatingItemDtoSchema);
export type UserRatingsResponse = z.infer<typeof UserRatingsResponseSchema>;
