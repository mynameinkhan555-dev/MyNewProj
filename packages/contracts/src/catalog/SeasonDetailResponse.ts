import { z } from 'zod';
import { SeasonDtoSchema } from './SeasonDto.js';
import { EpisodeDtoSchema } from './EpisodeDto.js';

export const SeasonDetailResponseSchema = z.object({
  season: SeasonDtoSchema,
  episodes: z.array(EpisodeDtoSchema),
});
export type SeasonDetailResponse = z.infer<typeof SeasonDetailResponseSchema>;
