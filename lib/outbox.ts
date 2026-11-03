import { db } from '@/lib/db'
import { outboxEvents } from '@/lib/db/schema'
import { eq, and, lte } from 'drizzle-orm'

export interface CreateOutboxEventParams {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  schoolId?: string | null;
  payload?: Record<string, any>;
  availableAt?: Date;
}

/**
 * Enqueues a persistent outbox event.
 * Can be executed within a transaction to guarantee atomic business operation + event commit.
 */
export async function enqueueOutboxEvent(
  params: CreateOutboxEventParams,
  tx?: any
) {
  const client = tx || db
  const [event] = await client
    .insert(outboxEvents)
    .values({
      eventType: params.eventType,
      aggregateType: params.aggregateType,
      aggregateId: params.aggregateId,
      schoolId: params.schoolId || null,
      payload: params.payload || {},
      status: 'PENDING',
      attempts: 0,
      availableAt: params.availableAt || new Date(),
    })
    .returning()

  return event
}

/**
 * Fetches pending outbox events available for dispatch.
 */
export async function fetchPendingOutboxEvents(limit = 50) {
  const now = new Date()
  return await db
    .select()
    .from(outboxEvents)
    .where(and(eq(outboxEvents.status, 'PENDING'), lte(outboxEvents.availableAt, now)))
    .limit(limit)
}

/**
 * Marks an outbox event as COMPLETED.
 */
export async function markOutboxEventProcessed(eventId: string) {
  await db
    .update(outboxEvents)
    .set({
      status: 'COMPLETED',
      processedAt: new Date(),
    })
    .where(eq(outboxEvents.id, eventId))
}

/**
 * Records an error and schedules retry with exponential backoff or marks FAILED.
 */
export async function failOutboxEvent(eventId: string, errorMsg: string, maxAttempts = 5) {
  const [event] = await db
    .select()
    .from(outboxEvents)
    .where(eq(outboxEvents.id, eventId))
    .limit(1)

  if (!event) return

  const attempts = event.attempts + 1
  const isFailed = attempts >= maxAttempts
  const backoffSec = Math.pow(2, attempts) * 5 // 10s, 20s, 40s...
  const nextAvailable = new Date(Date.now() + backoffSec * 1000)

  await db
    .update(outboxEvents)
    .set({
      attempts,
      status: isFailed ? 'FAILED' : 'PENDING',
      lastError: errorMsg,
      availableAt: isFailed ? event.availableAt : nextAvailable,
    })
    .where(eq(outboxEvents.id, eventId))
}
