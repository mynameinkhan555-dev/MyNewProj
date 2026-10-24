import { z } from 'zod';
import { paginatedResponseSchema } from '../../common/Pagination.js';
import { SubscriptionDtoSchema } from './SubscriptionDto.js';

export const ListSubscriptionsResponseSchema = paginatedResponseSchema(SubscriptionDtoSchema);
export type ListSubscriptionsResponse = z.infer<typeof ListSubscriptionsResponseSchema>;
