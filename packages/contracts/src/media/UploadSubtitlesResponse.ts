import { z } from 'zod';
import { SubtitleDtoSchema } from './SubtitleDto.js';

export const UploadSubtitlesResponseSchema = z.object({
  subtitle: SubtitleDtoSchema,
});
export type UploadSubtitlesResponse = z.infer<typeof UploadSubtitlesResponseSchema>;
