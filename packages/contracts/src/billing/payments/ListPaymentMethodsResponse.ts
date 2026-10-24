import { z } from 'zod';
import { PaymentMethodDtoSchema } from './PaymentMethodDto.js';

export const ListPaymentMethodsResponseSchema = z.array(PaymentMethodDtoSchema);
export type ListPaymentMethodsResponse = z.infer<typeof ListPaymentMethodsResponseSchema>;
