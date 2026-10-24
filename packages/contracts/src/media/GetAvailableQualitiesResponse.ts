import { z } from 'zod';
import { QualityDtoSchema } from './QualityDto.js';

export const GetAvailableQualitiesResponseSchema = z.array(QualityDtoSchema);
export type GetAvailableQualitiesResponse = z.infer<typeof GetAvailableQualitiesResponseSchema>;
