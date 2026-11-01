import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'
import { getRequestContext } from './request-context'

export interface RecordAuditEventParams {
  eventType: string;
  resourceType: string;
  resourceId?: string;
  action: string;
  actorId?: string;
  schoolId?: string;
  actorRole?: string;
  ipHash?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function recordAuditEvent(params: RecordAuditEventParams) {
  const ctx = getRequestContext();

  try {
    await db.insert(auditLogs).values({
      eventType: params.eventType,
      resourceType: params.resourceType,
      resourceId: params.resourceId || null,
      action: params.action,
      actorId: params.actorId || ctx?.userId || null,
      schoolId: params.schoolId || ctx?.schoolId || null,
      actorRole: params.actorRole || ctx?.role || null,
      requestId: ctx?.requestId || null,
      ipHash: params.ipHash || null,
      userAgent: params.userAgent || null,
      metadata: params.metadata || {},
    });
  } catch (error) {
    console.warn('Failed to insert audit log record:', error);
  }
}
