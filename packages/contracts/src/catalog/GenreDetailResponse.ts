import { z } from 'zod';
import { GenreDtoSchema } from './GenreDto.js';
import { ContentDtoSchema } from './ContentDto.js';

export const GenreDetailResponseSchema = z.object({
  genre: GenreDtoSchema,
  content: z.array(ContentDtoSchema),
});
export type GenreDetailResponse = z.infer<typeof GenreDetailResponseSchema>;
