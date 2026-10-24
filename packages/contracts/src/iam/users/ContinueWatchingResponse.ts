import { z } from 'zod';
import { ContinueWatchingItemDtoSchema } from './ContinueWatchingItemDto.js';

export const ContinueWatchingResponseSchema = z.array(ContinueWatchingItemDtoSchema);
export type ContinueWatchingResponse = z.infer<typeof ContinueWatchingResponseSchema>;
