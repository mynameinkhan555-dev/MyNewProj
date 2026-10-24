import { z } from 'zod';
import { LikedContentItemDtoSchema } from './LikedContentItemDto.js';

export const LikedContentResponseSchema = z.array(LikedContentItemDtoSchema);
export type LikedContentResponse = z.infer<typeof LikedContentResponseSchema>;
