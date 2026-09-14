'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { teacherLeaveRequests } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function rejectLeave(leaveId: string, reason: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  if (!reason || reason.trim().length === 0) {
    throw new Error('A reason for rejection is required')
  }

  const userId = session.user.id

  const leave = await db.query.teacherLeaveRequests.findFirst({
    where: eq(teacherLeaveRequests.id, leaveId)
  })
  if (!leave) throw new Error('Leave request not found')

  const now = new Date()

  await db.update(teacherLeaveRequests)
    .set({
      status: 'REJECTED',
      reviewedBy: userId,
      reviewedAt: now,
      rejectionReason: reason,
      updatedAt: now,
    })
    .where(eq(teacherLeaveRequests.id, leaveId))

  // Release pending days back in leave balance
  try {
    await db.execute(sql`
      SELECT public.release_pending_leave(
        ${leave.teacherId},
        ${leave.leaveTypeId},
        ${leave.totalDays}
      )
    `)
  } catch (err) {
    console.warn('Failed to invoke release_pending_leave:', err)
  }

  revalidatePath('/dashboard/admin/leave')
  revalidatePath('/dashboard/teacher/leave')

  return { success: true }
}
