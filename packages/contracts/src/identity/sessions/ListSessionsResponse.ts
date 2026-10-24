import { z } from 'zod';
import { SessionDtoSchema } from './SessionDto.js';

export const ListSessionsResponseSchema = z.array(SessionDtoSchema);
export type ListSessionsResponse = z.infer<typeof ListSessionsResponseSchema>;
