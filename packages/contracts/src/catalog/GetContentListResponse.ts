import { z } from 'zod';
import { ContentDtoSchema } from './ContentDto.js';
import { paginatedResponseSchema } from '../common/Pagination.js';

export const GetContentListResponseSchema = paginatedResponseSchema(ContentDtoSchema);
export type GetContentListResponse = z.infer<typeof GetContentListResponseSchema>;
