'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { teacherLeaveRequests, teacherAttendance, user as userTable, schoolAdminRoles } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function getAdminSchoolId(): Promise<string> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const userRec = await db.query.user.findFirst({
    where: eq(userTable.id, session.user.id),
  })

  if (userRec?.schoolId) return userRec.schoolId

  const adminRoleRec = await db.query.schoolAdminRoles.findFirst({
    where: eq(schoolAdminRoles.userId, session.user.id),
  })

  if (adminRoleRec?.schoolId) return adminRoleRec.schoolId

  throw new Error('School identity context missing for administrative action.')
}

export async function approveLeave(leaveId: string, comment?: string) {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized: Leave approval permissions required.')
  }

  const userId = session.user.id
  const schoolId = await getAdminSchoolId()

  const leave = await db.query.teacherLeaveRequests.findFirst({
    where: and(
      eq(teacherLeaveRequests.id, leaveId),
      eq(teacherLeaveRequests.schoolId, schoolId)
    )
  })

  if (!leave) throw new Error('Leave request not found or tenant mismatch')
  if (leave.status !== 'PENDING') throw new Error('Leave request has already been processed')

  const now = new Date()

  return await db.transaction(async (tx) => {
    // 1. Update leave request status atomically
    const updated = await tx.update(teacherLeaveRequests)
      .set({
        status: 'APPROVED',
        reviewedBy: userId,
        reviewedAt: now,
        adminComment: comment || 'Approved',
        updatedAt: now,
      })
      .where(and(
        eq(teacherLeaveRequests.id, leaveId),
        eq(teacherLeaveRequests.schoolId, schoolId),
        eq(teacherLeaveRequests.status, 'PENDING')
      ))
      .returning()

    if (updated.length === 0) throw new Error('Failed to update leave request status')

    // 2. Mark teacher attendance as ON_LEAVE for all weekday dates in range
    const start = new Date(leave.startDate)
    const end = new Date(leave.endDate)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      if (day === 0 || day === 6) continue // skip weekends
      const workDate = d.toISOString().slice(0, 10)

      await tx.execute(sql`
        INSERT INTO public.teacher_attendance (
          schoolid, teacherid, work_date, status, notes
        ) VALUES (
          ${schoolId}, ${leave.teacherId}, ${workDate}, 'ON_LEAVE', ${`Approved leave: ${leave.id}`}
        )
        ON CONFLICT (teacherid, work_date)
        DO UPDATE SET
          status = 'ON_LEAVE',
          notes = ${`Approved leave: ${leave.id}`},
          updated_at = NOW()
      `)
    }

    // 3. Update balance: move pending -> used
    try {
      await tx.execute(sql`
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
  })
}
