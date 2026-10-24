import { z } from 'zod';
import { ExtraDtoSchema } from './ExtraDto.js';

export const GetExtrasResponseSchema = z.array(ExtraDtoSchema);
export type GetExtrasResponse = z.infer<typeof GetExtrasResponseSchema>;
