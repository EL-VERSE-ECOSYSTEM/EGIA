'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  student,
  user as userTable,
  teacher,
  onlinePrepSubscriptions,
  onlinePrepQuestions,
  onlinePrepLessons,
  transactionLedger,
  notification,
} from '@/lib/db/schema'
import { eq, and, gt, desc } from 'drizzle-orm'
import { initializeKorapayPayment, verifyKorapayPayment } from '@/lib/payments/service'
import { randomUUID } from 'crypto'
import { sanitizeServerError } from '@/lib/errors'

export async function getPrepSubscriptionStatusAction() {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'STUDENT') {
    return { isSubscribed: false, expired: false, accessCode: null, daysLeft: 0 }
  }

  const studentProfile = await db.query.student.findFirst({
    where: eq(student.userId, session.user.id),
  })

  if (!studentProfile) {
    return { isSubscribed: false, expired: false, accessCode: null, daysLeft: 0 }
  }

  const isSeniorClass = ['SSS2', 'SSS3', 'SS2', 'SS3'].includes(studentProfile.class?.toUpperCase())
  if (!isSeniorClass) {
    return { isSubscribed: false, expired: false, accessCode: null, daysLeft: 0, isEligibleClass: false }
  }

  const activeSub = await db.query.onlinePrepSubscriptions.findFirst({
    where: and(
      eq(onlinePrepSubscriptions.studentId, studentProfile.id),
      eq(onlinePrepSubscriptions.status, 'ACTIVE')
    ),
    orderBy: [desc(onlinePrepSubscriptions.createdAt)],
  })

  if (!activeSub) {
    return {
      isSubscribed: false,
      expired: false,
      accessCode: null,
      daysLeft: 0,
      isEligibleClass: true,
      studentClass: studentProfile.class,
      department: studentProfile.department || 'General',
    }
  }

  const now = new Date()
  const expiresAt = new Date(activeSub.expiresAt)
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (now > expiresAt) {
    await db.update(onlinePrepSubscriptions)
      .set({ status: 'EXPIRED' })
      .where(eq(onlinePrepSubscriptions.id, activeSub.id))

    return {
      isSubscribed: false,
      expired: true,
      accessCode: activeSub.accessCode,
      daysLeft: 0,
      isEligibleClass: true,
    }
  }

  return {
    isSubscribed: true,
    expired: false,
    accessCode: activeSub.accessCode,
    daysLeft: Math.max(0, daysLeft),
    expiresAt: activeSub.expiresAt,
    department: activeSub.department,
    isEligibleClass: true,
  }
}

export async function initializePrepSubscriptionAction(input: {
  accessCode: string
}) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'STUDENT') {
    return { success: false, error: 'Unauthorized session' }
  }

  const cleanAccessCode = input.accessCode.trim().toLowerCase()
  if (!cleanAccessCode || cleanAccessCode.length < 3) {
    return { success: false, error: 'Username access code must be at least 3 characters long.' }
  }

  const studentProfile = await db.query.student.findFirst({
    where: eq(student.userId, session.user.id),
  })

  if (!studentProfile || !studentProfile.schoolId) {
    return { success: false, error: 'Student or school context missing.' }
  }

  const existingCode = await db.query.onlinePrepSubscriptions.findFirst({
    where: eq(onlinePrepSubscriptions.accessCode, cleanAccessCode),
  })

  if (existingCode && existingCode.studentId !== studentProfile.id) {
    return { success: false, error: 'This username access code is already taken. Please choose another.' }
  }

  const userRecord = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) })
  const customerEmail = userRecord?.email || `${cleanAccessCode}@el-learners.local`

  const initRes = await initializeKorapayPayment({
    amount: 3161.25,
    currency: 'NGN',
    feeType: 'ONLINE_PREP_LESSONS',
    description: `SSS3/SSS2 WAEC/NECO/JAMB Lesson Subscription for ${cleanAccessCode}`,
    customerEmail,
    customerName: `${studentProfile.firstName} ${studentProfile.lastName}`,
    schoolId: studentProfile.schoolId,
    studentId: studentProfile.id,
    metadata: {
      type: 'ONLINE_PREP_LESSONS',
      studentId: studentProfile.id,
      schoolId: studentProfile.schoolId,
      accessCode: cleanAccessCode,
      department: studentProfile.department || 'Science',
    },
  })

  return {
    success: true,
    checkoutUrl: initRes.checkoutUrl,
    paymentReference: initRes.reference,
  }
}

export async function verifyPrepSubscriptionPaymentAction(reference: string, accessCode: string) {
  try {
    const session = await auth.getSession()
    if (!session?.user) return { success: false, error: 'Unauthorized' }

    const studentProfile = await db.query.student.findFirst({
      where: eq(student.userId, session.user.id),
    })

    if (!studentProfile || !studentProfile.schoolId) {
      return { success: false, error: 'Student context missing' }
    }

    const verification = await verifyKorapayPayment({
      reference,
      expectedAmount: 3161.25,
    })

    if (!verification.success) {
      return { success: false, error: 'Payment verification failed on gateway.' }
    }

    const cleanAccessCode = accessCode.trim().toLowerCase()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000) // 3 weeks (21 days)

    // 1. Create or update Online Prep Subscription in Supabase Database
    const subId = randomUUID()
    await db.insert(onlinePrepSubscriptions).values({
      id: subId,
      studentId: studentProfile.id,
      schoolId: studentProfile.schoolId,
      department: studentProfile.department || 'Science',
      accessCode: cleanAccessCode,
      paymentReference: reference,
      amount: '3161.25',
      status: 'ACTIVE',
      paidAt: now,
      expiresAt: expiresAt,
    }).onConflictDoUpdate({
      target: [onlinePrepSubscriptions.paymentReference],
      set: { status: 'ACTIVE', expiresAt, updatedAt: now },
    })

    // 2. Record transaction in Ledger
    await db.insert(transactionLedger).values({
      id: randomUUID(),
      schoolId: studentProfile.schoolId,
      userId: session.user.id,
      studentId: studentProfile.id,
      type: 'FEE_PAYMENT',
      direction: 'IN',
      amount: '3161.25',
      reference,
      gateway: 'KORAPAY',
      status: 'SUCCESS',
      description: `3-Week SSS3/SSS2 Online Exam Prep Subscription (${cleanAccessCode})`,
    }).onConflictDoNothing()

    // 3. Notify Class Teachers and Subject Teachers in this school
    const teachersInSchool = await db.query.teacher.findMany({
      where: eq(teacher.schoolId, studentProfile.schoolId),
    })

    for (const t of teachersInSchool) {
      if (t.userId) {
        await db.insert(notification).values({
          id: randomUUID(),
          userId: t.userId,
          schoolId: studentProfile.schoolId,
          title: 'New Online Exam Prep Registration',
          message: `Student ${studentProfile.firstName} ${studentProfile.lastName} registered for 3-week WAEC/NECO/JAMB Online Lessons (Access Code: ${cleanAccessCode}).`,
          type: 'ONLINE_PREP_REGISTRATION',
        }).onConflictDoNothing()
      }
    }

    return {
      success: true,
      accessCode: cleanAccessCode,
      expiresAt,
    }
  } catch (err: any) {
    return sanitizeServerError('verifyPrepSubscriptionPaymentAction', err, 'Failed to complete prep subscription.')
  }
}

export async function uploadPrepQuestionAction(input: {
  subjectName: string
  examType: string
  department: string
  questionText: string
  options: string[]
  correctAnswer: string
}) {
  const session = await auth.getSession()
  if (!session?.user) return { success: false, error: 'Unauthorized' }

  const allowedRoles = ['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']
  if (!allowedRoles.includes(session.user.role?.toUpperCase())) {
    return { success: false, error: 'Forbidden: Insufficient privileges.' }
  }

  let schoolId = session.user.schoolId
  if (!schoolId && session.user.role === 'SUPER_ADMIN') {
    schoolId = '00000000-0000-0000-0000-000000000001'
  }

  if (!schoolId) {
    return { success: false, error: 'School ID required.' }
  }

  await db.insert(onlinePrepQuestions).values({
    id: randomUUID(),
    schoolId,
    subjectName: input.subjectName.trim(),
    examType: input.examType || 'WAEC',
    department: input.department || 'Science',
    questionText: input.questionText.trim(),
    options: input.options,
    correctAnswer: input.correctAnswer.trim(),
    uploadedBy: session.user.id,
    uploadedByRole: session.user.role,
  })

  return { success: true }
}

export async function getPrepQuestionsAction(subjectName?: string) {
  const session = await auth.getSession()
  if (!session?.user) return []

  const studentProfile = await db.query.student.findFirst({
    where: eq(student.userId, session.user.id),
  })

  const schoolId = studentProfile?.schoolId || session.user.schoolId
  if (!schoolId) return []

  return db.query.onlinePrepQuestions.findMany({
    where: eq(onlinePrepQuestions.schoolId, schoolId),
    orderBy: [desc(onlinePrepQuestions.createdAt)],
  })
}

export async function uploadPrepLessonAction(input: {
  title: string
  subjectName: string
  department: string
  videoUrl: string
  description?: string
  targetClass?: string // SSS2 or SSS3
}) {
  const session = await auth.getSession()
  if (!session?.user) return { success: false, error: 'Unauthorized' }

  const allowedRoles = ['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']
  if (!allowedRoles.includes(session.user.role?.toUpperCase())) {
    return { success: false, error: 'Forbidden: Insufficient privileges.' }
  }

  let schoolId = session.user.schoolId
  if (!schoolId && session.user.role === 'SUPER_ADMIN') {
    schoolId = '00000000-0000-0000-0000-000000000001'
  }

  if (!schoolId) {
    return { success: false, error: 'School ID required.' }
  }

  const lessonId = randomUUID()
  await db.insert(onlinePrepLessons).values({
    id: lessonId,
    schoolId,
    title: input.title.trim(),
    subjectName: input.subjectName.trim(),
    department: input.department || 'Science',
    videoUrl: input.videoUrl.trim(),
    description: input.description || null,
    teacherId: session.user.id,
  })

  return { success: true, lessonId }
}

export async function getPrepLessonsAction(department?: string) {
  const session = await auth.getSession()
  if (!session?.user) return []

  const studentProfile = await db.query.student.findFirst({
    where: eq(student.userId, session.user.id),
  })

  const schoolId = studentProfile?.schoolId || session.user.schoolId
  if (!schoolId) return []

  return db.query.onlinePrepLessons.findMany({
    where: eq(onlinePrepLessons.schoolId, schoolId),
    orderBy: [desc(onlinePrepLessons.createdAt)],
  })
}
