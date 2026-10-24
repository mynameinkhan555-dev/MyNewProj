import { z } from 'zod';
import { HistoryItemDtoSchema } from './HistoryItemDto.js';
import { paginatedResponseSchema } from '../common/Pagination.js';

export const GetWatchHistoryResponseSchema = paginatedResponseSchema(HistoryItemDtoSchema);
export type GetWatchHistoryResponse = z.infer<typeof GetWatchHistoryResponseSchema>;
