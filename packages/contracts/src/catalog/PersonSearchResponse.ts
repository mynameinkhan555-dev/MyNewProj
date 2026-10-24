import { z } from 'zod';
import { PersonDtoSchema } from './PersonDto.js';

export const PersonSearchResponseSchema = z.object({
  data: z.array(PersonDtoSchema),
});
export type PersonSearchResponse = z.infer<typeof PersonSearchResponseSchema>;
