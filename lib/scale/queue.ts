import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

export type QueueJob<T = unknown> = {
  id?: string
  jobType: string
  payload: T
  priority?: number
  maxAttempts?: number
  availableAt?: Date
  schoolId?: string | null
  idempotencyKey?: string | null
}

export async function enqueueJob<T>(job: QueueJob<T>): Promise<string> {
  const id = job.id ?? randomUUID()
  await db.execute(sql`
    insert into public.egia_jobs
      (id, job_type, payload, priority, max_attempts, available_at, school_id, idempotency_key)
    values
      (${id}::uuid, ${job.jobType}, ${JSON.stringify(job.payload)}::jsonb,
       ${job.priority ?? 100}, ${job.maxAttempts ?? 5}, ${job.availableAt ?? new Date()},
       ${job.schoolId ?? null}, ${job.idempotencyKey ?? null})
    on conflict (job_type, idempotency_key) where idempotency_key is not null do nothing
  `)
  return id
}

export async function claimJob(workerId: string) {
  const result = await db.execute(sql`select * from public.egia_claim_job(${workerId})`)
  return Array.isArray(result) ? (result[0] ?? null) : null
}

export async function completeJob(id: string) {
  await db.execute(sql`
    update public.egia_jobs
    set status = 'COMPLETED', completed_at = now(), locked_at = null, locked_by = null, updated_at = now()
    where id = ${id}::uuid
  `)
}

export async function failJob(id: string, error: unknown, retryAt?: Date) {
  const message = error instanceof Error ? error.message : String(error)
  await db.execute(sql`
    update public.egia_jobs
    set status = case when attempts >= max_attempts then 'DEAD_LETTER' else 'FAILED' end,
        available_at = ${retryAt ?? new Date()}, last_error = ${message.slice(0, 4000)},
        locked_at = null, locked_by = null, updated_at = now()
    where id = ${id}::uuid
  `)
}
