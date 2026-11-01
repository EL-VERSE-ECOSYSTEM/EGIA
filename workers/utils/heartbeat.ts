import { db } from '@/lib/db'
import { jobs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Periodically touches lockedAt on the active job to extend the worker's lease.
 */
export class JobHeartbeat {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly jobId: string,
    private readonly workerId: string,
    private readonly intervalMs = 15000
  ) {}

  start() {
    this.timer = setInterval(async () => {
      try {
        await db
          .update(jobs)
          .set({
            lockedAt: new Date(),
          })
          .where(and(eq(jobs.id, this.jobId), eq(jobs.lockedBy, this.workerId)))
      } catch (err) {
        console.warn(`[Heartbeat] Failed to refresh lease for job ${this.jobId}:`, err);
      }
    }, this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
