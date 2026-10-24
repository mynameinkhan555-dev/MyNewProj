import { z } from 'zod';
import { ConnectedAccountDtoSchema } from './ConnectedAccountDto.js';

export const ListConnectionsResponseSchema = z.array(ConnectedAccountDtoSchema);
export type ListConnectionsResponse = z.infer<typeof ListConnectionsResponseSchema>;
