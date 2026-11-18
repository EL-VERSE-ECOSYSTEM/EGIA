'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { academicSession, parent, school, schoolCalendarEvent, student, term } from '@/lib/db/schema'
import { and, asc, eq, gte, lte } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

async function getVisibleSchoolIds() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Sign in to view the school calendar.')
  const actor = session.user
  if (actor.schoolId) return [actor.schoolId]
  if (actor.role.toUpperCase() === 'STUDENT' || actor.role.toUpperCase() === 'PUPIL') {
    const profile = await db.query.student.findFirst({ where: eq(student.userId, actor.id), columns: { schoolId: true } })
    return profile?.schoolId ? [profile.schoolId] : []
  }
  if (actor.role.toUpperCase() === 'PARENT') {
    const profile = await db.query.parent.findFirst({ where: eq(parent.userId, actor.id), columns: { schoolId: true } })
    return profile?.schoolId ? [profile.schoolId] : []
  }
  return []
}

export async function getSchoolCalendarEvents(from?: string, to?: string) {
  const schoolIds = await getVisibleSchoolIds()
  if (!schoolIds.length) return { events: [], terms: [], sessions: [] }
  const scope = schoolIds.length === 1 ? eq(schoolCalendarEvent.schoolId, schoolIds[0]) : undefined
  const conditions = [scope, from ? gte(schoolCalendarEvent.eventDate, from) : undefined, to ? lte(schoolCalendarEvent.eventDate, to) : undefined].filter(Boolean)
  const events = await db.select({ event: schoolCalendarEvent, schoolName: school.name, termName: term.name, sessionName: academicSession.name })
    .from(schoolCalendarEvent)
    .leftJoin(school, eq(school.id, schoolCalendarEvent.schoolId))
    .leftJoin(term, eq(term.id, schoolCalendarEvent.termId))
    .leftJoin(academicSession, eq(academicSession.id, schoolCalendarEvent.sessionId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(schoolCalendarEvent.eventDate), asc(schoolCalendarEvent.startTime))
  return { events, terms: await db.select().from(term).orderBy(asc(term.startDate)), sessions: await db.select().from(academicSession).orderBy(asc(academicSession.startDate)) }
}

export async function createSchoolCalendarEvent(input: {
  title: string; description?: string; category: string; eventDate: string; startTime?: string; endTime?: string;
  location?: string; termId?: string; sessionId?: string;
}) {
  const session = await auth.getSession()
  const actor = session?.user
  if (!actor || !['ADMIN', 'SCHOOL_ADMIN'].includes(actor.role.toUpperCase()) || !actor.schoolId) {
    throw new Error('Only a school administrator can manage the school calendar.')
  }
  const title = input.title.trim()
  if (!title || title.length > 160) throw new Error('Enter an event title of up to 160 characters.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.eventDate) || Number.isNaN(Date.parse(`${input.eventDate}T00:00:00Z`))) throw new Error('Choose a valid event date.')
  const categories = ['ACADEMIC', 'ASSESSMENT', 'EXAM', 'MEETING', 'ACTIVITY', 'HOLIDAY', 'DEADLINE', 'SPORTS', 'OTHER']
  const category = categories.includes(input.category.toUpperCase()) ? input.category.toUpperCase() : 'ACTIVITY'
  if (input.termId && !await db.query.term.findFirst({ where: eq(term.id, input.termId) })) throw new Error('Term was not found.')
  if (input.sessionId && !await db.query.academicSession.findFirst({ where: eq(academicSession.id, input.sessionId) })) throw new Error('School session was not found.')
  const [event] = await db.insert(schoolCalendarEvent).values({
    id: randomUUID(), schoolId: actor.schoolId, createdBy: actor.id, title,
    description: input.description?.trim().slice(0, 4000) || null, category,
    eventDate: input.eventDate, startTime: input.startTime || null, endTime: input.endTime || null,
    location: input.location?.trim().slice(0, 160) || null, termId: input.termId || null, sessionId: input.sessionId || null,
  }).returning()
  revalidatePath('/dashboard/admin/academics/calendar')
  revalidatePath('/dashboard/parent/calendar')
  revalidatePath('/dashboard/teacher/calendar')
  revalidatePath('/dashboard/student/attendance/calendar')
  return event
}

export async function deleteSchoolCalendarEvent(eventId: string) {
  const session = await auth.getSession()
  const actor = session?.user
  if (!actor || !['ADMIN', 'SCHOOL_ADMIN'].includes(actor.role.toUpperCase()) || !actor.schoolId) throw new Error('Only a school administrator can manage the school calendar.')
  await db.delete(schoolCalendarEvent).where(and(eq(schoolCalendarEvent.id, eventId), eq(schoolCalendarEvent.schoolId, actor.schoolId)))
  revalidatePath('/dashboard/admin/academics/calendar')
  revalidatePath('/dashboard/parent/calendar')
}
