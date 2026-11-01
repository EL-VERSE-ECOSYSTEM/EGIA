import { createHash } from 'node:crypto'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export type IdempotencyResult<T> = {
  replayed: boolean
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  responseCode?: number
  responseBody?: T
}

export function hashRequest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

/**
 * Claims an idempotency key. Callers should return the stored response when
 * replayed=true and persist their response with completeIdempotency after success.
 */
export async function beginIdempotency(
  scope: string,
  key: string,
  requestHash?: string,
  ttlSeconds = 86400,
): Promise<IdempotencyResult<unknown>> {
  const result = await db.execute(sql`
    insert into public.egia_idempotency_keys
      (scope, idempotency_key, request_hash, expires_at)
    values
      (${scope}, ${key}, ${requestHash ?? null}, now() + make_interval(secs => ${ttlSeconds}))
    on conflict (scope, idempotency_key) do update
      set updated_at = now()
    returning status, response_code as "responseCode", response_body as "responseBody",
              (xmax = 0) as inserted
  `)
  const row = Array.isArray(result) ? result[0] as any : undefined
  if (!row || row.inserted) return { replayed: false, status: 'PROCESSING' }
  return {
    replayed: true,
    status: row.status,
    responseCode: row.responseCode ?? undefined,
    responseBody: row.responseBody ?? undefined,
  }
}

export async function completeIdempotency<T>(
  scope: string,
  key: string,
  responseCode: number,
  responseBody: T,
): Promise<void> {
  await db.execute(sql`
    update public.egia_idempotency_keys
    set status = 'COMPLETED', response_code = ${responseCode},
        response_body = ${JSON.stringify(responseBody)}::jsonb, updated_at = now()
    where scope = ${scope} and idempotency_key = ${key}
  `)
}

export async function failIdempotency(
  scope: string,
  key: string,
  responseCode = 500,
  responseBody: unknown = { error: 'Request failed' },
): Promise<void> {
  await db.execute(sql`
    update public.egia_idempotency_keys
    set status = 'FAILED', response_code = ${responseCode},
        response_body = ${JSON.stringify(responseBody)}::jsonb, updated_at = now()
    where scope = ${scope} and idempotency_key = ${key}
  `)
}
