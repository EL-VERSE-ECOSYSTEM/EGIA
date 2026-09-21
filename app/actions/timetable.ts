'use server'

import { db } from '@/lib/db'
import { timetables, user as userTable } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { sanitizeServerError } from '@/lib/errors'

export interface TimetableEntry {
  id?: string
  dayOfWeek: string
  periodNumber: number
  startTime: string
  endTime: string
  subjectName: string
  teacherName?: string
  room?: string
}

async function getUserSchoolId(sessionUserId: string, sessionSchoolId?: string | null): Promise<string | null> {
  if (sessionSchoolId) return sessionSchoolId
  const uRec = await db.query.user.findFirst({ where: eq(userTable.id, sessionUserId) })
  return uRec?.schoolId || null
}

export async function getTimetableAction(classNameInput: string) {
  const cleanClassName = classNameInput.trim()
  if (!cleanClassName) return { success: true, entries: [] }

  try {
    const session = await auth.getSession()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized: Session required.' }
    }

    const schoolId = await getUserSchoolId(session.user.id, session.user.schoolId)
    if (!schoolId) {
      return { success: false, error: 'School context is required to view timetable.' }
    }

    const list = await db.query.timetables.findMany({
      where: and(
        eq(timetables.schoolId, schoolId),
        eq(timetables.className, cleanClassName)
      ),
      orderBy: (t, { asc }) => [asc(t.dayOfWeek), asc(t.periodNumber)]
    })
    return { success: true, entries: list }
  } catch (err: any) {
    return sanitizeServerError('getTimetableAction', err, 'Unable to retrieve class timetable.')
  }
}

export async function saveTimetableAction(data: {
  className: string
  entries: TimetableEntry[]
}) {
  try {
    const session = await auth.getSession()
    if (!session?.user) throw new Error('Unauthorized session.')

    const schoolId = await getUserSchoolId(session.user.id, session.user.schoolId)
    if (!schoolId) throw new Error('School context is required to save timetable.')

    const cleanClassName = data.className.trim()
    if (!cleanClassName) throw new Error('Class name is required.')

    await db.transaction(async (tx) => {
      // Clear existing timetable entries for this specific school and class
      await tx.delete(timetables).where(
        and(
          eq(timetables.schoolId, schoolId),
          eq(timetables.className, cleanClassName)
        )
      )

      if (data.entries && data.entries.length > 0) {
        const inserts = data.entries.map(e => ({
          schoolId,
          className: cleanClassName,
          dayOfWeek: e.dayOfWeek,
          periodNumber: e.periodNumber || 1,
          startTime: e.startTime || '08:00',
          endTime: e.endTime || '08:40',
          subjectName: e.subjectName || 'Free Period',
          teacherName: e.teacherName || null,
          room: e.room || null,
          updatedAt: new Date()
        }))
        await tx.insert(timetables).values(inserts)
      }
    })

    revalidatePath('/dashboard/student/timetable')
    revalidatePath('/dashboard/student/timetable/daily')
    revalidatePath(`/dashboard/teacher/my-classes`)
    return { success: true }
  } catch (err: any) {
    return sanitizeServerError('saveTimetableAction', err, 'Unable to save class timetable.')
  }
}
