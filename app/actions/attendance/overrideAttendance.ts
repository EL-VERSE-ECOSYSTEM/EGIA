'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { teacherAttendance, schoolAdminRoles, auditLog } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

export async function overrideAttendance(input: {
  attendanceId?: string
  teacherId?: string
  workDate?: string
  schoolId?: string
  newStatus: string
  newClockIn?: string
  newClockOut?: string
  notes?: string
  reason: string
}) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const userRole = session.user.role
  const userId = session.user.id

  if (userRole !== 'SUPER_ADMIN') {
    const adminRole = await db.query.schoolAdminRoles.findFirst({
      where: and(
        eq(schoolAdminRoles.userId, userId),
        eq(schoolAdminRoles.isActive, true)
      )
    })

    if (adminRole?.level !== 'PRIMARY_ADMIN') {
      throw new Error('Only Primary Admin can override attendance records')
    }
  }

  const now = new Date()
  let targetId = input.attendanceId

  if (!targetId && input.teacherId && input.workDate && input.schoolId) {
    const existing = await db.query.teacherAttendance.findFirst({
      where: and(
        eq(teacherAttendance.teacherId, input.teacherId),
        eq(teacherAttendance.workDate, input.workDate)
      )
    })

    if (existing) {
      targetId = existing.id
    } else {
      targetId = randomUUID()
      await db.insert(teacherAttendance).values({
        id: targetId,
        schoolId: input.schoolId,
        teacherId: input.teacherId,
        workDate: input.workDate,
        status: input.newStatus as any,
        clockInAt: input.newClockIn ? new Date(input.newClockIn) : null,
        clockOutAt: input.newClockOut ? new Date(input.newClockOut) : null,
        isManualOverride: true,
        overrideBy: userId,
        overrideReason: input.reason,
        notes: input.notes || null,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

  if (targetId && input.attendanceId) {
    await db.update(teacherAttendance)
      .set({
        status: input.newStatus as any,
        clockInAt: input.newClockIn ? new Date(input.newClockIn) : undefined,
        clockOutAt: input.newClockOut ? new Date(input.newClockOut) : undefined,
        isManualOverride: true,
        overrideBy: userId,
        overrideReason: input.reason,
        notes: input.notes || undefined,
        updatedAt: now,
      })
      .where(eq(teacherAttendance.id, targetId))
  }

  // Audit log entry
  await db.insert(auditLog).values({
    id: randomUUID(),
    userId,
    action: 'ATTENDANCE_OVERRIDE',
    resource: 'teacher_attendance',
    resourceId: targetId || null,
    details: input as any,
    createdAt: now,
  })

  revalidatePath('/dashboard/admin/attendance')
  revalidatePath('/dashboard/teacher/attendance')

  return { success: true }
}
