import { z } from 'zod';
import { EpisodeDtoSchema } from './EpisodeDto.js';
import { paginatedResponseSchema } from '../common/Pagination.js';

export const GetEpisodesResponseSchema = paginatedResponseSchema(EpisodeDtoSchema);
export type GetEpisodesResponse = z.infer<typeof GetEpisodesResponseSchema>;
