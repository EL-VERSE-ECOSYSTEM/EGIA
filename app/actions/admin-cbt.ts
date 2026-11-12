'use server'

import { db } from '@/lib/db'
import { assessment, teacher, user, userRole, notification } from '@/lib/db/schema'
import { eq, desc, and, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { randomInt } from 'crypto'
import { sendPushNotification } from '@/lib/services/notifications'

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
  const isExam = record.type === 'EXAM_CBT'
  const accessCode = action === 'approve' && isExam
    ? (record.accessCode || generateSecureAccessCode())
    : null

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

  if (action === 'approve') {
    const recipients = new Map<string, string>()
    if (record.createdBy) {
      const owner = await db.query.teacher.findFirst({ where: eq(teacher.id, record.createdBy) })
      if (owner?.userId) recipients.set(owner.userId, '/dashboard/teacher/assessments/drafts')
    }
    if (record.schoolId) {
      const adminRoles = await db.query.userRole.findMany({
        where: inArray(userRole.role, ['ADMIN', 'SCHOOL_ADMIN']),
      })
      const adminIds = adminRoles.map((item) => item.userId)
      if (adminIds.length) {
        const admins = await db.query.user.findMany({
          where: and(eq(user.schoolId, record.schoolId), inArray(user.id, adminIds)),
        })
        for (const admin of admins) recipients.set(admin.id, '/dashboard/admin/assessments')
      }
    }
    const uniqueRecipients = [...recipients.keys()]
    const title = isExam ? 'Exam CBT approved' : 'CBT approved'
    const body = isExam
      ? `${record.title} is approved${accessCode ? `. Access code: ${accessCode}` : ''}.`
      : `${record.title} has been approved.`
    for (const userId of uniqueRecipients) {
      await db.insert(notification).values({
        id: crypto.randomUUID(), userId, schoolId: record.schoolId,
        title, message: body, type: 'CBT_APPROVAL',
        metadata: { assessmentId, accessCode: isExam ? accessCode : null },
        actionUrl: recipients.get(userId),
      })
      try {
        await sendPushNotification({
          userId, title, body, type: 'CBT_APPROVAL',
          data: { assessmentId, accessCode: isExam ? accessCode : null },
          link: recipients.get(userId),
          eventKey: `cbt-approved:${assessmentId}:${userId}`,
        })
      } catch (error) {
        console.warn('CBT approval push notification could not be delivered:', error)
      }
    }
  }

  revalidatePath('/dashboard/admin/assessments/pending')
  revalidatePath('/dashboard/teacher/assessments')
  revalidatePath('/dashboard/teacher/assessments/drafts')
  revalidatePath('/dashboard/admin/assessments')
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
