import { z } from 'zod';
import { PlanDtoSchema } from './PlanDto.js';

export const CreatePlanResponseSchema = z.object({
  plan: PlanDtoSchema,
});
export type CreatePlanResponse = z.infer<typeof CreatePlanResponseSchema>;
