import { z } from 'zod';
import { EpisodeDtoSchema } from './EpisodeDto.js';
import { SeasonDtoSchema } from './SeasonDto.js';
import { ContentDtoSchema } from './ContentDto.js';

export const EpisodeDetailResponseSchema = z.object({
  episode: EpisodeDtoSchema,
  season: SeasonDtoSchema,
  series: ContentDtoSchema,
});
export type EpisodeDetailResponse = z.infer<typeof EpisodeDetailResponseSchema>;
