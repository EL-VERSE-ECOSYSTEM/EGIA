'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { assessment, assessmentQuestion, assessmentResult, studentAnswer, userRole, teacher } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { checkPermission } from '@/lib/abac'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function getUserRoleData(userId: string) {
  return await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  })
}

export async function createAssessment(data: {
  title: string
  subjectId: string
  assessmentType: 'quiz' | 'test' | 'exam' | 'assignment'
  totalMarks: number
  scheduleDate: Date
  duration?: number
}) {
  const userId = await getUserId()
  const roleData = await getUserRoleData(userId)

  const hasPermission = await checkPermission(
    userId,
    roleData?.role || '',
    'create',
    'assessment'
  )

  if (!hasPermission) throw new Error('Permission denied')

  return db.insert(assessment).values({
    id: crypto.randomUUID(),
    ...data,
    status: 'published',
    createdBy: userId,
  }).returning()
}

export async function submitAssessment(assessmentId: string, answers: { questionId: string, answer: string }[]) {
  const userId = await getUserId()
  const roleData = await getUserRoleData(userId)

  const hasPermission = await checkPermission(
    userId,
    roleData?.role || '',
    'create',
    'result'
  )

  if (!hasPermission) throw new Error('Permission denied')

  const newResult = await db.insert(assessmentResult).values({
    id: crypto.randomUUID(),
    assessmentId,
    studentId: userId,
    status: 'submitted',
    createdAt: new Date(),
  }).returning()

  const resultId = newResult[0].id

  await Promise.all(answers.map(a =>
    db.insert(studentAnswer).values({
      id: crypto.randomUUID(),
      assessmentResultId: resultId,
      questionId: a.questionId,
      studentAnswer: a.answer,
    })
  ))

  await mockAiGrading(resultId)

  revalidatePath('/dashboard/student/assessments')
  return { success: true, resultId }
}

async function mockAiGrading(resultId: string) {
  const result = await db.query.assessmentResult.findFirst({
    where: eq(assessmentResult.id, resultId),
    with: {
      assessment: {
        with: {
          questions: true
        }
      },
      answers: true
    }
  })

  if (!result) return

  let score = 0
  const totalPossible = result.assessment.totalMarks

  result.answers.forEach(answer => {
    const question = result.assessment.questions.find(q => q.id === answer.questionId)
    if (question && question.correctAnswer === answer.studentAnswer) {
      score += question.marks
    }
  })

  const percentage = (score / (totalPossible || 1)) * 100
  let grade = 'F'
  if (percentage >= 70) grade = 'A'
  else if (percentage >= 60) grade = 'B'
  else if (percentage >= 50) grade = 'C'
  else if (percentage >= 45) grade = 'D'
  else if (percentage >= 40) grade = 'E'

  await db.update(assessmentResult)
    .set({
      totalScore: score,
      percentage: percentage.toFixed(2),
      grade,
      status: 'graded',
      gradedAt: new Date(),
      feedback: 'AI-Graded: Excellent effort! Focus on your weak areas as identified in the report.',
    })
    .where(eq(assessmentResult.id, resultId))
}

export async function getStudentResults() {
  const userId = await getUserId()
  return db.query.assessmentResult.findMany({
    where: eq(assessmentResult.studentId, userId),
    with: {
      assessment: {
        with: {
          subject: true
        }
      }
    }
  })
}
