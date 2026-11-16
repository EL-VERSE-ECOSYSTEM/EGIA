'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { teacherLeaveRequests, user as userTable, schoolAdminRoles } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function rejectLeave(leaveId: string, reason: string) {
  const session = await auth.getSession()
  if (!session?.user || !['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) throw new Error('Unauthorized')

  if (!reason || reason.trim().length === 0) {
    throw new Error('A reason for rejection is required')
  }

  const userId = session.user.id

  const userRec = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) })
  const adminRole = await db.query.schoolAdminRoles.findFirst({ where: eq(schoolAdminRoles.userId, session.user.id) })
  const schoolId = userRec?.schoolId || adminRole?.schoolId
  if (!schoolId) throw new Error('School identity context missing for administrative action')

  const now = new Date()

  await db.transaction(async (tx) => {
    const [leave] = await tx.update(teacherLeaveRequests)
      .set({
      status: 'REJECTED',
      reviewedBy: userId,
      reviewedAt: now,
      rejectionReason: reason,
      updatedAt: now,
      })
      .where(and(
        eq(teacherLeaveRequests.id, leaveId),
        eq(teacherLeaveRequests.schoolId, schoolId),
        eq(teacherLeaveRequests.status, 'PENDING'),
      ))
      .returning()
    if (!leave) throw new Error('Pending leave request not found for this school')

    await tx.execute(sql`
      SELECT public.release_pending_leave(
        ${leave.teacherId},
        ${leave.leaveTypeId},
        ${leave.totalDays}
      )
    `)
  })

  revalidatePath('/dashboard/admin/leave')
  revalidatePath('/dashboard/teacher/leave')

  return { success: true }
}
