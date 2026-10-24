import { z } from 'zod';
import { ContentDtoSchema } from './ContentDto.js';

export const ContentListResponseSchema = z.object({
  data: z.array(ContentDtoSchema),
});
export type ContentListResponse = z.infer<typeof ContentListResponseSchema>;
