import { z } from 'zod';
import { UpdateContentRequestSchema } from './UpdateContentRequest.js';

export const BulkUpdateContentRequestSchema = z.object({
  ids: z.array(z.string()),
  data: UpdateContentRequestSchema,
});

export type BulkUpdateContentRequest = z.infer<typeof BulkUpdateContentRequestSchema>;
