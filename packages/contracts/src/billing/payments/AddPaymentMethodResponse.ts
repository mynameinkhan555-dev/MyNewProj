import { z } from 'zod';
import { PaymentMethodDtoSchema } from './PaymentMethodDto.js';

export const AddPaymentMethodResponseSchema = z.object({
  paymentMethod: PaymentMethodDtoSchema,
});
export type AddPaymentMethodResponse = z.infer<typeof AddPaymentMethodResponseSchema>;
