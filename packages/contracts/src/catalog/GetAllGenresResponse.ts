import { z } from 'zod';
import { GenreDtoSchema } from './GenreDto.js';

export const GetAllGenresResponseSchema = z.array(GenreDtoSchema);
export type GetAllGenresResponse = z.infer<typeof GetAllGenresResponseSchema>;
