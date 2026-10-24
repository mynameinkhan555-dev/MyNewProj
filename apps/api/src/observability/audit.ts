import { logger } from '../middleware.js';

export interface AuditLog {
  timestamp: Date;
  userId?: string;
  tenantId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  details?: any;
}

export function logAuditEvent(event: AuditLog): void {
  logger.info({ event, tag: 'AUDIT_EVENT' });
}

export function logAuthAction(action: string, userId: string, status: 'success' | 'failure', details?: any): void {
  logAuditEvent({
    timestamp: new Date(),
    userId,
    action,
    resource: 'auth',
    status,
    details,
  });
}

export function logTenantAction(action: string, tenantId: string, userId: string, status: 'success' | 'failure', details?: any): void {
  logAuditEvent({
    timestamp: new Date(),
    userId,
    tenantId,
    action,
    resource: 'tenant',
    status,
    details,
  });
}

export function logAuthorizationAction(action: string, userId: string, tenantId: string, resource: string, resourceId: string, status: 'success' | 'failure', details?: any): void {
  logAuditEvent({
    timestamp: new Date(),
    userId,
    tenantId,
    action,
    resource,
    resourceId,
    status,
    details,
  });
}
