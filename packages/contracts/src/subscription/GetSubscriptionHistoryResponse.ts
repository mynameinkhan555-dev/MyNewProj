import { z } from 'zod';
import { paginatedResponseSchema } from '../common/Pagination.js';
import { SubscriptionDtoSchema } from './SubscriptionDto.js';

export const GetSubscriptionHistoryResponseSchema = paginatedResponseSchema(SubscriptionDtoSchema);
export type GetSubscriptionHistoryResponse = z.infer<typeof GetSubscriptionHistoryResponseSchema>;
