'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { teacherAttendance, teacher, schoolAttendanceConfig } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

export async function clockIn(deviceInfo?: string, ipAddress?: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const teacherProfile = await db.query.teacher.findFirst({
    where: eq(teacher.userId, session.user.id)
  })
  if (!teacherProfile) throw new Error('Teacher record not found')

  const schoolId = teacherProfile.schoolId || session.user.schoolId
  if (!schoolId) throw new Error('School tenant ID missing')

  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  // Check if already clocked in
  const existing = await db.query.teacherAttendance.findFirst({
    where: and(
      eq(teacherAttendance.schoolId, schoolId),
      eq(teacherAttendance.teacherId, teacherProfile.id),
      eq(teacherAttendance.workDate, today)
    )
  })

  if (existing?.clockInAt) {
    throw new Error('Already clocked in for today')
  }

  // Fetch school config for late threshold
  const config = await db.query.schoolAttendanceConfig.findFirst({
    where: eq(schoolAttendanceConfig.schoolId, schoolId)
  })

  const workStart = config?.workStartTime || '08:00:00'
  const lateThreshold = config?.lateThresholdMinutes ?? 10

  const [sh, sm] = workStart.split(':').map(Number)
  const start = new Date(now)
  start.setHours(sh || 8, sm || 0, 0, 0)

  const lateMinutes = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60000))
  const status = lateMinutes >= lateThreshold ? 'LATE' : 'PRESENT'

  const recordId = existing?.id || randomUUID()

  if (existing) {
    await db.update(teacherAttendance)
      .set({
        clockInAt: now,
        clockInIp: ipAddress || null,
        clockInDevice: deviceInfo || 'Web Browser',
        status,
        lateMinutes,
        updatedAt: now,
      })
      .where(and(
        eq(teacherAttendance.id, existing.id),
        eq(teacherAttendance.schoolId, schoolId)
      ))
  } else {
    await db.insert(teacherAttendance).values({
      id: recordId,
      schoolId,
      teacherId: teacherProfile.id,
      workDate: today,
      clockInAt: now,
      clockInIp: ipAddress || null,
      clockInDevice: deviceInfo || 'Web Browser',
      status,
      lateMinutes,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing()
  }

  revalidatePath('/dashboard/teacher/attendance')
  revalidatePath('/dashboard/admin/attendance')

  const updatedRecord = await db.query.teacherAttendance.findFirst({
    where: and(
      eq(teacherAttendance.teacherId, teacherProfile.id),
      eq(teacherAttendance.workDate, today),
      eq(teacherAttendance.schoolId, schoolId)
    )
  })

  return { success: true, record: updatedRecord }
}
