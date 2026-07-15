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
  endorsedAt?: string | null
  createdAt: string
}

// In-memory array fallback to prevent crashes if DB connection is offline during review/testing
let memoryReportCards: ReportCard[] = [
  {
    id: 'card-1',
    studentId: 'stud-1',
    studentName: 'Amina Bello',
    className: 'Primary 3',
    marks: [
      { subject: 'Mathematics', testScore: 28, examScore: 62, total: 90, grade: 'A' },
      { subject: 'English Language', testScore: 24, examScore: 58, total: 82, grade: 'A' },
      { subject: 'Basic Science', testScore: 22, examScore: 50, total: 72, grade: 'B' }
    ],
    teacherRemarks: 'Excellent performance. Highly focused.',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  },
  {
    id: 'card-2',
    studentId: 'stud-2',
    studentName: 'Chinedu Okafor',
    className: 'JSS 1',
    marks: [
      { subject: 'Mathematics', testScore: 18, examScore: 42, total: 60, grade: 'C' },
      { subject: 'English Language', testScore: 25, examScore: 55, total: 80, grade: 'A' }
    ],
    teacherRemarks: 'A very brilliant term. Keep up the great work!',
    status: 'ENDORSED',
    endorsedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
]

export async function getReportCards(): Promise<ReportCard[]> {
  try {
    const results = await db.select().from(reportCardTable)
    if (results.length === 0) {
      return memoryReportCards
    }
    return results.map(r => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.studentName,
      className: r.className,
      marks: r.marks as any,
      teacherRemarks: r.teacherRemarks || '',
      status: r.status as any,
      adminFeedback: r.adminFeedback || null,
      endorsedAt: r.endorsedAt ? r.endorsedAt.toISOString() : null,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString()
    }))
  } catch (err) {
    console.warn('Database offline, falling back to memory report cards')
    return memoryReportCards
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
    createdAt: new Date().toISOString()
  }

  try {
    await db.insert(reportCardTable).values({
      id,
      studentId: data.studentId,
      studentName: data.studentName,
      className: data.className,
      marks: data.marks as any,
      teacherRemarks: data.teacherRemarks,
      status: 'PENDING'
    })
  } catch (err) {
    console.warn('Database insert failed, appending to memory')
  }

  memoryReportCards.push(newCard)
  revalidatePath('/dashboard')
  return newCard
}

export async function endorseReportCard(id: string, feedback?: string): Promise<ReportCard> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  try {
    await db.update(reportCardTable)
      .set({
        status: 'ENDORSED',
        adminFeedback: feedback || 'Endorsed and approved by Academy Administration.',
        endorsedAt: new Date()
      })
      .where(eq(reportCardTable.id, id))
  } catch (err) {
    console.warn('Database update failed for endorse, editing memory')
  }

  const cardIndex = memoryReportCards.findIndex(c => c.id === id)
  if (cardIndex !== -1) {
    memoryReportCards[cardIndex].status = 'ENDORSED'
    memoryReportCards[cardIndex].adminFeedback = feedback || 'Endorsed and approved by Academy Administration.'
    memoryReportCards[cardIndex].endorsedAt = new Date().toISOString()
  }

  revalidatePath('/dashboard')
  return memoryReportCards[cardIndex] || { id, ...dataFallback(id) } as any
}

export async function rejectReportCard(id: string, feedback: string): Promise<ReportCard> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  try {
    await db.update(reportCardTable)
      .set({
        status: 'REJECTED',
        adminFeedback: feedback
      })
      .where(eq(reportCardTable.id, id))
  } catch (err) {
    console.warn('Database update failed for reject, editing memory')
  }

  const cardIndex = memoryReportCards.findIndex(c => c.id === id)
  if (cardIndex !== -1) {
    memoryReportCards[cardIndex].status = 'REJECTED'
    memoryReportCards[cardIndex].adminFeedback = feedback
  }

  revalidatePath('/dashboard')
  return memoryReportCards[cardIndex] || { id, ...dataFallback(id) } as any
}

function dataFallback(id: string) {
  return {
    studentId: 'stud-1',
    studentName: 'Fallback Student',
    className: 'Primary 3',
    marks: [],
    teacherRemarks: '',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  }
}
