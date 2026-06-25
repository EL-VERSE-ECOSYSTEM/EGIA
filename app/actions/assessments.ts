'use server'

import { db } from '@/lib/db'
import { assessment, assessmentQuestion, assessmentResult, studentAnswer } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

function calculateGrade(percentage: number) {
  if (percentage >= 90) return 'A'
  if (percentage >= 75) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  if (percentage >= 40) return 'E'
  return 'F'
}

export async function submitCBT(assessmentId: string, studentId: string, answers: { questionId: string, answer: any }[]) {
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
    const submittedAnswer = studentAns?.answer

    let isCorrect = false
    let score = 0

    if (q.questionType === 'MCQ_SINGLE' || q.questionType === 'TRUE_FALSE') {
      isCorrect = submittedAnswer === q.correctAnswer
    } else if (q.questionType === 'MCQ_MULTIPLE') {
      const correctOptions = q.correctAnswer?.split(',').map(s => s.trim()).sort() || []
      const submittedOptions = Array.isArray(submittedAnswer) ? [...submittedAnswer].sort() : []
      isCorrect = JSON.stringify(correctOptions) === JSON.stringify(submittedOptions)
    } else if (q.questionType === 'FILL_BLANK') {
      const correctBlanks = q.correctAnswer?.split(',').map(s => s.trim().toLowerCase()) || []
      const submittedBlanks = Array.isArray(submittedAnswer) ? submittedAnswer.map(s => s.trim().toLowerCase()) : []
      isCorrect = JSON.stringify(correctBlanks) === JSON.stringify(submittedBlanks)
    } else if (q.questionType === 'SHORT_ANSWER') {
      isCorrect = submittedAnswer?.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase()
    }

    score = isCorrect ? q.marks : 0
    if (isCorrect) totalScore += score

    studentAnswers.push({
      id: crypto.randomUUID(),
      assessmentResultId: resultId,
      questionId: q.id,
      studentAnswer: typeof submittedAnswer === 'string' ? submittedAnswer : JSON.stringify(submittedAnswer),
      score,
      isCorrect,
    })
  }

  const percentage = (totalScore / assessmentData.totalMarks) * 100
  const grade = calculateGrade(percentage)

  await db.insert(assessmentResult).values({
    id: resultId,
    assessmentId,
    studentId,
    totalScore,
    percentage: Number(percentage.toFixed(2)),
    grade,
    status: 'completed',
    gradedAt: new Date(),
  })

  await db.insert(studentAnswer).values(studentAnswers)

  revalidatePath('/dashboard/student/results')
  return { resultId, totalScore, percentage, grade }
}

export async function getUpcomingAssessments(classId: string) {
  return db.query.assessment.findMany({
    where: eq(assessment.status, 'published'),
    with: {
      subject: true
    }
  })
}

export async function getAssessmentWithQuestions(id: string) {
  return db.query.assessment.findFirst({
    where: eq(assessment.id, id),
    with: {
      questions: {
        orderBy: (assessmentQuestion, { asc }) => [asc(assessmentQuestion.sequenceNumber)]
      },
      subject: true
    }
  })
}
