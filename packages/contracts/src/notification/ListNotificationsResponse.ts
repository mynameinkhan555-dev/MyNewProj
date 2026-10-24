import { z } from 'zod';
import { paginatedResponseSchema } from '../common/Pagination.js';
import { NotificationDtoSchema } from './NotificationDto.js';

export const ListNotificationsResponseSchema = paginatedResponseSchema(NotificationDtoSchema);
export type ListNotificationsResponse = z.infer<typeof ListNotificationsResponseSchema>;
