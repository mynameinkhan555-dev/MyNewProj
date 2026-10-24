import { z } from 'zod';
import { MediaDtoSchema } from './MediaDto.js';

export const UploadMediaResponseSchema = MediaDtoSchema;
export type UploadMediaResponse = z.infer<typeof UploadMediaResponseSchema>;
