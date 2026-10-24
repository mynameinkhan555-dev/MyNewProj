import { z } from 'zod';
import { paginatedResponseSchema } from '../common/Pagination.js';
import { TransactionDtoSchema } from './TransactionDto.js';

export const ListTransactionsResponseSchema = paginatedResponseSchema(TransactionDtoSchema);
export type ListTransactionsResponse = z.infer<typeof ListTransactionsResponseSchema>;
