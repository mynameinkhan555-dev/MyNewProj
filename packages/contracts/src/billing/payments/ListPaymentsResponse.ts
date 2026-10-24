import { z } from 'zod';
import { paginatedResponseSchema } from '../../common/Pagination.js';
import { PaymentDtoSchema } from './PaymentDto.js';

export const ListPaymentsResponseSchema = paginatedResponseSchema(PaymentDtoSchema);
export type ListPaymentsResponse = z.infer<typeof ListPaymentsResponseSchema>;
