'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { teacherLeaveRequests, teacher, leaveTypes } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
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
    where: and(eq(leaveTypes.id, input.leaveTypeId), eq(leaveTypes.isActive, true))
  })
  if (!lType || (lType.schoolId && lType.schoolId !== schoolId)) throw new Error('Leave type is unavailable for your school')

  if (lType?.requiresAttachment && !input.attachmentUrl) {
    throw new Error('An attachment is required for this leave type')
  }

  // Calculate total days excluding weekends
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (!datePattern.test(input.startDate) || !datePattern.test(input.endDate)) throw new Error('Enter valid leave dates')
  const start = new Date(`${input.startDate}T12:00:00Z`)
  const end = new Date(`${input.endDate}T12:00:00Z`)
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || start.toISOString().slice(0, 10) !== input.startDate || end.toISOString().slice(0, 10) !== input.endDate || end < start) {
    throw new Error('Enter a valid date range; the end date cannot be before the start date')
  }
  if ((end.valueOf() - start.valueOf()) / 86_400_000 > 366) throw new Error('A leave request cannot exceed 367 calendar days')
  if (!input.reason?.trim() || input.reason.trim().length > 2000) throw new Error('Provide a reason of up to 2,000 characters')

  let days = 0
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) days++
  }

  if (days <= 0) days = 1

  const leaveId = randomUUID()

  const inserted = await db.transaction(async (tx) => {
    const request = await tx.insert(teacherLeaveRequests).values({
    id: leaveId,
    schoolId,
    teacherId: teacherProfile.id,
    leaveTypeId: input.leaveTypeId,
    startDate: input.startDate,
    endDate: input.endDate,
    totalDays: days,
    reason: input.reason.trim(),
    attachmentUrl: input.attachmentUrl || null,
    attachmentPath: input.attachmentPath || null,
    status: 'PENDING',
    isPaid: lType ? lType.isPaid : true,
    createdAt: new Date(),
    updatedAt: new Date(),
    }).returning()

    await tx.execute(sql`
      SELECT public.increment_pending_leave(
        ${teacherProfile.id},
        ${input.leaveTypeId},
        ${days}
      )
    `)
    return request
  })

  revalidatePath('/dashboard/teacher/leave')
  revalidatePath('/dashboard/admin/leave')

  return { success: true, leave: inserted[0] }
}
