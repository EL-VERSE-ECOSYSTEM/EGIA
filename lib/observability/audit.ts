import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { createHash } from 'node:crypto'

export type AuditEvent = {
  actorId?: string | null
  schoolId?: string | null
  eventType: string
  resourceType?: string | null
  resourceId?: string | null
  ip?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown>
}

function hashIp(ip?: string | null) {
  if (!ip) return null
  const salt = process.env.AUDIT_IP_SALT
  if (!salt) return null
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

export async function audit(event: AuditEvent) {
  await db.execute(sql`
    insert into public.egia_audit_log
      (actor_id, school_id, event_type, resource_type, resource_id, ip_hash, user_agent, metadata)
    values
      (${event.actorId ?? null}, ${event.schoolId ?? null}, ${event.eventType},
       ${event.resourceType ?? null}, ${event.resourceId ?? null}, ${hashIp(event.ip)},
       ${event.userAgent?.slice(0, 1000) ?? null}, ${JSON.stringify(event.metadata ?? {})}::jsonb)
  `)
}
