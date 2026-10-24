import { z } from 'zod';
import { SubscriptionDtoSchema } from './SubscriptionDto.js';

export const GetCurrentSubscriptionResponseSchema = SubscriptionDtoSchema;
export type GetCurrentSubscriptionResponse = z.infer<typeof GetCurrentSubscriptionResponseSchema>;
