import { z } from 'zod';
import { TranscodeDtoSchema } from './TranscodeDtoSchema.js';

export const GetTranscodesResponseSchema = z.array(TranscodeDtoSchema);
export type GetTranscodesResponse = z.infer<typeof GetTranscodesResponseSchema>;
