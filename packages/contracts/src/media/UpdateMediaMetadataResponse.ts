import { z } from 'zod';
import { MediaDtoSchema } from './MediaDto.js';

export const UpdateMediaMetadataResponseSchema = z.object({
  media: MediaDtoSchema,
});
export type UpdateMediaMetadataResponse = z.infer<typeof UpdateMediaMetadataResponseSchema>;
