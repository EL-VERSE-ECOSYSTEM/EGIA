'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { assessment, assessmentQuestion, userRole, teacher } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function getTeacherId(userId: string) {
  const teacherRecord = await db.query.teacher.findFirst({
    where: eq(teacher.userId, userId),
  })
  if (!teacherRecord) throw new Error('Teacher record not found')
  return teacherRecord.id
}

export async function createAssessment(data: {
  title: string
  subjectId: number
  assessmentType: 'quiz' | 'test' | 'exam' | 'assignment'
  description?: string
  totalMarks: number
  duration?: number
  scheduleDate: Date
}) {
  const userId = await getUserId()
  const teacherId = await getTeacherId(userId)

  const newAssessment = await db.insert(assessment).values({
    title: data.title,
    subjectId: data.subjectId,
    assessmentType: data.assessmentType,
    description: data.description,
    totalMarks: data.totalMarks,
    duration: data.duration,
    scheduleDate: data.scheduleDate,
    createdBy: teacherId,
    status: 'draft',
  }).returning()

  return newAssessment[0]
}

export async function addQuestion(assessmentId: number, data: {
  questionText: string
  questionType: 'multiple_choice' | 'short_answer' | 'essay'
  marks: number
  options?: string[]
  correctAnswer?: string
  sequenceNumber: number
}) {
  const userId = await getUserId()
  await getTeacherId(userId)

  const newQuestion = await db.insert(assessmentQuestion).values({
    assessmentId,
    questionText: data.questionText,
    questionType: data.questionType,
    marks: data.marks,
    options: data.options ? JSON.stringify(data.options) : null,
    correctAnswer: data.correctAnswer,
    sequenceNumber: data.sequenceNumber,
  }).returning()

  return newQuestion[0]
}

export async function getAssessments(teacherId?: number) {
  if (!teacherId) {
    const userId = await getUserId()
    const teacher_ = await db.query.teacher.findFirst({
      where: eq(teacher.userId, userId),
    })
    if (!teacher_) throw new Error('Teacher not found')
    teacherId = teacher_.id
  }

  return db.query.assessment.findMany({
    where: eq(assessment.createdBy, teacherId),
  })
}

export async function publishAssessment(assessmentId: number) {
  const userId = await getUserId()
  await getTeacherId(userId)

  const result = await db.update(assessment)
    .set({
      status: 'published',
    })
    .where(eq(assessment.id, assessmentId))
    .returning()

  return result[0]
}
