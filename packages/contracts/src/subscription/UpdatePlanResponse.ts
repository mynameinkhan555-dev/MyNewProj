import { z } from 'zod';
import { PlanDtoSchema } from './PlanDto.js';

export const UpdatePlanResponseSchema = z.object({
  plan: PlanDtoSchema,
});
export type UpdatePlanResponse = z.infer<typeof UpdatePlanResponseSchema>;
