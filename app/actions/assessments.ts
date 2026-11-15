'use server'

import { db } from '@/lib/db'
import { assessment, assessmentQuestion, assessmentResult, studentAnswer, student, teacher, term, assessmentSchedule, cbtSessions, feeStructure, payment, parent, subject, class_, teacherOnSubject } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { randomInt } from 'crypto'
import { getCbtFeeClearance, CBT_FEE_CLEARANCE_PERCENTAGE } from '@/lib/fees/cbt-clearance'
import { notifyUser } from '@/lib/notifications/triggers'
import { getTeacherClassResultsAction } from '@/app/actions/teacher'
import { canSchoolAdminAccess } from '@/lib/auth/school-admin-permissions'
import { rateLimit } from '@/lib/rate-limit'
import type { PushNotification } from '@/lib/firebase/types'
import { isValidExamAccessCode } from '@/lib/assessments/access-code'
import { claimFeeReminder, releaseFeeReminderClaim } from '@/lib/fees/fee-reminder-claims'

type SubmittedCbtAnswer = { questionId: string; answer: string | string[] }
type ProctorLogEntry = { timestamp: string; type: string; message: string }

async function getCbtFeeStatus(studentProfile: typeof student.$inferSelect) {
  if (!studentProfile.schoolId) {
    return {
      ...getCbtFeeClearance([], [], studentProfile.department),
      paidPercentage: 0,
      eligible: false,
    }
  }

  const [fees, payments] = await Promise.all([
    db.query.feeStructure.findMany({
      where: and(
        eq(feeStructure.schoolId, studentProfile.schoolId),
        eq(feeStructure.class, studentProfile.class),
        eq(feeStructure.isActive, true),
      ),
    }),
    db.query.payment.findMany({
      where: and(
        eq(payment.schoolId, studentProfile.schoolId),
        eq(payment.studentId, studentProfile.id),
      ),
    }),
  ])
  return getCbtFeeClearance(fees, payments, studentProfile.department)
}

function assertCbtFeeCleared(clearance: Awaited<ReturnType<typeof getCbtFeeStatus>>) {
  if (clearance.eligible) return
  throw new Error(
    `CBT access is locked until at least ${clearance.requiredPercentage}% of school fees are paid. ` +
    `Your recorded payment is ${clearance.paidPercentage.toFixed(1)}%.`,
  )
}

function assertCbtAccessCode(userId: string, expectedCode: string | null, providedCode?: string) {
  const normalizedCode = providedCode?.trim().toUpperCase()
  const normalizedExpectedCode = expectedCode?.trim().toUpperCase()
  const isValid = Boolean(normalizedCode && normalizedExpectedCode &&
    isValidExamAccessCode(normalizedCode) && isValidExamAccessCode(normalizedExpectedCode) &&
    normalizedCode === normalizedExpectedCode)
  if (isValid) return

  const attempts = rateLimit(`cbt-access-code:${userId}`, 5, 5 * 60)
  if (!attempts.allowed) {
    throw new Error(`Too many code attempts. Try again in ${attempts.retryAfter} seconds.`)
  }
  throw new Error('Incorrect access code. Check the code provided by your school and try again.')
}

async function getStudentClassId(studentProfile: typeof student.$inferSelect) {
  if (!studentProfile.schoolId) return null
  const classRecord = await db.query.class_.findFirst({
    where: and(eq(class_.schoolId, studentProfile.schoolId), eq(class_.name, studentProfile.class)),
    columns: { id: true },
  })
  return classRecord?.id ?? null
}

async function isAssessmentTargetedToStudent(
  assessmentRecord: typeof assessment.$inferSelect,
  studentProfile: typeof student.$inferSelect,
  classId: string | null,
) {
  if (assessmentRecord.targetDepartment &&
    assessmentRecord.targetDepartment.trim().toLowerCase() !== studentProfile.department?.trim().toLowerCase()) {
    return false
  }
  if (assessmentRecord.targetClassId) return assessmentRecord.targetClassId === classId
  if (!classId) return false

  const legacyTarget = await db.query.teacherOnSubject.findFirst({
    where: and(
      eq(teacherOnSubject.teacherId, assessmentRecord.createdBy),
      eq(teacherOnSubject.subjectId, assessmentRecord.subjectId),
      eq(teacherOnSubject.classId, classId),
    ),
  })
  return Boolean(legacyTarget)
}

async function assertAssessmentTargetedToStudent(
  assessmentRecord: typeof assessment.$inferSelect,
  studentProfile: typeof student.$inferSelect,
) {
  const classId = await getStudentClassId(studentProfile)
  if (!await isAssessmentTargetedToStudent(assessmentRecord, studentProfile, classId)) {
    throw new Error('This assessment is assigned to a different class or department.')
  }
}

async function notifyFeeDefaulter(studentProfile: typeof student.$inferSelect, paidPercentage: number) {
  const recipients = [studentProfile.userId]
  if (studentProfile.parentId) {
    const linkedParent = await db.query.parent.findFirst({ where: eq(parent.id, studentProfile.parentId) })
    if (linkedParent?.userId && linkedParent.schoolId === studentProfile.schoolId) {
      recipients.push(linkedParent.userId)
    }
  }

  const notice: PushNotification = {
    title: 'School fee payment needed for CBT access',
    body: `At least ${CBT_FEE_CLEARANCE_PERCENTAGE}% of school fees must be paid before CBT access. Recorded payment: ${paidPercentage.toFixed(1)}%.`,
    type: 'payment_reminder',
    link: '/dashboard/student/assessments/cbt',
    data: { studentId: studentProfile.id, paidPercentage: paidPercentage.toFixed(1) },
  }
  await Promise.all(recipients.filter((id): id is string => Boolean(id)).map(async (userId) => {
    let claimed = false
    try {
      claimed = await claimFeeReminder(userId, studentProfile.id)
      if (claimed) await notifyUser(userId, notice)
    } catch (error) {
      if (claimed) await releaseFeeReminderClaim(userId, studentProfile.id)
      console.error('Could not send CBT fee clearance notifications:', {
        studentId: studentProfile.id,
        userId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }))
}

function sanitizeQuestionOptions(options: unknown): string[] {
  let parsed = options
  if (typeof parsed === 'string') {
    const rawOptions = parsed
    try {
      parsed = JSON.parse(parsed)
    } catch {
      return rawOptions.trim() ? [rawOptions] : []
    }
  }
  if (!Array.isArray(parsed)) return []
  return parsed.map((option: unknown) => {
    if (typeof option === 'string' || typeof option === 'number') return String(option)
    if (!option || typeof option !== 'object') return ''
    const record = option as Record<string, unknown>
    const label = record.label ?? record.text ?? record.value
    return typeof label === 'string' || typeof label === 'number' ? String(label) : ''
  }).filter(Boolean)
}

function shuffleOptions<T>(options: T[]) {
  const shuffled = [...options]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function calculateGrade(percentage: number) {
  if (percentage >= 90) return 'A'
  if (percentage >= 75) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  if (percentage >= 40) return 'E'
  return 'F'
}

export async function submitCBT(assessmentId: string, studentId: string, answers: SubmittedCbtAnswer[]) {
  const saved = await saveProctoredAssessmentResult({
    assessmentId,
    studentId,
    answers,
    timeSpent: 0,
    status: 'completed',
    warningCount: 0,
    proctorLogs: [],
  })
  const result = await db.query.assessmentResult.findFirst({
    where: eq(assessmentResult.id, saved.resultId),
  })
  const assessmentData = await db.query.assessment.findFirst({ where: eq(assessment.id, assessmentId) })
  const percentage = Number(result?.score || 0)
  return {
    resultId: saved.resultId,
    totalScore: Number(((percentage / 100) * Number(assessmentData?.totalPoints || 0)).toFixed(2)),
    percentage,
    grade: calculateGrade(percentage),
  }
}

export async function saveProctoredAssessmentResult(data: {
  assessmentId: string
  studentId: string
  answers: SubmittedCbtAnswer[]
  timeSpent: number
  status: 'completed' | 'failed_proctoring'
  assessmentVideo?: string
  warningCount: number
  proctorLogs: ProctorLogEntry[]
}) {
  const session = await auth.getSession()
  if (!session?.user || !['STUDENT', 'PUPIL'].includes(session.user.role.toUpperCase())) {
    throw new Error('Unauthorized')
  }

  const studentProfile = await db.query.student.findFirst({
    where: eq(student.userId, session.user.id)
  })

  if (!studentProfile || studentProfile.id !== data.studentId) {
    throw new Error('Forbidden: Student identity mismatch.')
  }

  const dbAssessment = await db.query.assessment.findFirst({
    where: eq(assessment.id, data.assessmentId),
    with: { questions: true },
  })

  if (!dbAssessment) throw new Error('Assessment not found.')
  if (!['approved', 'published'].includes(dbAssessment.status || '')) {
    throw new Error('This assessment is not currently available.')
  }

  if (!dbAssessment.schoolId || dbAssessment.schoolId !== studentProfile.schoolId) {
    throw new Error('Forbidden: Assessment tenant mismatch.')
  }
  await assertAssessmentTargetedToStudent(dbAssessment, studentProfile)
  if (['ASSESSMENT_CBT', 'EXAM_CBT'].includes(dbAssessment.type)) {
    assertCbtFeeCleared(await getCbtFeeStatus(studentProfile))
  }

  if (!Array.isArray(data.answers) || data.answers.length > dbAssessment.questions.length) {
    throw new Error('Invalid assessment answers.')
  }
  if (!['completed', 'failed_proctoring'].includes(data.status)) {
    throw new Error('Invalid assessment submission status.')
  }
  const answerMap = new Map<string, string | string[]>()
  for (const answer of data.answers) {
    if (!answer || typeof answer.questionId !== 'string' ||
      !(typeof answer.answer === 'string' || (Array.isArray(answer.answer) && answer.answer.every((item) => typeof item === 'string')))) {
      throw new Error('Invalid assessment answer.')
    }
    if (answer.answer.length > 4000 || (Array.isArray(answer.answer) && answer.answer.some((item) => item.length > 4000))) {
      throw new Error('Assessment answer is too long.')
    }
    if (answerMap.has(answer.questionId)) throw new Error('Duplicate assessment answer.')
    answerMap.set(answer.questionId, answer.answer)
  }

  const validQuestionIds = new Set(dbAssessment.questions.map((question) => question.id))
  if ([...answerMap.keys()].some((questionId) => !validQuestionIds.has(questionId))) {
    throw new Error('An answer references a question outside this assessment.')
  }

  const answerRows = dbAssessment.questions.map((question) => {
    const submitted = answerMap.get(question.id)
    const expected = question.correctAnswer || ''
    let isCorrect = false
    if (question.questionType === 'MCQ_SINGLE' || question.questionType === 'TRUE_FALSE') {
      isCorrect = typeof submitted === 'string' && submitted === expected
    } else if (question.questionType === 'MCQ_MULTIPLE') {
      const correct = expected.split(',').map((value) => value.trim()).sort()
      const provided = Array.isArray(submitted) ? submitted.map((value) => value.trim()).sort() : []
      isCorrect = JSON.stringify(correct) === JSON.stringify(provided)
    } else if (question.questionType === 'FILL_BLANK') {
      const correct = expected.split(',').map((value) => value.trim().toLowerCase())
      const submittedValues = Array.isArray(submitted)
        ? submitted
        : typeof submitted === 'string' ? submitted.split(',') : []
      const provided = submittedValues.map((value) => value.trim().toLowerCase())
      isCorrect = JSON.stringify(correct) === JSON.stringify(provided)
    } else if (question.questionType === 'SHORT_ANSWER') {
      isCorrect = typeof submitted === 'string' && submitted.trim().toLowerCase() === expected.trim().toLowerCase()
    }
    const pointsEarned = data.status === 'completed' && isCorrect ? Math.max(Math.trunc(Number(question.points) || 0), 0) : 0
    return {
      questionId: question.id,
      answerText: typeof submitted === 'string' ? submitted : JSON.stringify(submitted || ''),
      isCorrect: data.status === 'completed' && isCorrect,
      pointsEarned,
    }
  })
  const correctAnswers = answerRows.filter((answer) => answer.isCorrect).length
  const totalPoints = dbAssessment.questions.reduce((total, question) => total + Math.max(Number(question.points) || 0, 0), 0)
  const earnedPoints = answerRows.reduce((total, answer) => total + answer.pointsEarned, 0)
  const score = totalPoints > 0 ? Number(((earnedPoints / totalPoints) * 100).toFixed(2)) : 0
  const boundedTimeSpent = Number.isFinite(data.timeSpent) ? Math.max(0, Math.min(Math.trunc(data.timeSpent), 7_200)) : 0
  const warningCount = Number.isInteger(data.warningCount) ? Math.max(0, Math.min(data.warningCount, 100)) : 0
  const proctorLogs = Array.isArray(data.proctorLogs)
    ? data.proctorLogs.filter((entry): entry is ProctorLogEntry => Boolean(entry) && typeof entry === 'object')
      .slice(-100).map((entry) => ({
        timestamp: String(entry.timestamp || '').slice(0, 40),
        type: String(entry.type || '').slice(0, 80),
        message: String(entry.message || '').slice(0, 500),
      }))
    : []
  const assessmentVideo = typeof data.assessmentVideo === 'string' &&
    data.assessmentVideo.startsWith('data:video/') && data.assessmentVideo.length <= 1_400_000
    ? data.assessmentVideo
    : null

  const resultId = crypto.randomUUID()
  await db.transaction(async (tx) => {
    const activeSession = await tx.query.cbtSessions.findFirst({
      where: and(
        eq(cbtSessions.studentId, studentProfile.id),
        eq(cbtSessions.assessmentId, data.assessmentId),
        eq(cbtSessions.status, 'ONGOING'),
      ),
    })
    if (!activeSession) throw new Error('There is no active CBT session to submit.')

    const [claimedSession] = await tx.update(cbtSessions)
      .set({ status: 'COMPLETED', endedAt: new Date() })
      .where(and(eq(cbtSessions.id, activeSession.id), eq(cbtSessions.status, 'ONGOING')))
      .returning({ id: cbtSessions.id })
    if (!claimedSession) throw new Error('This CBT session has already been submitted.')

    const existingResult = await tx.query.assessmentResult.findFirst({
      where: and(
        eq(assessmentResult.assessmentId, data.assessmentId),
        eq(assessmentResult.studentId, studentProfile.id),
      ),
    })
    if (existingResult) throw new Error('You have already submitted this assessment.')

    await tx.insert(assessmentResult).values({
      id: resultId,
      assessmentId: data.assessmentId,
      studentId: studentProfile.id,
      score: score.toString(),
      totalQuestions: dbAssessment.questions.length,
      correctAnswers,
      timeSpent: boundedTimeSpent,
      status: data.status,
      assessmentVideo,
      warningCount,
      proctorLogs: JSON.stringify(proctorLogs),
      createdAt: new Date(),
    })

    if (answerRows.length) {
      await tx.insert(studentAnswer).values(answerRows.map((answer) => ({
        id: crypto.randomUUID(),
        assessmentResultId: resultId,
        questionId: answer.questionId,
        answerText: answer.answerText,
        pointsEarned: answer.pointsEarned,
        isCorrect: answer.isCorrect,
      })))
    }
  })

  revalidatePath('/dashboard/student/results')
  return {
    success: true,
    resultId,
    review: answerRows.map((answer) => ({
      questionId: answer.questionId,
      isCorrect: answer.isCorrect,
      correctAnswer: dbAssessment.questions.find((question) => question.id === answer.questionId)?.correctAnswer || '',
    })),
  }
}

export async function startCbtSession(assessmentId: string, providedAccessCode?: string) {
  const session = await auth.getSession()
  if (!session?.user || !['STUDENT', 'PUPIL'].includes(session.user.role.toUpperCase())) throw new Error('Unauthorized')
  const studentProfile = await db.query.student.findFirst({ where: eq(student.userId, session.user.id) })
  if (!studentProfile) throw new Error('Student profile not found.')
  const dbAssessment = await db.query.assessment.findFirst({ where: eq(assessment.id, assessmentId) })
  if (!dbAssessment || !['approved', 'published'].includes(dbAssessment.status || '')) throw new Error('This assessment is unavailable.')
  if (!dbAssessment.schoolId || dbAssessment.schoolId !== studentProfile.schoolId) {
    throw new Error('This assessment is not available for your school.')
  }
  await assertAssessmentTargetedToStudent(dbAssessment, studentProfile)
  if (['ASSESSMENT_CBT', 'EXAM_CBT'].includes(dbAssessment.type)) {
    assertCbtFeeCleared(await getCbtFeeStatus(studentProfile))
  }
  const existingResult = await db.query.assessmentResult.findFirst({
    where: and(eq(assessmentResult.assessmentId, assessmentId), eq(assessmentResult.studentId, studentProfile.id)),
  })
  if (existingResult) throw new Error('You have already submitted this assessment.')
  const active = await db.query.cbtSessions.findFirst({
    where: and(eq(cbtSessions.studentId, studentProfile.id), eq(cbtSessions.status, 'ONGOING')),
  })
  if (active) {
    if (active.assessmentId !== assessmentId) throw new Error('Finish your active CBT before starting another assessment.')
    return { sessionId: active.id }
  }
  if (dbAssessment.type === 'EXAM_CBT') {
    assertCbtAccessCode(session.user.id, dbAssessment.accessCode, providedAccessCode)
  } else if (dbAssessment.accessCode?.trim()) {
    assertCbtAccessCode(session.user.id, dbAssessment.accessCode, providedAccessCode)
  }
  const sessionId = crypto.randomUUID()
  await db.insert(cbtSessions).values({
    id: sessionId,
    assessmentId,
    studentId: studentProfile.id,
    accessCode: 'SESSION',
    status: 'ONGOING',
    startedAt: new Date(),
  })
  return { sessionId }
}

export async function verifyCbtAccessCode(assessmentId: string, providedAccessCode: string) {
  const session = await auth.getSession()
  if (!session?.user || !['STUDENT', 'PUPIL'].includes(session.user.role.toUpperCase())) {
    throw new Error('Student sign-in is required to verify an exam access code.')
  }
  if (typeof providedAccessCode !== 'string' || !isValidExamAccessCode(providedAccessCode.trim())) {
    throw new Error('Enter the 6-character alphanumeric exam access code provided by your school.')
  }
  const studentProfile = await db.query.student.findFirst({ where: eq(student.userId, session.user.id) })
  if (!studentProfile) throw new Error('Student profile not found.')
  assertCbtFeeCleared(await getCbtFeeStatus(studentProfile))

  const dbAssessment = await db.query.assessment.findFirst({ where: eq(assessment.id, assessmentId) })
  if (!dbAssessment || dbAssessment.type !== 'EXAM_CBT' || !['approved', 'published'].includes(dbAssessment.status || '')) {
    throw new Error('This exam is unavailable.')
  }
  if (!dbAssessment.schoolId || dbAssessment.schoolId !== studentProfile.schoolId) {
    throw new Error('This exam is not available for your school.')
  }
  await assertAssessmentTargetedToStudent(dbAssessment, studentProfile)
  assertCbtAccessCode(session.user.id, dbAssessment.accessCode, providedAccessCode)
  return { valid: true }
}

export async function getUpcomingAssessments(classId: string, schoolId?: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  const role = session.user.role.toUpperCase()
  let userSchoolId = role === 'SUPER_ADMIN' ? schoolId || session.user.schoolId : session.user.schoolId
  let studentProfile: typeof student.$inferSelect | null = null
  let studentClassId: string | null = null
  if (['STUDENT', 'PUPIL'].includes(role)) {
    studentProfile = await db.query.student.findFirst({ where: eq(student.userId, session.user.id) }) || null
    if (!studentProfile?.schoolId) return []
    userSchoolId = studentProfile.schoolId
    if (studentProfile) studentClassId = await getStudentClassId(studentProfile)
  }
  if (role !== 'SUPER_ADMIN' && !userSchoolId) return []

  const all = await db.query.assessment.findMany({
    with: {
      subject: true
    }
  })

  const studentAccess = studentProfile
    ? await Promise.all(all.map((record) =>
        isAssessmentTargetedToStudent(record, studentProfile!, studentClassId)
      ))
    : []
  return all.filter((record, index) =>
    (record.status === 'published' || record.status === 'approved') &&
    (role === 'SUPER_ADMIN' || record.schoolId === userSchoolId) &&
    (!studentProfile || studentAccess[index])
  )
}

export async function getApprovedCBTs(schoolId?: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  const role = session.user.role.toUpperCase()
  let userSchoolId = role === 'SUPER_ADMIN' ? schoolId || session.user.schoolId : session.user.schoolId
  let studentProfile: typeof student.$inferSelect | null = null
  let studentClassId: string | null = null
  if (['STUDENT', 'PUPIL'].includes(role)) {
    studentProfile = await db.query.student.findFirst({ where: eq(student.userId, session.user.id) }) || null
    userSchoolId = studentProfile?.schoolId || userSchoolId
    if (!studentProfile) return []
    studentClassId = await getStudentClassId(studentProfile)
    const clearance = await getCbtFeeStatus(studentProfile)
    if (!clearance.eligible) {
      await notifyFeeDefaulter(studentProfile, clearance.paidPercentage)
      return []
    }
  }
  if (role !== 'SUPER_ADMIN' && !userSchoolId) return []

  const all = await db.query.assessment.findMany({
    with: {
      subject: true,
      questions: true
    }
  })

  const studentAccess = studentProfile
    ? await Promise.all(all.map((record) =>
        isAssessmentTargetedToStudent(record, studentProfile!, studentClassId)
      ))
    : []
  return all.filter((a, index) =>
    a.status === 'approved' &&
    (role === 'SUPER_ADMIN' || a.schoolId === userSchoolId) &&
    (!studentProfile || studentAccess[index])
  ).map(a => {
    if (!['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return {
        ...a,
        accessCode: null,
        questions: a.questions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: sanitizeQuestionOptions(q.options),
          points: q.points,
          order: q.order
        }))
      }
    }
    return a
  })
}

export async function getAssessmentWithQuestions(id: string, providedAccessCode?: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  const role = session.user.role.toUpperCase()
  const studentUser = ['STUDENT', 'PUPIL'].includes(role)
  if (!studentUser && !['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(role)) {
    throw new Error('Assessment access is not allowed for this role.')
  }

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

  const studentProfile = studentUser
    ? await db.query.student.findFirst({ where: eq(student.userId, session.user.id) })
    : null
  if (studentUser && !studentProfile) throw new Error('Student profile not found.')
  if (studentProfile) await assertAssessmentTargetedToStudent(dbAssessment, studentProfile)
  const userSchoolId = studentProfile?.schoolId || session.user.schoolId
  if (role !== 'SUPER_ADMIN' && (!userSchoolId || dbAssessment.schoolId !== userSchoolId)) {
    throw new Error('Forbidden: Assessment school tenant mismatch.')
  }
  if (studentUser && !['approved', 'published'].includes(dbAssessment.status || '')) {
    throw new Error('This assessment is not published or available.')
  }
  if (studentUser && ['ASSESSMENT_CBT', 'EXAM_CBT'].includes(dbAssessment.type)) {
    assertCbtFeeCleared(await getCbtFeeStatus(studentProfile!))
  }

  if (studentUser && dbAssessment.type === 'EXAM_CBT') {
    assertCbtAccessCode(session.user.id, dbAssessment.accessCode, providedAccessCode)
  } else if (dbAssessment.accessCode && dbAssessment.accessCode.trim().length > 0) {
    if (studentUser) assertCbtAccessCode(session.user.id, dbAssessment.accessCode, providedAccessCode)
    else if (!providedAccessCode || providedAccessCode.trim().toUpperCase() !== dbAssessment.accessCode.trim().toUpperCase()) {
      throw new Error('Invalid or missing CBT Access Code for this exam.')
    }
  }

  if (studentUser) {
    return {
      id: dbAssessment.id,
      title: dbAssessment.title,
      status: dbAssessment.status,
      schoolId: dbAssessment.schoolId,
      totalPoints: dbAssessment.totalPoints,
      subject: dbAssessment.subject,
      questions: dbAssessment.questions.map((question) => ({
        id: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        options: sanitizeQuestionOptions(question.options),
        imageUrl: question.imageUrl,
        points: question.points,
        order: question.order,
      })),
    }
  }
  return dbAssessment
}

export async function saveAssessmentWithQuestions(assessmentData: any, questions: any[]) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'TEACHER') throw new Error('Unauthorized')
  const teacherProfile = await db.query.teacher.findFirst({ where: eq(teacher.userId, session.user.id) })
  if (!teacherProfile) throw new Error('Teacher profile not found')
  if (!assessmentData.targetClassId) throw new Error('Choose a class for this assessment.')
  const targetAssignment = await db.query.teacherOnSubject.findFirst({
    where: and(
      eq(teacherOnSubject.teacherId, teacherProfile.id),
      eq(teacherOnSubject.subjectId, assessmentData.subjectId),
      eq(teacherOnSubject.classId, assessmentData.targetClassId),
    ),
  })
  if (!targetAssignment) throw new Error('You can only create assessments for your assigned class and subject.')
  const targetClass = await db.query.class_.findFirst({
    where: and(
      eq(class_.id, assessmentData.targetClassId),
      eq(class_.schoolId, teacherProfile.schoolId || ''),
    ),
  })
  if (!targetClass) throw new Error('The selected class does not belong to your school.')
  const selectedSubject = await db.query.subject.findFirst({
    where: eq(subject.id, assessmentData.subjectId),
  })
  if (!selectedSubject) throw new Error('The selected subject is unavailable.')
  if (assessmentData.targetDepartment &&
    !selectedSubject.departments?.some((department) =>
      department.toLowerCase() === String(assessmentData.targetDepartment).toLowerCase()
    )) {
    throw new Error('The selected department is not configured for this subject.')
  }
  const currentTerm = await db.query.term.findFirst({ where: eq(term.isCurrent, true) })
  if (!currentTerm) throw new Error('No current academic term is configured')
  if (!questions.length) throw new Error('Add at least one question before publishing an assessment')
  const assessmentId = crypto.randomUUID()

  // Access codes are issued by the school admin only after approval.
  const generatedAccessCode = null

  return await db.transaction(async (tx) => {
    await tx.insert(assessment).values({
      id: assessmentId,
      schoolId: teacherProfile.schoolId || null,
      title: assessmentData.title,
      description: assessmentData.description,
      subjectId: assessmentData.subjectId,
      termId: currentTerm.id,
      createdBy: teacherProfile.id,
      targetClassId: assessmentData.targetClassId,
      targetDepartment: assessmentData.targetDepartment || null,
      duration: assessmentData.duration,
      type: assessmentData.type || 'ASSESSMENT_CBT',
      status: 'draft',
      accessCode: generatedAccessCode,
      passingScore: assessmentData.passingScore || 40,
      totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0),
      scheduledDate: assessmentData.scheduledDate || assessmentData.startDate || null,
      scheduledTime: assessmentData.scheduledTime || assessmentData.endDate || null,
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

    // Insert real-time assessment schedule record
    if (assessmentData.startTime || assessmentData.endTime || assessmentData.scheduledDate) {
      const startTime = assessmentData.startTime ? new Date(assessmentData.startTime) : new Date()
      const endTime = assessmentData.endTime ? new Date(assessmentData.endTime) : new Date(Date.now() + (assessmentData.duration || 60) * 60 * 1000)

      await tx.insert(assessmentSchedule).values({
        id: crypto.randomUUID(),
        assessmentId: assessmentId,
        startTime: startTime,
        endTime: endTime,
        classId: assessmentData.classId || null,
        createdAt: new Date(),
      }).onConflictDoNothing()
    }

    return { assessmentId, accessCode: generatedAccessCode }
  })
}

export async function getLoggedInStudentAndQuestions(assessmentId: string, providedAccessCode?: string) {
  const session = await auth.getSession()
  if (!session?.user || !['STUDENT', 'PUPIL'].includes(session.user.role.toUpperCase())) {
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

  if (dbAssessment.status !== 'approved' && dbAssessment.status !== 'published') {
    throw new Error('This assessment is not published or available.')
  }

  if (!dbAssessment.schoolId || dbAssessment.schoolId !== studentProfile.schoolId) {
    throw new Error('This assessment is not available for your school.')
  }

  // Omit correctAnswer and explanation from student response entirely
  const questionsList = dbAssessment.questions.map(q => {
    const shuffledOptions = shuffleOptions(sanitizeQuestionOptions(q.options))
    return {
      id: q.id,
      text: q.questionText,
      questionType: q.questionType,
      options: shuffledOptions,
      points: q.points || 1,
    }
  })

  const shuffledQuestions = [...questionsList].sort(() => Math.random() - 0.5)

  return {
    studentId: studentProfile.id,
    questions: shuffledQuestions,
    title: dbAssessment?.title || 'Assessment CBT'
  }
}

export async function getStudentCbtFeeStatus() {
  const session = await auth.getSession()
  if (!session?.user || !['STUDENT', 'PUPIL'].includes(session.user.role.toUpperCase())) {
    throw new Error('Student sign-in is required to check CBT fee clearance.')
  }
  const studentProfile = await db.query.student.findFirst({
    where: eq(student.userId, session.user.id),
  })
  if (!studentProfile) throw new Error('Student profile not found.')
  const clearance = await getCbtFeeStatus(studentProfile)
  if (!clearance.eligible) await notifyFeeDefaulter(studentProfile, clearance.paidPercentage)
  return clearance
}

export async function getParentCbtFeeAlerts() {
  const session = await auth.getSession()
  if (!session?.user || session.user.role.toUpperCase() !== 'PARENT') {
    throw new Error('Parent sign-in is required to check linked student fee clearance.')
  }
  const parentProfile = await db.query.parent.findFirst({
    where: eq(parent.userId, session.user.id),
  })
  if (!parentProfile) throw new Error('Parent profile not found.')

  const children = await db.query.student.findMany({
    where: eq(student.parentId, parentProfile.id),
  })
  const alerts: Array<{
    studentId: string
    studentName: string
    paidPercentage: number
    requiredPercentage: number
    totalPaid: number
    totalDue: number
  }> = []
  for (const child of children) {
    if (!parentProfile.schoolId || child.schoolId !== parentProfile.schoolId) continue
    const clearance = await getCbtFeeStatus(child)
    if (clearance.eligible) continue
    await notifyFeeDefaulter(child, clearance.paidPercentage)
    alerts.push({
      studentId: child.id,
      studentName: `${child.firstName} ${child.lastName}`,
      paidPercentage: clearance.paidPercentage,
      requiredPercentage: clearance.requiredPercentage,
      totalPaid: clearance.totalPaid,
      totalDue: clearance.totalDue,
    })
  }
  return alerts
}

export async function checkStudentWeekendAssignmentsCompleteAction(studentId?: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const studentProfile = await db.query.student.findFirst({
    where: studentId && studentId !== 'current' ? eq(student.id, studentId) : eq(student.userId, session.user.id)
  })

  if (!studentProfile) return { isComplete: true, count: 0, completedCount: 0 }
  const role = session.user.role.toUpperCase()
  if (role === 'STUDENT' || role === 'PUPIL') {
    if (studentProfile.userId !== session.user.id) throw new Error('You can only view your own assignment progress.')
  } else if (role === 'PARENT') {
    const linkedParent = await db.query.parent.findFirst({ where: eq(parent.userId, session.user.id) })
    if (!linkedParent || studentProfile.parentId !== linkedParent.id || studentProfile.schoolId !== linkedParent.schoolId) {
      throw new Error('You can only view assignment progress for a linked child.')
    }
  } else if (role !== 'SUPER_ADMIN') {
    throw new Error('This role cannot view student assignment progress.')
  }

  const weekendAssessments = await db.query.assessment.findMany({
    where: and(
      eq(assessment.type, 'WEEKEND_ASSIGNMENT'),
      eq(assessment.schoolId, studentProfile.schoolId || '')
    )
  })
  const studentClassId = await getStudentClassId(studentProfile)
  const weekendAvailability = await Promise.all(weekendAssessments.map((record) =>
    isAssessmentTargetedToStudent(record, studentProfile, studentClassId)
  ))
  const assignedWeekendAssessments = weekendAssessments.filter((_, index) => weekendAvailability[index])

  if (!assignedWeekendAssessments.length) {
    return { isComplete: true, count: 0, completedCount: 0 }
  }

  const results = await db.query.assessmentResult.findMany({
    where: eq(assessmentResult.studentId, studentProfile.id)
  })

  const completedIds = new Set(results.map(r => r.assessmentId))
  const completedCount = assignedWeekendAssessments.filter(a => completedIds.has(a.id)).length

  return {
    isComplete: completedCount >= Math.min(3, assignedWeekendAssessments.length),
    count: assignedWeekendAssessments.length,
    completedCount
  }
}

export async function getTeacherAssessmentResultsAction(classNameInput?: string, subjectIdInput?: string) {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized')
  }

  const role = session.user.role.toUpperCase()
  if (role === 'TEACHER') {
    const { results } = await getTeacherClassResultsAction()
    return results.filter((r) => {
      if (classNameInput && classNameInput !== 'ALL' &&
        (r.student?.class || '').trim().toLowerCase() !== classNameInput.trim().toLowerCase()) return false
      return !subjectIdInput || subjectIdInput === 'ALL' ||
        r.assessment?.subject?.name?.toLowerCase() === subjectIdInput.toLowerCase()
    })
  }

  if (role === 'SCHOOL_ADMIN' &&
    !canSchoolAdminAccess(session.user.adminLevel, 'read', 'assessment')) {
    throw new Error('Your school administrator level cannot view assessment results.')
  }
  const schoolId = role === 'SUPER_ADMIN' ? null : session.user.schoolId
  if (role !== 'SUPER_ADMIN' && !schoolId) return []

  const scopeFilters = schoolId
    ? [eq(student.schoolId, schoolId), eq(assessment.schoolId, schoolId)]
    : []
  if (role === 'SCHOOL_ADMIN' && session.user.adminLevel?.startsWith('HOD_')) {
    if (!session.user.department) return []
    scopeFilters.push(eq(student.department, session.user.department))
  }

  const scopedResults = await db
    .select({
      result: assessmentResult,
      studentRecord: student,
      assessmentRecord: assessment,
      subjectRecord: subject,
    })
    .from(assessmentResult)
    .innerJoin(student, eq(student.id, assessmentResult.studentId))
    .innerJoin(assessment, eq(assessment.id, assessmentResult.assessmentId))
    .leftJoin(subject, eq(subject.id, assessment.subjectId))
    .where(scopeFilters.length ? and(...scopeFilters) : undefined)
    .orderBy(desc(assessmentResult.createdAt))

  const results = scopedResults.map(({ result, studentRecord, assessmentRecord, subjectRecord }) => ({
    ...result,
    student: studentRecord,
    assessment: { ...assessmentRecord, subject: subjectRecord },
  }))

  return results.filter(r => {
    if (classNameInput && classNameInput !== 'ALL') {
      if ((r.student?.class || '').trim().toLowerCase() !== classNameInput.trim().toLowerCase()) {
        return false
      }
    }
    if (subjectIdInput && subjectIdInput !== 'ALL') {
      if (r.assessment?.subjectId !== subjectIdInput && r.assessment?.subject?.name?.toLowerCase() !== subjectIdInput.toLowerCase()) {
        return false
      }
    }
    return true
  })
}
