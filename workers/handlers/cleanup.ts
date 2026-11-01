import { JobHandler } from '../registry'
import { db } from '@/lib/db'
import { idempotencyKeys, jobs } from '@/lib/db/schema'
import { lt, and, eq } from 'drizzle-orm'

export const cleanupHandler: JobHandler = async () => {
  const now = new Date()
  let cleanedIdempotency = 0
  let reapedStuckJobs = 0

  try {
    // 1. Delete expired idempotency keys
    await db
      .delete(idempotencyKeys)
      .where(lt(idempotencyKeys.expiresAt, now))

    // 2. Reap stuck jobs (jobs locked > 5 minutes ago)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    await db
      .update(jobs)
      .set({
        status: 'PENDING',
        lockedAt: null,
        lockedBy: null,
        lastError: 'Lease expired, reaped by cleanup worker',
      })
      .where(and(eq(jobs.status, 'PROCESSING'), lt(jobs.lockedAt, fiveMinutesAgo)))

    return { cleanedIdempotency, reapedStuckJobs, executedAt: now.toISOString() }
  } catch (err: any) {
    console.warn('[Worker:Cleanup] Error running maintenance cleanup:', err.message)
    return { error: err.message }
  }
}
