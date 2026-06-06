'use server'

import { db } from '@/lib/db'
import { assessment, assessmentQuestion, assessmentResult, studentAnswer } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function submitCBT(assessmentId: string, studentId: string, answers: { questionId: string, answer: string }[]) {
  const resultId = crypto.randomUUID()

  const assessmentData = await db.query.assessment.findFirst({
    where: eq(assessment.id, assessmentId),
    with: {
      questions: true
    }
  })

  if (!assessmentData) throw new Error('Assessment not found')

  let totalScore = 0
  const studentAnswers = []

  for (const q of assessmentData.questions) {
    const studentAns = answers.find(a => a.questionId === q.id)
    const isCorrect = studentAns?.answer === q.correctAnswer
    const score = isCorrect ? q.marks : 0
    if (isCorrect) totalScore += score

    studentAnswers.push({
      id: crypto.randomUUID(),
      assessmentResultId: resultId,
      questionId: q.id,
      studentAnswer: studentAns?.answer || '',
      score,
      isCorrect,
    })
  }

  const percentage = (totalScore / assessmentData.totalMarks) * 100

  await db.insert(assessmentResult).values({
    id: resultId,
    assessmentId,
    studentId,
    totalScore,
    percentage: percentage.toFixed(2),
    status: 'completed',
    gradedAt: new Date(),
  })

  await db.insert(studentAnswer).values(studentAnswers)

  revalidatePath('/dashboard/student/results')
  return { resultId, totalScore, percentage }
}

export async function getUpcomingAssessments(classId: string) {
  // Logic to get assessments for a class
  // For now return all published
  return db.query.assessment.findMany({
    where: eq(assessment.status, 'published'),
    with: {
      subject: true
    }
  })
}
