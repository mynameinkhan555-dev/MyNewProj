import { z } from 'zod';
import { CollectionDtoSchema } from './CollectionDto.js';
import { ContentDtoSchema } from './ContentDto.js';

export const CollectionDetailResponseSchema = z.object({
  collection: CollectionDtoSchema,
  items: z.array(ContentDtoSchema),
});
export type CollectionDetailResponse = z.infer<typeof CollectionDetailResponseSchema>;
