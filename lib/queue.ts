import { randomUUID } from "crypto";

export type JobPriority = "CRITICAL" | "HIGH" | "DEFAULT" | "LOW";
export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "DEAD_LETTER";

export interface Job<T = any> {
  id: string;
  queueName: string;
  priority: JobPriority;
  uniqueKey?: string;
  payload: T;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  runAt: Date;
  lockedBy?: string | null;
  lockedUntil?: Date | null;
  error?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const jobStore = new Map<string, Job>();
const uniqueIndex = new Map<string, string>();
const deadLetterStore = new Map<string, Job>();

const priorityWeights: Record<JobPriority, number> = {
  CRITICAL: 100,
  HIGH: 50,
  DEFAULT: 10,
  LOW: 1,
};

export interface QueueEnqueueOptions<T = any> {
  queueName?: string;
  priority?: JobPriority;
  uniqueKey?: string;
  delayMs?: number;
  maxAttempts?: number;
  payload: T;
}

export function enqueueJob<T = any>(options: QueueEnqueueOptions<T>): Job<T> {
  const queueName = options.queueName || "default";
  const priority = options.priority || "DEFAULT";
  const uniqueKey = options.uniqueKey;

  if (uniqueKey && uniqueIndex.has(uniqueKey)) {
    const existingId = uniqueIndex.get(uniqueKey)!;
    const existingJob = jobStore.get(existingId);
    if (existingJob && existingJob.status !== "FAILED" && existingJob.status !== "DEAD_LETTER") {
      return existingJob as Job<T>;
    }
  }

  const now = Date.now();
  const runAt = new Date(now + (options.delayMs || 0));
  const id = `job_${now}_${randomUUID().slice(0, 8)}`;

  const job: Job<T> = {
    id,
    queueName,
    priority,
    uniqueKey,
    payload: options.payload,
    status: "PENDING",
    attempts: 0,
    maxAttempts: options.maxAttempts ?? 5,
    runAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  jobStore.set(id, job);
  if (uniqueKey) {
    uniqueIndex.set(uniqueKey, id);
  }

  return job;
}

export function fetchNextJob(workerId: string): Job | null {
  const now = new Date();
  const pendingJobs = Array.from(jobStore.values()).filter(
    (j) =>
      j.status === "PENDING" &&
      j.runAt <= now &&
      (!j.lockedUntil || j.lockedUntil <= now)
  );

  if (pendingJobs.length === 0) return null;

  pendingJobs.sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]);

  const selected = pendingJobs[0];
  selected.status = "PROCESSING";
  selected.lockedBy = workerId;
  selected.lockedUntil = new Date(Date.now() + 60_000); // 60s lease
  selected.attempts += 1;
  selected.updatedAt = new Date();

  return selected;
}

export function completeJob(jobId: string) {
  const job = jobStore.get(jobId);
  if (job) {
    job.status = "COMPLETED";
    job.lockedBy = null;
    job.lockedUntil = null;
    job.updatedAt = new Date();
  }
}

export function failJob(jobId: string, errorMsg: string) {
  const job = jobStore.get(jobId);
  if (!job) return;

  job.error = errorMsg;
  job.lockedBy = null;
  job.lockedUntil = null;

  if (job.attempts >= job.maxAttempts) {
    job.status = "DEAD_LETTER";
    deadLetterStore.set(job.id, job);
  } else {
    job.status = "PENDING";
    const backoffSeconds = Math.pow(2, job.attempts) * 15; // Exponential backoff: 30s, 60s, 120s...
    job.runAt = new Date(Date.now() + backoffSeconds * 1000);
  }

  job.updatedAt = new Date();
}

export function getQueueStats() {
  const allJobs = Array.from(jobStore.values());
  return {
    total: allJobs.length,
    pending: allJobs.filter((j) => j.status === "PENDING").length,
    processing: allJobs.filter((j) => j.status === "PROCESSING").length,
    completed: allJobs.filter((j) => j.status === "COMPLETED").length,
    failed: allJobs.filter((j) => j.status === "FAILED").length,
    deadLetter: deadLetterStore.size,
  };
}

export function getDeadLetterJobs(): Job[] {
  return Array.from(deadLetterStore.values());
}

export function replayDeadLetterJob(jobId: string): boolean {
  const job = deadLetterStore.get(jobId);
  if (!job) return false;

  job.status = "PENDING";
  job.attempts = 0;
  job.runAt = new Date();
  job.error = null;
  job.updatedAt = new Date();

  deadLetterStore.delete(jobId);
  jobStore.set(jobId, job);
  return true;
}

// ===== BATCH JOB PROCESSOR =====
export interface BatchProcessProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  isComplete: boolean;
}

export async function processBatchItems<T, R>(
  items: T[],
  handler: (item: T) => Promise<R>,
  batchSize = 100,
  onProgress?: (progress: BatchProcessProgress) => void
): Promise<{ results: R[]; errors: any[] }> {
  const results: R[] = [];
  const errors: any[] = [];
  const total = items.length;
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < total; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const chunkResults = await Promise.allSettled(chunk.map((item) => handler(item)));

    for (const res of chunkResults) {
      processed += 1;
      if (res.status === "fulfilled") {
        succeeded += 1;
        results.push(res.value);
      } else {
        failed += 1;
        errors.push(res.reason);
      }
    }

    if (onProgress) {
      onProgress({
        total,
        processed,
        succeeded,
        failed,
        isComplete: processed === total,
      });
    }
  }

  return { results, errors };
}
