'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reportCardTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export type ReportCard = {
  id: string
  studentId: string
  studentName: string
  className: string
  marks: {
    subject: string
    testScore: number
    examScore: number
    total: number
    grade: string
  }[]
  teacherRemarks: string
  status: 'PENDING' | 'ENDORSED' | 'REJECTED'
  adminFeedback?: string | null
  term?: string | null
  session?: string | null
  endorsedAt?: string | null
  createdAt: string
}

export async function getReportCards(): Promise<ReportCard[]> {
  try {
    const results = await db.select().from(reportCardTable)
    return results.map(r => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.studentName,
      className: r.className,
      marks: r.marks as any,
      teacherRemarks: r.teacherRemarks || '',
      status: r.status as any,
      adminFeedback: r.adminFeedback || null,
      term: r.term || 'First Term',
      session: r.session || '2026/2027',
      endorsedAt: r.endorsedAt ? r.endorsedAt.toISOString() : null,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString()
    }))
  } catch (err) {
    console.error('Failed to get report cards from DB:', err)
    return []
  }
}

export async function saveReportCard(data: Omit<ReportCard, 'id' | 'status' | 'createdAt'>): Promise<ReportCard> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const id = `card-${Date.now()}`
  const newCard: ReportCard = {
    ...data,
    id,
    status: 'PENDING',
    term: data.term || 'First Term',
    session: data.session || '2026/2027',
    createdAt: new Date().toISOString()
  }

  await db.insert(reportCardTable).values({
    id,
    studentId: data.studentId,
    studentName: data.studentName,
    className: data.className,
    marks: data.marks as any,
    teacherRemarks: data.teacherRemarks,
    status: 'PENDING',
    term: data.term || 'First Term',
    session: data.session || '2026/2027'
  })

  revalidatePath('/dashboard')
  return newCard
}

export async function endorseReportCard(id: string, feedback?: string): Promise<ReportCard> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const adminFeedback = feedback || 'Endorsed and approved by Academy Administration.'

  await db.update(reportCardTable)
    .set({
      status: 'ENDORSED',
      adminFeedback: adminFeedback,
      endorsedAt: new Date()
    })
    .where(eq(reportCardTable.id, id))

  const results = await db.select().from(reportCardTable).where(eq(reportCardTable.id, id)).limit(1)
  const r = results[0]
  if (!r) throw new Error('Report card not found')

  revalidatePath('/dashboard')
  return {
    id: r.id,
    studentId: r.studentId,
    studentName: r.studentName,
    className: r.className,
    marks: r.marks as any,
    teacherRemarks: r.teacherRemarks || '',
    status: r.status as any,
    adminFeedback: r.adminFeedback || null,
    term: r.term || 'First Term',
    session: r.session || '2026/2027',
    endorsedAt: r.endorsedAt ? r.endorsedAt.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString()
  }
}

export async function rejectReportCard(id: string, feedback: string): Promise<ReportCard> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  await db.update(reportCardTable)
    .set({
      status: 'REJECTED',
      adminFeedback: feedback
    })
    .where(eq(reportCardTable.id, id))

  const results = await db.select().from(reportCardTable).where(eq(reportCardTable.id, id)).limit(1)
  const r = results[0]
  if (!r) throw new Error('Report card not found')

  revalidatePath('/dashboard')
  return {
    id: r.id,
    studentId: r.studentId,
    studentName: r.studentName,
    className: r.className,
    marks: r.marks as any,
    teacherRemarks: r.teacherRemarks || '',
    status: r.status as any,
    adminFeedback: r.adminFeedback || null,
    term: r.term || 'First Term',
    session: r.session || '2026/2027',
    endorsedAt: r.endorsedAt ? r.endorsedAt.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString()
  }
}
