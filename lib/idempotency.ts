import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { idempotencyKeys } from '@/lib/db/schema'
import { eq, and, gt } from 'drizzle-orm'

export interface IdempotencyCheckResult<T = any> {
  isDuplicate: boolean;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'NEW';
  cachedResponse?: T;
}

/**
 * Computes deterministic SHA-256 hash of a request payload or parameters.
 */
export function hashPayload(payload: any): string {
  if (!payload) return ''
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return createHash('sha256').update(serialized).digest('hex')
}

/**
 * Checks an idempotency key atomically.
 * If key does not exist or has expired, creates a new PENDING record and returns isDuplicate: false.
 * If key exists and is COMPLETED, returns cached response.
 * If key exists and is PENDING, indicates processing is in-flight.
 */
export async function checkOrAcquireIdempotency<T = any>(
  key: string,
  operation: string,
  payload?: any,
  ttlHours = 24
): Promise<IdempotencyCheckResult<T>> {
  const requestHash = hashPayload(payload)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000)

  try {
    // Attempt atomic insert with ON CONFLICT DO NOTHING
    const [inserted] = await db
      .insert(idempotencyKeys)
      .values({
        key,
        operation,
        requestHash,
        status: 'PENDING',
        expiresAt,
      })
      .onConflictDoNothing()
      .returning()

    if (inserted) {
      return {
        isDuplicate: false,
        status: 'NEW',
      }
    }

    // Key exists, fetch current record
    const existing = await db
      .select()
      .from(idempotencyKeys)
      .where(and(eq(idempotencyKeys.key, key), gt(idempotencyKeys.expiresAt, now)))
      .limit(1)

    if (existing.length === 0) {
      // Record expired or missing, re-upsert
      await db
        .insert(idempotencyKeys)
        .values({
          key,
          operation,
          requestHash,
          status: 'PENDING',
          expiresAt,
        })
        .onConflictDoUpdate({
          target: idempotencyKeys.key,
          set: {
            operation,
            requestHash,
            status: 'PENDING',
            response: null,
            expiresAt,
          },
        })

      return {
        isDuplicate: false,
        status: 'NEW',
      }
    }

    const record = existing[0]
    if (record.status === 'FAILED') {
      const [reacquired] = await db.update(idempotencyKeys)
        .set({ status: 'PENDING', requestHash, response: null, expiresAt })
        .where(and(eq(idempotencyKeys.key, key), eq(idempotencyKeys.status, 'FAILED')))
        .returning({ key: idempotencyKeys.key })
      if (reacquired) return { isDuplicate: false, status: 'NEW' }
    }
    return {
      isDuplicate: true,
      status: record.status as any,
      cachedResponse: record.response as T,
    }
  } catch (error) {
    // Fallback in case of database error
    return {
      isDuplicate: false,
      status: 'NEW',
    }
  }
}

/**
 * Marks an idempotency key as COMPLETED with the given response data.
 */
export async function completeIdempotencyKey(key: string, response: any): Promise<void> {
  try {
    await db
      .update(idempotencyKeys)
      .set({
        status: 'COMPLETED',
        response: response ?? {},
      })
      .where(eq(idempotencyKeys.key, key))
  } catch (error) {
    console.error(`Failed to mark idempotency key ${key} as COMPLETED:`, error)
  }
}

/**
 * Marks an idempotency key as FAILED so that subsequent retries are permitted.
 */
export async function failIdempotencyKey(key: string): Promise<void> {
  try {
    await db
      .update(idempotencyKeys)
      .set({
        status: 'FAILED',
      })
      .where(eq(idempotencyKeys.key, key))
  } catch (error) {
    console.error(`Failed to mark idempotency key ${key} as FAILED:`, error)
  }
}
