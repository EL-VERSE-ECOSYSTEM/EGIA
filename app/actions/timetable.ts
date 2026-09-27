'use server'

import { db } from '@/lib/db'
import { timetables, user as userTable } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { sanitizeServerError } from '@/lib/errors'
import {
  TimetableEntry,
  canModifyTimetableRole,
  validateAndSanitizeTimetableEntry
} from '@/lib/timetable'

export type { TimetableEntry }

async function getUserSchoolId(sessionUserId: string, sessionSchoolId?: string | null): Promise<string | null> {
  if (sessionSchoolId) return sessionSchoolId
  const uRec = await db.query.user.findFirst({ where: eq(userTable.id, sessionUserId) })
  return uRec?.schoolId || null
}

export async function getTimetableAction(classNameInput: string) {
  const cleanClassName = (classNameInput || '').trim().slice(0, 100)
  if (!cleanClassName) return { success: true, entries: [] }

  try {
    const session = await auth.getSession()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized: Session required.' }
    }

    const schoolId = await getUserSchoolId(session.user.id, session.user.schoolId)
    if (!schoolId && session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'School context is required to view timetable.' }
    }

    const conditions = [eq(timetables.className, cleanClassName)]
    if (schoolId) {
      conditions.push(eq(timetables.schoolId, schoolId))
    }

    const list = await db.query.timetables.findMany({
      where: and(...conditions),
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
  schoolId?: string
}) {
  try {
    const session = await auth.getSession()
    if (!session?.user) {
      return { success: false, error: 'Unauthorized session.' }
    }

    const userRole = session.user.role || ''
    if (!canModifyTimetableRole(userRole)) {
      return { success: false, error: 'Forbidden: Insufficient permissions to modify timetable.' }
    }

    const schoolId = (await getUserSchoolId(session.user.id, session.user.schoolId)) || data.schoolId || null
    if (!schoolId) {
      return { success: false, error: 'School context (schoolId) is required to save timetable.' }
    }

    const cleanClassName = (data.className || '').trim().slice(0, 100)
    if (!cleanClassName) {
      return { success: false, error: 'Class name is required.' }
    }

    const rawEntries = Array.isArray(data.entries) ? data.entries.slice(0, 100) : []
    const validatedEntries = rawEntries.map(e => validateAndSanitizeTimetableEntry(e, schoolId, cleanClassName))

    await db.transaction(async (tx) => {
      // Deletion is strictly scoped to the specific schoolId and className
      await tx.delete(timetables).where(
        and(
          eq(timetables.schoolId, schoolId),
          eq(timetables.className, cleanClassName)
        )
      )

      if (validatedEntries.length > 0) {
        await tx.insert(timetables).values(validatedEntries)
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
