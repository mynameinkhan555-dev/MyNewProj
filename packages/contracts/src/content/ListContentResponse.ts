import { z } from 'zod';
import { paginatedResponseSchema } from '../common/Pagination.js';
import { ContentDtoSchema } from './ContentDto.js';

export const ListContentResponseSchema = paginatedResponseSchema(ContentDtoSchema);

export type ListContentResponse = z.infer<typeof ListContentResponseSchema>;
