'use server'

import { db } from '@/lib/db'
import { timetables, class_ } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { randomUUID } from 'crypto'

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

export async function getTimetableAction(classNameInput: string) {
  const cleanClassName = classNameInput.trim()
  if (!cleanClassName) return { success: true, entries: [] }
  const requestId = randomUUID()

  try {
    const list = await db.query.timetables.findMany({
      where: eq(timetables.className, cleanClassName),
      orderBy: (t, { asc }) => [asc(t.dayOfWeek), asc(t.periodNumber)]
    })
    return { success: true, entries: list }
  } catch (err: any) {
    console.error('getTimetableAction Error:', { requestId, error: err?.message || err })
    return { success: false, error: 'Unable to retrieve class timetable. Please try again.', requestId }
  }
}

export async function saveTimetableAction(data: {
  className: string
  entries: TimetableEntry[]
}) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const cleanClassName = data.className.trim()
  if (!cleanClassName) throw new Error('Class name is required.')
  const requestId = randomUUID()

  try {
    await db.transaction(async (tx) => {
      // Clear existing timetable entries for class
      await tx.delete(timetables).where(eq(timetables.className, cleanClassName))

      if (data.entries && data.entries.length > 0) {
        const inserts = data.entries.map(e => ({
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
    console.error('saveTimetableAction Error:', { requestId, error: err?.message || err })
    return { success: false, error: 'Unable to save class timetable. Please try again.', requestId }
  }
}
