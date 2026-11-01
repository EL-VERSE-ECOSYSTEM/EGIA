import { db, sqlClient } from '@/lib/db'
import { jobs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { registry, JobRecord } from './registry'
import { JobHeartbeat } from './utils/heartbeat'
import { calculateBackoffWithJitter, isRetryableError } from './utils/retry'
import { shutdownManager } from './utils/shutdown'
import { randomUUID } from 'crypto'

export interface WorkerRunnerOptions {
  workerId?: string;
  queue?: string;
  pollIntervalMs?: number;
  batchSize?: number;
}

export class WorkerRunner {
  readonly workerId: string;
  readonly queue: string;
  readonly pollIntervalMs: number;
  private isRunning = false;
  private pollTimeout: NodeJS.Timeout | null = null;

  constructor(options: WorkerRunnerOptions = {}) {
    this.workerId = options.workerId || `worker_${Date.now()}_${randomUUID().slice(0, 6)}`;
    this.queue = options.queue || 'default';
    this.pollIntervalMs = options.pollIntervalMs || 2000;

    shutdownManager.onShutdown(async () => {
      this.stop();
    });
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[WorkerRunner] Started worker ${this.workerId} on queue '${this.queue}'`);
    this.scheduleNextPoll(0);
  }

  stop() {
    this.isRunning = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    console.log(`[WorkerRunner] Stopped worker ${this.workerId}`);
  }

  private scheduleNextPoll(delayMs: number) {
    if (!this.isRunning || shutdownManager.isStopping()) return;
    this.pollTimeout = setTimeout(() => {
      void this.pollAndExecute();
    }, delayMs);
  }

  private async pollAndExecute() {
    if (!this.isRunning || shutdownManager.isStopping()) return;

    try {
      const job = await this.claimNextJob();
      if (job) {
        await this.executeJob(job);
        // Process next available immediately
        this.scheduleNextPoll(0);
        return;
      }
    } catch (error) {
      console.error(`[WorkerRunner] Error during job poll/execution:`, error);
    }

    // No jobs found or error, back off to normal interval
    this.scheduleNextPoll(this.pollIntervalMs);
  }

  /**
   * Atomically claims a job using PostgreSQL FOR UPDATE SKIP LOCKED
   */
  async claimNextJob(): Promise<JobRecord | null> {
    try {
      const result = await sqlClient<JobRecord[]>`
        UPDATE public.jobs j
        SET status = 'PROCESSING',
            locked_at = now(),
            locked_by = ${this.workerId},
            started_at = COALESCE(started_at, now()),
            attempts = j.attempts + 1
        FROM (
          SELECT id
          FROM public.jobs
          WHERE status = 'PENDING'
            AND available_at <= now()
            AND queue = ${this.queue}
          ORDER BY priority ASC, created_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        ) sub
        WHERE j.id = sub.id
        RETURNING j.*;
      `;

      if (!result || result.length === 0) return null;
      return result[0];
    } catch (err) {
      // In testing environments without direct DB, handle gracefully
      return null;
    }
  }

  /**
   * Executes a claimed job with lease heartbeat and backoff recovery
   */
  async executeJob(job: JobRecord) {
    const handler = registry.get(job.type);
    if (!handler) {
      console.warn(`[WorkerRunner] No handler found for job type: ${job.type}. Failing job.`);
      await this.markJobFailed(job, `No handler registered for type: ${job.type}`, false);
      return;
    }

    const heartbeat = new JobHeartbeat(job.id, this.workerId);
    heartbeat.start();

    try {
      const result = await handler(job.payload, job);
      heartbeat.stop();
      await this.markJobCompleted(job.id);
    } catch (err: any) {
      heartbeat.stop();
      const retryable = isRetryableError(err);
      await this.markJobFailed(job, err.message || String(err), retryable);
    }
  }

  async markJobCompleted(jobId: string) {
    try {
      await db
        .update(jobs)
        .set({
          status: 'COMPLETED',
          completedAt: new Date(),
          lockedBy: null,
          lockedAt: null,
        })
        .where(eq(jobs.id, jobId));
    } catch (err) {
      console.error(`[WorkerRunner] Failed to mark job ${jobId} completed:`, err);
    }
  }

  async markJobFailed(job: JobRecord, errorMessage: string, retryable: boolean) {
    const nextAttempt = job.attempts;
    const isExhausted = !retryable || nextAttempt >= job.maxAttempts;
    const nextStatus = isExhausted ? 'DEAD_LETTER' : 'PENDING';
    const delayMs = calculateBackoffWithJitter(nextAttempt);
    const nextAvailableAt = new Date(Date.now() + delayMs);

    try {
      await db
        .update(jobs)
        .set({
          status: nextStatus,
          lastError: errorMessage,
          availableAt: isExhausted ? job.availableAt : nextAvailableAt,
          lockedBy: null,
          lockedAt: null,
          failedAt: isExhausted ? new Date() : null,
        })
        .where(eq(jobs.id, job.id));
    } catch (err) {
      console.error(`[WorkerRunner] Failed to update failed status for job ${job.id}:`, err);
    }
  }
}
