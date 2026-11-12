import { sqlClient } from '@/lib/db'

export const LEARN_AI_PACKAGES = {
  starter: { tokens: 35, priceNgn: 5200 },
  standard: { tokens: 50, priceNgn: 6800 },
  plus: { tokens: 75, priceNgn: 8000 },
  maximum: { tokens: 100, priceNgn: 10400 },
} as const

export type LearnAiPackageId = keyof typeof LEARN_AI_PACKAGES

export function isCrossOriginLearnAiRequest(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).origin !== new URL(request.url).origin
  } catch {
    return true
  }
}

export const LEARN_AI_ROLES = new Set([
  'SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'PUPIL',
])

export async function getLearnAiBalance(userId: string) {
  const [balance] = await sqlClient`
    select
      case
        when account.user_id is null or account.window_started_at <= now() - interval '24 hours' then 23
        else greatest(23 - account.daily_used, 0)
      end::integer as daily_remaining,
      coalesce((
        select sum(lot.remaining_tokens)::integer
        from public.learn_ai_token_lots as lot
        where lot.user_id = ${userId} and lot.expires_at > now()
      ), 0)::integer as paid_remaining,
      case
        when account.user_id is null or account.window_started_at <= now() - interval '24 hours' then now() + interval '24 hours'
        else account.window_started_at + interval '24 hours'
      end as reset_at
    from (select ${userId}::text as user_id) as requested
    left join public.learn_ai_accounts as account on account.user_id = requested.user_id
  `
  return balance as { daily_remaining: number; paid_remaining: number; reset_at: Date }
}

/** Learn AI is unavailable while this account has an active CBT session. */
export async function hasActiveCbtSession(userId: string) {
  const [session] = await sqlClient`
    select cbt_sessions.id
    from public.cbt_sessions
    inner join public.student on student.id = cbt_sessions.student_id
    where student.userid = ${userId}
      and upper(cbt_sessions.status) = 'ONGOING'
    limit 1
  `
  return Boolean(session)
}

export async function completeLearnAiPurchase(reference: string, amountKobo: number) {
  const [result] = await sqlClient`
    select public.complete_learn_ai_purchase(${reference}, ${amountKobo}) as completed
  `
  return result?.completed === true
}
