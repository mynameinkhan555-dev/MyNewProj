import { z } from 'zod';
import { paginatedResponseSchema } from '../../common/Pagination.js';
import { InvoiceDtoSchema } from './InvoiceDto.js';

export const ListInvoicesResponseSchema = paginatedResponseSchema(InvoiceDtoSchema);
export type ListInvoicesResponse = z.infer<typeof ListInvoicesResponseSchema>;
