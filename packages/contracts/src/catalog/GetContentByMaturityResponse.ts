import { z } from 'zod';
import { ContentDtoSchema } from './ContentDto.js';
import { paginatedResponseSchema } from '../common/Pagination.js';

export const GetContentByMaturityResponseSchema = paginatedResponseSchema(ContentDtoSchema);
export type GetContentByMaturityResponse = z.infer<typeof GetContentByMaturityResponseSchema>;
