'use server'

import { db } from '@/lib/db'
import { assessment } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'

// Helper to generate a 6 digit alphanumeric code
function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function getPendingAssessments() {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'admin')) {
    return []
  }

  return await db.query.assessment.findMany({
    where: eq(assessment.status, 'pending_approval'),
    with: {
      questions: true,
      subject: true,
      teacher: true
    }
  })
}

export async function getAllAdminAssessments() {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'admin')) {
    return []
  }

  return await db.query.assessment.findMany({
    orderBy: [desc(assessment.updatedAt)],
    with: {
      questions: true,
      subject: true,
      teacher: true
    }
  })
}

export async function handleCBTDecision(assessmentId: string, action: 'approve' | 'reject', comment: string) {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'admin')) {
    throw new Error('Unauthorized')
  }

  const record = await db.query.assessment.findFirst({
    where: eq(assessment.id, assessmentId)
  })

  if (!record) {
    throw new Error('Assessment not found')
  }

  const finalStatus = action === 'approve' ? 'approved' : 'rejected'
  let accessCode = record.accessCode

  // Generate code only if type is EXAM_CBT and we are approving it
  if (action === 'approve' && record.type === 'EXAM_CBT') {
    accessCode = generateAccessCode()
  }

  await db.update(assessment)
    .set({
      status: finalStatus,
      adminComment: comment || '',
      accessCode: accessCode,
      updatedAt: new Date()
    })
    .where(eq(assessment.id, assessmentId))

  revalidatePath('/dashboard/admin/assessments/pending')
  revalidatePath('/dashboard/teacher/assessments')
  return { success: true, accessCode }
}
