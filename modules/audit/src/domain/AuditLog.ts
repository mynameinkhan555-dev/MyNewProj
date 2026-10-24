import { ActivityType } from './ActivityType.js';

export interface AuditLog {
  id: string;
  userId: string;
  action: ActivityType;
  resource: string;
  resourceId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
