'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { teacherLeaveRequests, teacherAttendance } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function approveLeave(leaveId: string, comment?: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const userId = session.user.id

  const leave = await db.query.teacherLeaveRequests.findFirst({
    where: eq(teacherLeaveRequests.id, leaveId)
  })
  if (!leave) throw new Error('Leave request not found')

  const now = new Date()

  // Update leave request status
  await db.update(teacherLeaveRequests)
    .set({
      status: 'APPROVED',
      reviewedBy: userId,
      reviewedAt: now,
      adminComment: comment || 'Approved',
      updatedAt: now,
    })
    .where(eq(teacherLeaveRequests.id, leaveId))

  // Mark teacher attendance as ON_LEAVE for all weekday dates in range
  const start = new Date(leave.startDate)
  const end = new Date(leave.endDate)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    if (day === 0 || day === 6) continue // skip weekends
    const workDate = d.toISOString().slice(0, 10)

    try {
      await db.execute(sql`
        INSERT INTO public.teacher_attendance (
          schoolid, teacherid, work_date, status, notes
        ) VALUES (
          ${leave.schoolId}, ${leave.teacherId}, ${workDate}, 'ON_LEAVE', ${`Approved leave: ${leave.id}`}
        )
        ON CONFLICT (teacherid, work_date)
        DO UPDATE SET
          status = 'ON_LEAVE',
          notes = ${`Approved leave: ${leave.id}`},
          updated_at = NOW()
      `)
    } catch (err) {
      console.warn(`Could not upsert attendance for ${workDate}:`, err)
    }
  }

  // Update balance: move pending -> used
  try {
    await db.execute(sql`
      SELECT public.finalize_approved_leave(
        ${leave.teacherId},
        ${leave.leaveTypeId},
        ${leave.totalDays}
      )
    `)
  } catch (err) {
    console.warn('Failed to invoke finalize_approved_leave:', err)
  }

  revalidatePath('/dashboard/admin/leave')
  revalidatePath('/dashboard/teacher/leave')
  revalidatePath('/dashboard/admin/attendance')

  return { success: true }
}
