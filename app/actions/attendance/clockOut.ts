'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { teacherAttendance, teacher, schoolAttendanceConfig } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function clockOut(deviceInfo?: string, ipAddress?: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const teacherProfile = await db.query.teacher.findFirst({
    where: eq(teacher.userId, session.user.id)
  })
  if (!teacherProfile) throw new Error('Teacher record not found')

  const schoolId = teacherProfile.schoolId || session.user.schoolId
  if (!schoolId) throw new Error('School tenant ID missing')

  const today = new Date().toISOString().slice(0, 10)

  const record = await db.query.teacherAttendance.findFirst({
    where: and(
      eq(teacherAttendance.teacherId, teacherProfile.id),
      eq(teacherAttendance.workDate, today)
    )
  })

  if (!record?.clockInAt) throw new Error('Not clocked in today')
  if (record.clockOutAt) throw new Error('Already clocked out today')

  const now = new Date()
  const clockInTime = new Date(record.clockInAt)
  const totalMinutes = Math.floor((now.getTime() - clockInTime.getTime()) / 60000)

  const config = await db.query.schoolAttendanceConfig.findFirst({
    where: eq(schoolAttendanceConfig.schoolId, schoolId)
  })

  const workEnd = config?.workEndTime || '16:00:00'
  const [eh, em] = workEnd.split(':').map(Number)
  const end = new Date(now)
  end.setHours(eh || 16, em || 0, 0, 0)

  const earlyExitMinutes = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 60000))
  const overtimeMinutes = Math.max(0, Math.floor((now.getTime() - end.getTime()) / 60000))

  await db.update(teacherAttendance)
    .set({
      clockOutAt: now,
      clockOutIp: ipAddress || null,
      clockOutDevice: deviceInfo || 'Web Browser',
      totalMinutes,
      earlyExitMinutes,
      overtimeMinutes,
      updatedAt: now,
    })
    .where(eq(teacherAttendance.id, record.id))

  revalidatePath('/dashboard/teacher/attendance')
  revalidatePath('/dashboard/admin/attendance')

  const updatedRecord = await db.query.teacherAttendance.findFirst({
    where: eq(teacherAttendance.id, record.id)
  })

  return { success: true, record: updatedRecord }
}
