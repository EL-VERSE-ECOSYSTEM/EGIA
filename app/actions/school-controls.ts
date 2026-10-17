'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { systemSettings, student } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

export interface SchoolStudentControls {
  gameplayAllowed: boolean
  gameplayStartHour: number // 0 - 23
  gameplayEndHour: number   // 0 - 23
  messagingAllowed: boolean
  messagingStartHour: number // 0 - 23
  messagingEndHour: number   // 0 - 23
}

export async function getSchoolStudentControlsAction(schoolIdInput?: string): Promise<SchoolStudentControls> {
  const session = await auth.getSession()
  let schoolId = schoolIdInput || session?.user?.schoolId

  if (!schoolId && session?.user?.id) {
    const studentRec = await db.query.student.findFirst({
      where: eq(student.userId, session.user.id)
    })
    schoolId = studentRec?.schoolId || undefined
  }

  const key = schoolId ? `school_student_controls_${schoolId}` : 'school_student_controls_default'

  const setting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, key)
  })

  if (!setting || !setting.value) {
    return {
      gameplayAllowed: true,
      gameplayStartHour: 12, // 12 PM
      gameplayEndHour: 18,   // 6 PM
      messagingAllowed: true,
      messagingStartHour: 8, // 8 AM
      messagingEndHour: 18,  // 6 PM
    }
  }

  try {
    const parsed = JSON.parse(setting.value)
    return {
      gameplayAllowed: parsed.gameplayAllowed ?? true,
      gameplayStartHour: Number(parsed.gameplayStartHour ?? 12),
      gameplayEndHour: Number(parsed.gameplayEndHour ?? 18),
      messagingAllowed: parsed.messagingAllowed ?? true,
      messagingStartHour: Number(parsed.messagingStartHour ?? 8),
      messagingEndHour: Number(parsed.messagingEndHour ?? 18),
    }
  } catch (err) {
    return {
      gameplayAllowed: true,
      gameplayStartHour: 12,
      gameplayEndHour: 18,
      messagingAllowed: true,
      messagingStartHour: 8,
      messagingEndHour: 18,
    }
  }
}

export async function saveSchoolStudentControlsAction(controls: SchoolStudentControls, schoolIdInput?: string) {
  const session = await auth.getSession()
  const userRole = session?.user?.role?.toUpperCase()

  if (!session?.user || !['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
    throw new Error('Unauthorized: Only school administrators can update student time controls.')
  }

  const targetSchoolId = (userRole === 'SUPER_ADMIN' ? schoolIdInput || session.user.schoolId : session.user.schoolId)
  if (!targetSchoolId) {
    throw new Error('School ID required.')
  }

  const key = `school_student_controls_${targetSchoolId}`
  const valueStr = JSON.stringify(controls)

  const existing = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, key)
  })

  if (existing) {
    await db.update(systemSettings)
      .set({ value: valueStr, updatedAt: new Date() })
      .where(eq(systemSettings.key, key))
  } else {
    await db.insert(systemSettings).values({
      id: randomUUID(),
      key,
      value: valueStr,
      type: 'json',
      description: 'School time controls for student gameplay and messaging systems',
      updatedAt: new Date()
    })
  }

  revalidatePath('/dashboard/admin/settings')
  revalidatePath('/dashboard/student/games')
  revalidatePath('/dashboard/student/communication/messages')
  return { success: true }
}
