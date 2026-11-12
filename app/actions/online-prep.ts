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
  payment,
} from '@/lib/db/schema'
import { eq, and, or, desc } from 'drizzle-orm'
import { initializePaystackPayment, verifyPaystackPayment } from '@/lib/payments/service'
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
  if (!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(cleanAccessCode)) {
    return { success: false, error: 'Username access code must be 3–40 characters and use letters, numbers, dots, underscores, or hyphens.' }
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

  if (existingCode) {
    return { success: false, error: 'This username access code is already taken. Please choose another.' }
  }

  const userRecord = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) })
  const customerEmail = userRecord?.email || `${cleanAccessCode}@el-learners.local`

  const initRes = await initializePaystackPayment({
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

    const pendingPayment = await db.query.payment.findFirst({
      where: and(
        eq(payment.transactionReference, reference),
        eq(payment.studentId, studentProfile.id),
        eq(payment.schoolId, studentProfile.schoolId),
        eq(payment.feeType, 'ONLINE_PREP_LESSONS'),
      ),
    })
    if (!pendingPayment || Number(pendingPayment.amount) !== 3161.25 ||
      typeof pendingPayment.status !== 'string' || !['pending', 'success'].includes(pendingPayment.status.toLowerCase())) {
      return { success: false, error: 'No matching online prep payment was found for this student.' }
    }

    const cleanAccessCode = accessCode.trim().toLowerCase()
    if (!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(cleanAccessCode) ||
      !pendingPayment.description?.endsWith(` for ${cleanAccessCode}`)) {
      return { success: false, error: 'The access code does not match the one submitted for this payment.' }
    }

    const verification = await verifyPaystackPayment({
      reference,
      expectedAmount: 3161.25,
    })

    if (!verification.success) {
      return { success: false, error: 'Payment verification failed on gateway.' }
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000) // 3 weeks (21 days)

    const fulfillment = await db.transaction(async (tx) => {
      let subscription = await tx.query.onlinePrepSubscriptions.findFirst({
        where: eq(onlinePrepSubscriptions.paymentReference, reference),
      })
      if (subscription && (
        subscription.studentId !== studentProfile.id || subscription.accessCode !== cleanAccessCode
      )) {
        throw new Error('This payment reference is already linked to another online prep subscription.')
      }

      let firstFulfillment = false
      if (!subscription) {
        const [inserted] = await tx.insert(onlinePrepSubscriptions).values({
          id: randomUUID(),
          studentId: studentProfile.id,
          schoolId: studentProfile.schoolId!,
          department: studentProfile.department || 'Science',
          accessCode: cleanAccessCode,
          paymentReference: reference,
          amount: '3161.25',
          status: 'ACTIVE',
          paidAt: now,
          expiresAt,
        }).onConflictDoNothing({ target: onlinePrepSubscriptions.paymentReference }).returning()
        subscription = inserted || await tx.query.onlinePrepSubscriptions.findFirst({
          where: eq(onlinePrepSubscriptions.paymentReference, reference),
        })
        if (!subscription || subscription.studentId !== studentProfile.id || subscription.accessCode !== cleanAccessCode) {
          throw new Error('This access code is already assigned to another subscription.')
        }
        firstFulfillment = Boolean(inserted)
      }

      await tx.insert(transactionLedger).values({
        id: randomUUID(),
        schoolId: studentProfile.schoolId!,
        userId: session.user.id,
        studentId: studentProfile.id,
        type: 'FEE_PAYMENT',
        direction: 'IN',
        amount: '3161.25',
        reference,
        gateway: 'PAYSTACK',
        status: 'SUCCESS',
        description: `3-Week SSS3/SSS2 Online Exam Prep Subscription (${cleanAccessCode})`,
      }).onConflictDoNothing()

      return { subscription, firstFulfillment }
    })

    // Notify teachers only for the first successful fulfillment of this reference.
    if (fulfillment.firstFulfillment) {
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
    }

    return {
      success: true,
      accessCode: cleanAccessCode,
      expiresAt: fulfillment.subscription!.expiresAt,
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
  targetSchoolId?: string
}) {
  const session = await auth.getSession()
  if (!session?.user) return { success: false, error: 'Unauthorized' }

  const allowedRoles = ['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']
  if (!allowedRoles.includes(session.user.role?.toUpperCase())) {
    return { success: false, error: 'Forbidden: Insufficient privileges.' }
  }

  let schoolId = session.user.schoolId
  if (session.user.role === 'SUPER_ADMIN') {
    schoolId = input.targetSchoolId && input.targetSchoolId !== 'ALL'
      ? input.targetSchoolId
      : '00000000-0000-0000-0000-000000000001'
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
  const globalSchoolId = '00000000-0000-0000-0000-000000000001'

  return db.query.onlinePrepQuestions.findMany({
    where: schoolId
      ? or(eq(onlinePrepQuestions.schoolId, schoolId), eq(onlinePrepQuestions.schoolId, globalSchoolId))
      : eq(onlinePrepQuestions.schoolId, globalSchoolId),
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
  targetSchoolId?: string
}) {
  const session = await auth.getSession()
  if (!session?.user) return { success: false, error: 'Unauthorized' }

  const allowedRoles = ['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']
  if (!allowedRoles.includes(session.user.role?.toUpperCase())) {
    return { success: false, error: 'Forbidden: Insufficient privileges.' }
  }

  let schoolId = session.user.schoolId
  if (session.user.role === 'SUPER_ADMIN') {
    schoolId = input.targetSchoolId && input.targetSchoolId !== 'ALL'
      ? input.targetSchoolId
      : '00000000-0000-0000-0000-000000000001'
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
  const globalSchoolId = '00000000-0000-0000-0000-000000000001'

  return db.query.onlinePrepLessons.findMany({
    where: schoolId
      ? or(eq(onlinePrepLessons.schoolId, schoolId), eq(onlinePrepLessons.schoolId, globalSchoolId))
      : eq(onlinePrepLessons.schoolId, globalSchoolId),
    orderBy: [desc(onlinePrepLessons.createdAt)],
  })
}
