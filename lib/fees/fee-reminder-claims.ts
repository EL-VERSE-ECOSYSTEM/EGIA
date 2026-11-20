import { sqlClient } from '@/lib/db'

export async function claimFeeReminder(userId: string, studentId: string) {
  const [result] = await sqlClient`
    select public.claim_fee_reminder(${userId}, ${studentId}) as claimed
  `
  return result?.claimed === true
}

export async function releaseFeeReminderClaim(userId: string, studentId: string) {
  await sqlClient`
    select public.release_fee_reminder(${userId}, ${studentId})
  `
}
