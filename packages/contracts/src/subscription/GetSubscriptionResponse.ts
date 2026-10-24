import { z } from 'zod';
import { SubscriptionDtoSchema } from './SubscriptionDto.js';

export const GetSubscriptionResponseSchema = z.object({
  subscription: SubscriptionDtoSchema,
});
export type GetSubscriptionResponse = z.infer<typeof GetSubscriptionResponseSchema>;
