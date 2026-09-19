'use server'

import { db } from '@/lib/db'
import { assessment, user } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { randomInt } from 'crypto'

function generateSecureAccessCode(): string {
  return randomInt(100000, 999999).toString()
}

export async function getPendingAssessments() {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return []
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id)
  })

  const allAssessments = await db.query.assessment.findMany({
    orderBy: [desc(assessment.createdAt)],
    with: {
      questions: true,
      subject: true,
      teacher: true
    }
  })

  return allAssessments.filter(a =>
    (a.status === 'pending_approval' || a.status === 'draft') &&
    (!currentUser?.schoolId || !a.schoolId || a.schoolId === currentUser.schoolId)
  )
}

export async function getAllAdminAssessments() {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return []
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id)
  })

  const allAssessments = await db.query.assessment.findMany({
    orderBy: [desc(assessment.updatedAt)],
    with: {
      questions: true,
      subject: true,
      teacher: true
    }
  })

  return allAssessments.filter(a =>
    !currentUser?.schoolId || !a.schoolId || a.schoolId === currentUser.schoolId
  )
}

export async function handleCBTDecision(
  assessmentId: string,
  action: 'approve' | 'reject',
  comment: string,
  scheduledDate?: string,
  scheduledTime?: string
) {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized')
  }

  const currentUser = await db.query.user.findFirst({ where: eq(user.id, session.user.id) })

  const record = await db.query.assessment.findFirst({
    where: eq(assessment.id, assessmentId)
  })

  if (!record) {
    throw new Error('Assessment not found')
  }

  if (currentUser?.schoolId && record.schoolId && record.schoolId !== currentUser.schoolId) {
    throw new Error('Forbidden: Cannot modify assessment from another school.')
  }

  const finalStatus = action === 'approve' ? 'approved' : 'rejected'
  let accessCode = record.accessCode

  if (action === 'approve') {
    accessCode = accessCode || generateSecureAccessCode()
  }

  await db.update(assessment)
    .set({
      status: finalStatus,
      adminComment: comment || '',
      accessCode: accessCode,
      scheduledDate: scheduledDate || record.scheduledDate || null,
      scheduledTime: scheduledTime || record.scheduledTime || null,
      updatedAt: new Date()
    })
    .where(eq(assessment.id, assessmentId))

  revalidatePath('/dashboard/admin/assessments/pending')
  revalidatePath('/dashboard/teacher/assessments')
  return { success: true, accessCode }
}

export async function scheduleCBTExam(assessmentId: string, scheduledDate: string, scheduledTime: string) {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'TEACHER' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized')
  }

  const currentUser = await db.query.user.findFirst({ where: eq(user.id, session.user.id) })
  const record = await db.query.assessment.findFirst({ where: eq(assessment.id, assessmentId) })

  if (!record) throw new Error('Assessment record not found.')
  if (currentUser?.schoolId && record.schoolId && record.schoolId !== currentUser.schoolId) {
    throw new Error('Forbidden: Assessment school tenant mismatch.')
  }

  await db.update(assessment)
    .set({
      scheduledDate,
      scheduledTime,
      updatedAt: new Date()
    })
    .where(eq(assessment.id, assessmentId))

  revalidatePath('/dashboard/admin/assessments')
  revalidatePath('/dashboard/teacher/assessments')
  return { success: true }
}
