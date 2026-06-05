'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { assessment, question, userRole } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function isTeacher() {
  const userId = await getUserId()
  const role = await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  })
  if (role?.role !== 'teacher') throw new Error('Teacher access required')
  return true
}

export async function createAssessment(data: {
  title: string
  subject: string
  class: string
  description?: string
  totalMarks: number
  duration: number
  deadline?: Date
}) {
  await isTeacher()
  const userId = await getUserId()

  const newAssessment = await db.insert(assessment).values({
    id: crypto.randomUUID(),
    title: data.title,
    subject: data.subject,
    class: data.class,
    description: data.description,
    totalMarks: data.totalMarks,
    duration: data.duration,
    deadline: data.deadline,
    createdBy: userId,
    status: 'draft',
    createdAt: new Date(),
  }).returning()

  return newAssessment[0]
}

export async function addQuestion(assessmentId: string, data: {
  questionText: string
  questionType: 'mcq' | 'shortAnswer' | 'essay'
  marks: number
  options?: string[]
  correctAnswer?: string
  sequence: number
}) {
  await isTeacher()

  const newQuestion = await db.insert(question).values({
    id: crypto.randomUUID(),
    assessmentId,
    questionText: data.questionText,
    questionType: data.questionType,
    marks: data.marks,
    options: data.options ? JSON.stringify(data.options) : null,
    correctAnswer: data.correctAnswer,
    sequence: data.sequence,
  }).returning()

  return newQuestion[0]
}

export async function getAssessments(userId?: string) {
  if (!userId) {
    const currentUserId = await getUserId()
    userId = currentUserId
  }

  return db.query.assessment.findMany({
    where: eq(assessment.createdBy, userId),
    with: {
      questions: true,
    },
  })
}

export async function publishAssessment(assessmentId: string) {
  await isTeacher()

  const result = await db.update(assessment)
    .set({
      status: 'published',
    })
    .where(eq(assessment.id, assessmentId))
    .returning()

  return result[0]
}
