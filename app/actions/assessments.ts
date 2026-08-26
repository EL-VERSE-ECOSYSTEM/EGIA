'use server'

import { db } from '@/lib/db'
import { assessment, assessmentQuestion, assessmentResult, studentAnswer, student, teacher, term } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'

function calculateGrade(percentage: number) {
  if (percentage >= 90) return 'A'
  if (percentage >= 75) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  if (percentage >= 40) return 'E'
  return 'F'
}

export async function submitCBT(assessmentId: string, studentId: string, answers: { questionId: string, answer: any }[]) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'STUDENT') throw new Error('Unauthorized')
  const currentStudent = await db.query.student.findFirst({ where: eq(student.userId, session.user.id) })
  if (!currentStudent || currentStudent.id !== studentId) throw new Error('You can only submit your own assessment.')
  const resultId = crypto.randomUUID()

  const assessmentData = await db.query.assessment.findFirst({
    where: eq(assessment.id, assessmentId),
    with: {
      questions: true
    }
  })

  if (!assessmentData) throw new Error('Assessment not found')

  // Check School Scoping
  if (assessmentData.schoolId && currentStudent.schoolId && assessmentData.schoolId !== currentStudent.schoolId) {
    throw new Error('This assessment is not available for your school.')
  }

  // Check Approval Status
  if (assessmentData.status !== 'approved' && assessmentData.status !== 'published') {
    throw new Error('This assessment has not been approved by your School Admin.')
  }

  let totalScore = 0
  const studentAnswers: any[] = []
  let correctCount = 0

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

    score = isCorrect ? (q.points || 0) : 0
    if (isCorrect) {
      totalScore += score
      correctCount += 1
    }

    studentAnswers.push({
      id: crypto.randomUUID(),
      assessmentResultId: resultId,
      questionId: q.id,
      studentAnswer: typeof submittedAnswer === 'string' ? submittedAnswer : JSON.stringify(submittedAnswer),
      score,
      isCorrect,
    })
  }

  const percentage = (totalScore / (assessmentData.totalPoints || 1)) * 100
  const grade = calculateGrade(percentage)

  await db.insert(assessmentResult).values({
    id: resultId,
    assessmentId,
    studentId,
    score: Number(percentage.toFixed(2)),
    totalQuestions: assessmentData.questions.length,
    correctAnswers: correctCount,
    timeSpent: 0,
    status: 'completed',
    gradedBy: null,
    assessmentVideo: null,
    warningCount: 0,
    proctorLogs: null,
    createdAt: new Date(),
  } as any)

  await db.insert(studentAnswer).values(studentAnswers as any)

  revalidatePath('/dashboard/student/results')
  return { resultId, totalScore, percentage, grade }
}

export async function saveProctoredAssessmentResult(data: {
  assessmentId: string
  studentId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  timeSpent: number
  status: string
  assessmentVideo: string
  warningCount: number
  proctorLogs: any
}) {
  const resultId = crypto.randomUUID()

  await db.insert(assessmentResult).values({
    id: resultId,
    assessmentId: data.assessmentId,
    studentId: data.studentId,
    score: data.score,
    totalQuestions: data.totalQuestions,
    correctAnswers: data.correctAnswers,
    timeSpent: data.timeSpent,
    status: data.status,
    assessmentVideo: data.assessmentVideo || null,
    warningCount: data.warningCount,
    proctorLogs: data.proctorLogs || null,
    createdAt: new Date()
  } as any)

  return { success: true, resultId }
}

export async function getUpcomingAssessments(classId: string, schoolId?: string) {
  const all = await db.query.assessment.findMany({
    with: {
      subject: true
    }
  })

  return all.filter(a =>
    (a.status === 'published' || a.status === 'approved') &&
    (!schoolId || !a.schoolId || a.schoolId === schoolId)
  )
}

export async function getApprovedCBTs(schoolId?: string) {
  const all = await db.query.assessment.findMany({
    with: {
      subject: true,
      questions: true
    }
  })

  return all.filter(a =>
    a.status === 'approved' &&
    (!schoolId || !a.schoolId || a.schoolId === schoolId)
  )
}

export async function getAssessmentWithQuestions(id: string, providedAccessCode?: string) {
  const dbAssessment = await db.query.assessment.findFirst({
    where: eq(assessment.id, id),
    with: {
      questions: {
        orderBy: (assessmentQuestion, { asc }) => [asc(assessmentQuestion.order)]
      },
      subject: true
    }
  })

  if (!dbAssessment) return null

  // If assessment requires an access code, verify it
  if (dbAssessment.accessCode && dbAssessment.accessCode.trim().length > 0) {
    if (!providedAccessCode || providedAccessCode.trim().toUpperCase() !== dbAssessment.accessCode.trim().toUpperCase()) {
      throw new Error('Invalid or missing CBT Access Code for this exam.')
    }
  }

  return dbAssessment
}

export async function saveAssessmentWithQuestions(assessmentData: any, questions: any[]) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'TEACHER') throw new Error('Unauthorized')
  const teacherProfile = await db.query.teacher.findFirst({ where: eq(teacher.userId, session.user.id) })
  if (!teacherProfile) throw new Error('Teacher profile not found')
  const currentTerm = await db.query.term.findFirst({ where: eq(term.isCurrent, true) })
  if (!currentTerm) throw new Error('No current academic term is configured')
  if (!questions.length) throw new Error('Add at least one question before publishing an assessment')
  const assessmentId = crypto.randomUUID()

  // Generate random 6-character access code for EXAM type
  const generatedAccessCode = assessmentData.type === 'EXAM_CBT'
    ? Math.random().toString(36).substring(2, 8).toUpperCase()
    : null

  return await db.transaction(async (tx) => {
    await tx.insert(assessment).values({
      id: assessmentId,
      schoolId: teacherProfile.schoolId || null,
      title: assessmentData.title,
      description: assessmentData.description,
      subjectId: assessmentData.subjectId,
      termId: currentTerm.id,
      createdBy: teacherProfile.id,
      duration: assessmentData.duration,
      type: assessmentData.type || 'ASSESSMENT_CBT',
      status: 'draft', // Submitted for School Admin approval
      accessCode: generatedAccessCode,
      passingScore: assessmentData.passingScore || 40,
      totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0),
    } as any)

    const questionInserts = questions.map((q, idx) => ({
      id: crypto.randomUUID(),
      assessmentId: assessmentId,
      questionText: q.question,
      questionType: q.type,
      options: q.options || null,
      correctAnswer: Array.isArray(q.answer) ? q.answer.join(',') : String(q.answer),
      points: q.points || 1,
      explanation: q.explanation || null,
      order: idx + 1
    }))

    if (questionInserts.length > 0) {
      await tx.insert(assessmentQuestion).values(questionInserts as any)
    }

    return { assessmentId, accessCode: generatedAccessCode }
  })
}

export async function getLoggedInStudentAndQuestions(assessmentId: string, providedAccessCode?: string) {
  const session = await auth.getSession()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const studentProfile = await db.query.student.findFirst({
    where: eq(student.userId, session.user.id)
  })

  if (!studentProfile) throw new Error('Student profile not found.')

  const dbAssessment = await getAssessmentWithQuestions(assessmentId, providedAccessCode)

  if (!dbAssessment || !dbAssessment.questions?.length) {
    throw new Error('This assessment is unavailable or has no questions.')
  }

  // School Scoping check
  if (dbAssessment.schoolId && studentProfile.schoolId && dbAssessment.schoolId !== studentProfile.schoolId) {
    throw new Error('This assessment is not available for your school.')
  }

  const questionsList = dbAssessment.questions.map(q => ({
    id: q.id,
    text: q.questionText,
    options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [],
    answer: q.correctAnswer || ''
  }))

  return {
    studentId: studentProfile.id,
    questions: questionsList,
    title: dbAssessment?.title || 'Assessment CBT'
  }
}
