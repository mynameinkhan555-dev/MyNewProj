import { z } from 'zod';
import { PersonDtoSchema } from './PersonDto.js';
import { ContentDtoSchema } from './ContentDto.js';

export const PersonDetailResponseSchema = z.object({
  person: PersonDtoSchema,
  filmography: z.array(ContentDtoSchema),
});
export type PersonDetailResponse = z.infer<typeof PersonDetailResponseSchema>;
