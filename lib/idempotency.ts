import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { idempotencyKeys } from '@/lib/db/schema'
import { eq, and, gt, lte, type SQL } from 'drizzle-orm'

export interface IdempotencyCheckResult<T = unknown> {
  isDuplicate: boolean;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'NEW';
  payloadMismatch?: boolean;
  cachedResponse?: T;
}

/**
 * Computes deterministic SHA-256 hash of a request payload or parameters.
 */
export function hashPayload(payload: unknown): string {
  if (payload === undefined || payload === null) return ''
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload)
  if (serialized === undefined) throw new Error('Idempotency payload must be JSON serializable.')
  return createHash('sha256').update(serialized).digest('hex')
}

export function matchesIdempotencyRequest(
  existing: { operation: string; requestHash: string | null },
  operation: string,
  requestHash: string,
): boolean {
  return existing.operation === operation && (!existing.requestHash || existing.requestHash === requestHash)
}

/**
 * Checks an idempotency key atomically.
 * If key does not exist or has expired, creates a new PENDING record and returns isDuplicate: false.
 * If key exists and is COMPLETED, returns cached response.
 * If key exists and is PENDING, indicates processing is in-flight until its lease expires.
 */
export async function checkOrAcquireIdempotency<T = unknown>(
  key: string,
  operation: string,
  payload?: unknown,
  ttlHours = 24,
  pendingLeaseMinutes = 5,
): Promise<IdempotencyCheckResult<T>> {
  const requestHash = hashPayload(payload)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000)
  const pendingLeaseStartedAt = new Date(now.getTime() - pendingLeaseMinutes * 60 * 1000)
  const values = { key, operation, requestHash, status: 'PENDING', expiresAt }
  const [inserted] = await db.insert(idempotencyKeys)
    .values(values)
    .onConflictDoNothing()
    .returning()
  if (inserted) return { isDuplicate: false, status: 'NEW' }

  let [record] = await db.select()
    .from(idempotencyKeys)
    .where(eq(idempotencyKeys.key, key))
    .limit(1)
  if (!record) {
    const [retryInsert] = await db.insert(idempotencyKeys)
      .values(values)
      .onConflictDoNothing()
      .returning()
    if (retryInsert) return { isDuplicate: false, status: 'NEW' }
    const refreshedRecords = await db.select()
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, key))
      .limit(1)
    record = refreshedRecords[0]
  }

  if (!record) throw new Error('The idempotency record could not be loaded.')

  const duplicateResult = (): IdempotencyCheckResult<T> => ({
    isDuplicate: true,
    status: record.status as IdempotencyCheckResult['status'],
    cachedResponse: record.response as T,
  })
  const payloadMismatchResult = (): IdempotencyCheckResult<T> => ({
    ...duplicateResult(),
    payloadMismatch: true,
  })

  if (!matchesIdempotencyRequest(record, operation, requestHash)) {
    return payloadMismatchResult()
  }

  let reclaimCondition: SQL | undefined
  if (record.expiresAt <= now) {
    reclaimCondition = and(eq(idempotencyKeys.key, key), lte(idempotencyKeys.expiresAt, now))
  } else if (record.status === 'FAILED') {
    reclaimCondition = and(
      eq(idempotencyKeys.key, key),
      eq(idempotencyKeys.status, 'FAILED'),
      gt(idempotencyKeys.expiresAt, now),
    )
  } else if (record.status === 'PENDING' && record.createdAt <= pendingLeaseStartedAt) {
    reclaimCondition = and(
      eq(idempotencyKeys.key, key),
      eq(idempotencyKeys.status, 'PENDING'),
      lte(idempotencyKeys.createdAt, pendingLeaseStartedAt),
      gt(idempotencyKeys.expiresAt, now),
    )
  }

  if (reclaimCondition) {
    const [reclaimed] = await db.update(idempotencyKeys)
      .set({ status: 'PENDING', requestHash, response: null, expiresAt, createdAt: now })
      .where(reclaimCondition)
      .returning({ key: idempotencyKeys.key })
    if (reclaimed) return { isDuplicate: false, status: 'NEW' }

    const refreshedRecords = await db.select()
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, key))
      .limit(1)
    record = refreshedRecords[0]
    if (!record) throw new Error('The idempotency record could not be reloaded.')
    if (!matchesIdempotencyRequest(record, operation, requestHash)) {
      return payloadMismatchResult()
    }
  }

  return duplicateResult()
}

/**
 * Marks an idempotency key as COMPLETED with the given response data.
 */
export async function completeIdempotencyKey(key: string, response: unknown): Promise<void> {
  const [updated] = await db.update(idempotencyKeys)
    .set({ status: 'COMPLETED', response: response ?? {} })
    .where(and(eq(idempotencyKeys.key, key), eq(idempotencyKeys.status, 'PENDING')))
    .returning({ key: idempotencyKeys.key })
  if (updated) return

  const [existing] = await db.select({ status: idempotencyKeys.status })
    .from(idempotencyKeys)
    .where(eq(idempotencyKeys.key, key))
    .limit(1)
  if (existing?.status !== 'COMPLETED') {
    throw new Error(`Idempotency key ${key} could not be completed.`)
  }
}

/**
 * Marks an idempotency key as FAILED so that subsequent retries are permitted.
 */
export async function failIdempotencyKey(key: string): Promise<void> {
  const [updated] = await db.update(idempotencyKeys)
    .set({ status: 'FAILED' })
    .where(and(eq(idempotencyKeys.key, key), eq(idempotencyKeys.status, 'PENDING')))
    .returning({ key: idempotencyKeys.key })
  if (updated) return

  const [existing] = await db.select({ status: idempotencyKeys.status })
    .from(idempotencyKeys)
    .where(eq(idempotencyKeys.key, key))
    .limit(1)
  if (!existing || !['FAILED', 'COMPLETED'].includes(existing.status)) {
    throw new Error(`Idempotency key ${key} could not be marked as failed.`)
  }
}
