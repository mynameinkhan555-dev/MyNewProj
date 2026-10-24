import { z } from 'zod';
import { CollectionDtoSchema } from './CollectionDto.js';

export const GetCollectionsResponseSchema = z.array(CollectionDtoSchema);
export type GetCollectionsResponse = z.infer<typeof GetCollectionsResponseSchema>;
