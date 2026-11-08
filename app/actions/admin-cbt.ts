'use server'

import { db } from '@/lib/db'
import { assessment, teacher } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { randomInt } from 'crypto'

function generateSecureAccessCode(): string {
  return randomInt(100000, 999999).toString()
}

interface AssessmentScopeUser {
  role: string
  schoolId: string | null
  adminLevel?: string | null
  department?: string | null
}

interface AssessmentScopeRecord {
  schoolId: string | null
  subject?: { departments?: string[] | null } | null
}

function hasAssessmentScope(user: AssessmentScopeUser, record: AssessmentScopeRecord) {
  if (user.role === 'SUPER_ADMIN') return true
  if (!user.schoolId || record.schoolId !== user.schoolId) return false
  if (!user.adminLevel?.startsWith('HOD_')) return true

  const department = user.department?.toLowerCase()
  return Boolean(department && record.subject?.departments?.some(
    (value) => value.toLowerCase() === department
  ))
}

export async function getPendingAssessments() {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return []
  }

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
    hasAssessmentScope(session.user, a)
  )
}

export async function getAllAdminAssessments() {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return []
  }

  const allAssessments = await db.query.assessment.findMany({
    orderBy: [desc(assessment.updatedAt)],
    with: {
      questions: true,
      subject: true,
      teacher: true
    }
  })

  return allAssessments.filter(a => hasAssessmentScope(session.user, a))
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

  const record = await db.query.assessment.findFirst({
    where: eq(assessment.id, assessmentId),
    with: { subject: true },
  })

  if (!record) {
    throw new Error('Assessment not found')
  }

  if (!hasAssessmentScope(session.user, record)) {
    throw new Error('Forbidden: Assessment is outside your school or department scope.')
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

  const record = await db.query.assessment.findFirst({
    where: eq(assessment.id, assessmentId),
    with: { subject: true },
  })

  if (!record) throw new Error('Assessment record not found.')
  if (!hasAssessmentScope(session.user, record)) {
    throw new Error('Forbidden: Assessment is outside your school or department scope.')
  }
  if (session.user.role === 'TEACHER') {
    const teacherProfile = await db.query.teacher.findFirst({ where: eq(teacher.userId, session.user.id) })
    if (!teacherProfile || record.createdBy !== teacherProfile.id) {
      throw new Error('Teachers can only schedule their own assessments.')
    }
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
