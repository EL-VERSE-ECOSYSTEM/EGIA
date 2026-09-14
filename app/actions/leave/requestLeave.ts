'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { teacherLeaveRequests, teacher, leaveTypes } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

export async function requestLeave(input: {
  leaveTypeId: string
  startDate: string
  endDate: string
  reason: string
  attachmentUrl?: string
  attachmentPath?: string
}) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const teacherProfile = await db.query.teacher.findFirst({
    where: eq(teacher.userId, session.user.id)
  })
  if (!teacherProfile) throw new Error('Teacher record not found')

  const schoolId = teacherProfile.schoolId || session.user.schoolId
  if (!schoolId) throw new Error('School tenant ID missing')

  // Check if leave type requires attachment
  const lType = await db.query.leaveTypes.findFirst({
    where: eq(leaveTypes.id, input.leaveTypeId)
  })

  if (lType?.requiresAttachment && !input.attachmentUrl) {
    throw new Error('An attachment is required for this leave type')
  }

  // Calculate total days excluding weekends
  const start = new Date(input.startDate)
  const end = new Date(input.endDate)
  if (end < start) throw new Error('End date cannot be before start date')

  let days = 0
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) days++
  }

  if (days <= 0) days = 1

  const leaveId = randomUUID()

  const inserted = await db.insert(teacherLeaveRequests).values({
    id: leaveId,
    schoolId,
    teacherId: teacherProfile.id,
    leaveTypeId: input.leaveTypeId,
    startDate: input.startDate,
    endDate: input.endDate,
    totalDays: days,
    reason: input.reason,
    attachmentUrl: input.attachmentUrl || null,
    attachmentPath: input.attachmentPath || null,
    status: 'PENDING',
    isPaid: lType ? lType.isPaid : true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()

  // Increment pending days in teacher_leave_balance using RPC function
  try {
    await db.execute(sql`
      SELECT public.increment_pending_leave(
        ${teacherProfile.id},
        ${input.leaveTypeId},
        ${days}
      )
    `)
  } catch (err) {
    console.warn('Failed to invoke increment_pending_leave function:', err)
  }

  revalidatePath('/dashboard/teacher/leave')
  revalidatePath('/dashboard/admin/leave')

  return { success: true, leave: inserted[0] }
}
