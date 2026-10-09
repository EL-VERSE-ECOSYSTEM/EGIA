'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { assessment, assessmentQuestion, term, teacher, class_, student, teacherWallet, teacherRequest, subject } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { getCachedData } from '@/lib/cache'

async function getUserId() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function createAssessment(data: any) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  const teacherProfile = await db.query.teacher.findFirst({ where: eq(teacher.userId, session.user.id) })
  if (!teacherProfile) throw new Error('Teacher profile not found')
  const teacherId = teacherProfile.id

  let currentTerm = await db.query.term.findFirst({ where: eq(term.isCurrent, true) })
  if (!currentTerm) {
    // Fallback term if current term is not set
    const allTerms = await db.query.term.findMany()
    currentTerm = allTerms[0]
  }
  if (!currentTerm) throw new Error('No academic term configured in database')

  const assessmentId = randomUUID()
  const { title, description, subjectId, totalMarks, duration, scheduleDate, questions, type } = data

  // Resolve valid subjectId
  let validSubjectId = subjectId
  if (!validSubjectId || validSubjectId === 'temp-subject-id') {
    const firstSubject = await db.query.subject.findFirst()
    if (firstSubject) {
      validSubjectId = firstSubject.id
    } else {
      // Insert default subject if none exist
      const defaultSubId = randomUUID()
      await db.insert(subject).values({
        id: defaultSubId,
        name: 'General Mathematics',
        code: 'MATH101',
        isActive: true,
      } as any)
      validSubjectId = defaultSubId
    }
  }

  const result = await db.transaction(async (tx) => {
    const insertedAssessment = await tx.insert(assessment).values({
      id: assessmentId,
      title: title || 'New Assessment',
      description: description || '',
      subjectId: validSubjectId,
      termId: currentTerm.id,
      createdBy: teacherId,
      duration: duration || 60,
      type: type || 'ASSESSMENT_CBT', // ASSESSMENT_CBT or EXAM_CBT
      status: 'pending_approval', // newly created CBT starts as pending_approval for Admin review
      passingScore: 40,
      totalPoints: totalMarks || (questions ? questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0) : 100),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any).returning()

    if (questions && questions.length > 0) {
      const questionInserts = questions.map((q: any, idx: number) => ({
        id: randomUUID(),
        assessmentId: assessmentId,
        questionText: q.questionText,
        questionType: q.questionType || 'multiple_choice',
        options: q.options || null,
        correctAnswer: q.correctAnswer || '',
        imageUrl: q.imageUrl || null,
        points: q.marks || 1,
        explanation: '',
        order: idx + 1
      }))
      await tx.insert(assessmentQuestion).values(questionInserts as any)
    }

    return insertedAssessment[0]
  })

  revalidatePath('/dashboard/teacher/assessments')
  revalidatePath('/dashboard/admin/assessments/pending')
  return result
}

export async function getTeacherProfile() {
  const session = await auth.getSession()
  if (!session?.user) return null
  const userId = session.user.id

  // Optimize performance using our custom caching system (caches for 2 minutes)
  return getCachedData(`teacher-profile:${userId}`, async () => {
    return db.query.teacher.findFirst({
      where: eq(teacher.userId, userId)
    })
  }, 120)
}

export async function getStudentsInClass(classId: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const teacherProfile = await db.query.teacher.findFirst({
    where: eq(teacher.userId, session.user.id)
  })

  const classData = await db.query.class_.findFirst({
    where: eq(class_.id, classId)
  })
  if (!classData) throw new Error('Class not found')

  if (!teacherProfile) throw new Error('Teacher profile not found')
  const handledClasses = Array.isArray(teacherProfile.handlingClasses) ? teacherProfile.handlingClasses as string[] : []
  const isAssignedClassTeacher = teacherProfile.isClassTeacher === true && teacherProfile.assignedClassId === classData.id
  // A class roster is only visible to its assigned class teacher or a teacher
  // explicitly assigned to that class. Never expose another teacher's class.
  if (!isAssignedClassTeacher && !handledClasses.includes(classData.name)) return []

  // Return students sorted by class and then alphabetically by last name, first name
  const normalizeClass = (value: string) => value.replace(/\s+/g, '').toUpperCase()
  const roster = await db.query.student.findMany({
    orderBy: (student, { asc }) => [asc(student.lastName), asc(student.firstName)],
    with: {
      parent: { with: { user: true } },
      results: { with: { assessment: true } }
    }
  })
  return roster.filter(item => normalizeClass(item.class) === normalizeClass(classData.name))
}

// ===== TEACHER WALLET & REQUEST ACTIONS =====

export async function getTeacherWallet() {
  const userId = await getUserId()
  const teacherProfile = await db.query.teacher.findFirst({
    where: eq(teacher.userId, userId)
  })
  if (!teacherProfile) throw new Error('Teacher not found')

  let wallet = await db.query.teacherWallet.findFirst({
    where: eq(teacherWallet.teacherId, teacherProfile.id)
  })

  if (!wallet) {
    const results = await db.insert(teacherWallet).values({
      id: randomUUID(),
      teacherId: teacherProfile.id,
      balance: '0.00',
      salaryAmount: '0.00',
      salaryStatus: 'pending',
    }).returning()
    wallet = results[0]
  }

  return wallet
}

export async function getTeacherRequests() {
  const userId = await getUserId()
  const teacherProfile = await db.query.teacher.findFirst({
    where: eq(teacher.userId, userId)
  })
  if (!teacherProfile) throw new Error('Teacher not found')

  return await db.query.teacherRequest.findMany({
    where: eq(teacherRequest.teacherId, teacherProfile.id),
    orderBy: [desc(teacherRequest.createdAt)]
  })
}

export async function createDataAirtimeRequest(data: {
  type: string
  amount: number
  details: string
  phoneNumber: string
}) {
  const userId = await getUserId()
  const teacherProfile = await db.query.teacher.findFirst({
    where: eq(teacher.userId, userId)
  })
  if (!teacherProfile) throw new Error('Teacher not found')

  const wallet = await getTeacherWallet()
  if (parseFloat(wallet.balance || '0') < data.amount) {
    throw new Error('Insufficient wallet balance.')
  }

  const result = await db.insert(teacherRequest).values({
    id: randomUUID(),
    teacherId: teacherProfile.id,
    type: data.type,
    amount: data.amount.toString(),
    details: data.details,
    phoneNumber: data.phoneNumber,
    status: 'pending',
  }).returning()

  // Deduct from wallet balance immediately (pending deduction)
  const newBalance = (parseFloat(wallet.balance || '0') - data.amount).toFixed(2)
  await db.update(teacherWallet)
    .set({ balance: newBalance, updatedAt: new Date() })
    .where(eq(teacherWallet.id, wallet.id))

  revalidatePath('/dashboard/teacher/wallet')
  return result[0]
}

export async function getAdminTeacherRequests() {
  // Query requests with teacher profile names
  const list = await db.select().from(teacherRequest).orderBy(desc(teacherRequest.createdAt))
  const result: Array<any> = []
  for (const item of list) {
    const t = await db.query.teacher.findFirst({
      where: eq(teacher.id, item.teacherId)
    })
    result.push({
      ...item,
      teacherName: t ? `${t.firstName} ${t.lastName}` : 'Academy Staff'
    })
  }
  return result
}

export async function getAllTeachersWithWallets() {
  const list = await db.select().from(teacher)
  const result: Array<any> = []
  for (const t of list) {
    let wallet = await db.query.teacherWallet.findFirst({
      where: eq(teacherWallet.teacherId, t.id)
    })
    if (!wallet) {
      const wResults = await db.insert(teacherWallet).values({
        id: randomUUID(),
        teacherId: t.id,
        balance: '0.00',
        salaryAmount: '0.00',
        salaryStatus: 'pending',
      }).returning()
      wallet = wResults[0]
    }
    result.push({
      ...t,
      wallet
    })
  }
  return result
}

const DIRECTCOUPON_TOKEN = '31e8e1c081276940fce3b3568dcdbbd506e4be2346688b09649ca5340c781a22'
const DIRECTCOUPON_BASE_URL = 'https://directcoupon.com.ng'

export async function approveTeacherRequest(requestId: string, status: 'approved' | 'rejected') {
  const requestRecord = await db.query.teacherRequest.findFirst({
    where: eq(teacherRequest.id, requestId)
  })
  if (!requestRecord) throw new Error('Request not found')

  if (status === 'approved') {
    try {
      const isDataRequest = requestRecord.type?.toLowerCase().includes('data') || requestRecord.details?.toLowerCase().includes('plan_id')
      if (isDataRequest) {
        let planId = 1
        try {
          const match = requestRecord.details?.match(/plan_id[:=]\s*(\d+)/i)
          if (match && match[1]) planId = parseInt(match[1])
        } catch {}

        await fetch(`${DIRECTCOUPON_BASE_URL}/api/loadCoupon`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${DIRECTCOUPON_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_id: planId,
            phone_number: requestRecord.phoneNumber || '08000000000',
            custom_ref: requestRecord.id,
          }),
        })
      } else {
        let networkId = 'mtn'
        if (requestRecord.details?.toLowerCase().includes('airtel')) networkId = 'airtel'
        if (requestRecord.details?.toLowerCase().includes('glo')) networkId = 'glo'
        if (requestRecord.details?.toLowerCase().includes('9mobile')) networkId = '9mobile'

        await fetch(`${DIRECTCOUPON_BASE_URL}/api/airtime`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${DIRECTCOUPON_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            network_id: networkId,
            phone: requestRecord.phoneNumber || '08000000000',
            amount: parseFloat(requestRecord.amount || '100'),
          }),
        })
      }
    } catch (apiErr) {
      console.warn('DirectCoupon API dispatch failed:', apiErr)
    }
  }

  const result = await db.update(teacherRequest)
    .set({ status, updatedAt: new Date() })
    .where(eq(teacherRequest.id, requestId))
    .returning()

  // If rejected, refund the deducted amount back to their wallet
  if (status === 'rejected') {
    const wallet = await db.query.teacherWallet.findFirst({
      where: eq(teacherWallet.teacherId, requestRecord.teacherId)
    })
    if (wallet) {
      const refundedBalance = (parseFloat(wallet.balance || '0') + parseFloat(requestRecord.amount)).toFixed(2)
      await db.update(teacherWallet)
        .set({ balance: refundedBalance, updatedAt: new Date() })
        .where(eq(teacherWallet.id, wallet.id))
    }
  }

  revalidatePath('/dashboard/teacher/wallet')
  revalidatePath('/dashboard/admin/finance/teacher-requests')
  return result[0]
}

export async function updateTeacherSalaryAmount(teacherId: string, salaryAmount: string) {
  const numericAmount = parseFloat(salaryAmount)
  if (isNaN(numericAmount) || numericAmount < 0) {
    throw new Error('Please enter a valid salary amount.')
  }

  // Ensure wallet exists
  let wallet = await db.query.teacherWallet.findFirst({
    where: eq(teacherWallet.teacherId, teacherId)
  })

  if (!wallet) {
    // Insert new wallet row if missing
    await db.insert(teacherWallet).values({
      id: randomUUID(),
      teacherId,
      salaryAmount: numericAmount.toFixed(2),
      balance: '0.00',
      salaryStatus: 'pending',
      updatedAt: new Date()
    } as any)
  } else {
    // Update salary amount
    await db.update(teacherWallet)
      .set({
        salaryAmount: numericAmount.toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(teacherWallet.id, wallet.id))
  }

  revalidatePath('/dashboard/admin/finance/teacher-requests')
  return { success: true }
}

export async function payTeacherSalary(teacherId: string) {
  const wallet = await db.query.teacherWallet.findFirst({
    where: eq(teacherWallet.teacherId, teacherId)
  })
  if (!wallet) throw new Error('Wallet not found')

  const result = await db.update(teacherWallet)
    .set({
      salaryStatus: 'paid',
      balance: (parseFloat(wallet.balance || '0') + parseFloat(wallet.salaryAmount || '150000.00')).toFixed(2),
      updatedAt: new Date()
    })
    .where(eq(teacherWallet.id, wallet.id))
    .returning()

  revalidatePath('/dashboard/teacher/wallet')
  revalidatePath('/dashboard/admin/finance/teacher-requests')
  return result[0]
}

export async function updateTeacherSubjects(subjects: string[]) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  await db.update(teacher)
    .set({
      teachingSubjects: subjects,
      updatedAt: new Date()
    })
    .where(eq(teacher.userId, session.user.id))

  revalidatePath('/dashboard/teacher/overview')
  return { success: true }
}

export async function adminUpdateTeacherClassAndSubjects(teacherId: string, classes: string[], subjects: string[]) {
  // Update classes and subjects in database
  const result = await db.update(teacher)
    .set({
      handlingClasses: classes,
      teachingSubjects: subjects,
      updatedAt: new Date()
    })
    .where(eq(teacher.id, teacherId))
    .returning()

  // Also update plural public.teachers table if it exists
  try {
    const classStr = classes.join(', ')
    await db.execute(sql`
      UPDATE public.teachers
      SET
        class_teacher_of = ${classStr},
        updated_at = NOW()
      WHERE id = ${teacherId}::uuid
    `)
  } catch (err) {
    console.warn('Could not sync update to public.teachers table:', err)
  }

  revalidatePath('/dashboard/admin/users/teachers/list')
  return { success: true, teacher: result[0] }
}

export async function getStudentsBySubject(subjectName: string) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'TEACHER') throw new Error('Unauthorized')
  const teacherProfile = await db.query.teacher.findFirst({ where: eq(teacher.userId, session.user.id) })
  if (!teacherProfile) throw new Error('Teacher profile not found')
  const subjects = Array.isArray(teacherProfile.teachingSubjects) ? teacherProfile.teachingSubjects as string[] : []
  if (!subjects.some(item => item.toLowerCase() === subjectName.trim().toLowerCase())) return []

  const normalizeClass = (value: string) => value.replace(/\s+/g, '').toUpperCase()
  const allowedClasses = new Set<string>((Array.isArray(teacherProfile.handlingClasses) ? teacherProfile.handlingClasses as string[] : []).map(normalizeClass))
  if (teacherProfile.isClassTeacher && teacherProfile.assignedClassId) {
    const assignedClass = await db.query.class_.findFirst({ where: eq(class_.id, teacherProfile.assignedClassId) })
    if (assignedClass) allowedClasses.add(normalizeClass(assignedClass.name))
  }
  if (!allowedClasses.size) return []
  const studentsList = await db.query.student.findMany({ orderBy: (s, { asc }) => [asc(s.class), asc(s.lastName), asc(s.firstName)] })
  return studentsList.filter(s => allowedClasses.has(normalizeClass(s.class)) && Array.isArray(s.subjectsDone) && (s.subjectsDone as string[]).some(item => item.toLowerCase() === subjectName.trim().toLowerCase()))
}

export async function getStudentFullProfile(studentId: string) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'TEACHER') throw new Error('Unauthorized')
  const profile = await db.query.teacher.findFirst({ where: eq(teacher.userId, session.user.id) })
  const learner = await db.query.student.findFirst({ where: eq(student.id, studentId) })
  if (!profile || !learner) return null
  const normalizeClass = (value: string) => value.replace(/\s+/g, '').toUpperCase()
  const allowedClasses = (Array.isArray(profile.handlingClasses) ? profile.handlingClasses as string[] : []).map(normalizeClass)
  let canView = allowedClasses.includes(normalizeClass(learner.class))
  if (!canView && profile.isClassTeacher && profile.assignedClassId) {
    const assigned = await db.query.class_.findFirst({ where: eq(class_.id, profile.assignedClassId) })
    canView = assigned ? normalizeClass(assigned.name) === normalizeClass(learner.class) : false
  }
  if (!canView) throw new Error('You are not assigned to this learner’s class.')
  return db.query.student.findFirst({
    where: eq(student.id, studentId),
    with: {
      parent: {
        with: {
          user: true
        }
      },
      results: {
        with: {
          assessment: true
        }
      },
      attendance: true,
      payments: true
    }
  })
}

export async function getTeacherAssessments() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  const teacherProfile = await db.query.teacher.findFirst({ where: eq(teacher.userId, session.user.id) })
  if (!teacherProfile) return []

  return await db.query.assessment.findMany({
    where: eq(assessment.createdBy, teacherProfile.id),
    orderBy: [desc(assessment.updatedAt)],
    with: {
      subject: true,
      questions: true
    }
  })
}

export async function getAssessmentById(assessmentId: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  return await db.query.assessment.findFirst({
    where: eq(assessment.id, assessmentId),
    with: {
      subject: true,
      questions: true
    }
  })
}

export async function updateAssessmentAndResubmit(data: {
  id: string
  title: string
  description?: string
  duration: number
  passingScore?: number
  questions: Array<{
    questionText: string
    questionType?: string
    options?: string[]
    correctAnswer: string
    marks?: number
  }>
}) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const existing = await db.query.assessment.findFirst({
    where: eq(assessment.id, data.id)
  })

  if (!existing) throw new Error('Assessment not found')

  await db.transaction(async (tx) => {
    // 1. Update assessment details and reset status to pending_approval
    await tx.update(assessment)
      .set({
        title: data.title,
        description: data.description || '',
        duration: data.duration,
        passingScore: data.passingScore || 40,
        status: 'pending_approval',
        adminComment: '', // clear old rejection reason upon resubmission
        updatedAt: new Date()
      })
      .where(eq(assessment.id, data.id))

    // 2. Delete existing questions and replace with updated questions
    await tx.delete(assessmentQuestion).where(eq(assessmentQuestion.assessmentId, data.id))

    if (data.questions && data.questions.length > 0) {
      const questionInserts = data.questions.map((q, idx) => ({
        id: randomUUID(),
        assessmentId: data.id,
        questionText: q.questionText,
        questionType: q.questionType || 'multiple_choice',
        options: q.options || null,
        correctAnswer: q.correctAnswer || '',
        imageUrl: (q as any).imageUrl || null,
        points: q.marks || 1,
        explanation: '',
        order: idx + 1
      }))
      await tx.insert(assessmentQuestion).values(questionInserts as any)
    }
  })

  revalidatePath('/dashboard/teacher/assessments')
  revalidatePath('/dashboard/admin/assessments')
  revalidatePath('/dashboard/admin/assessments/pending')
  return { success: true }
}

export async function getTeacherClassResultsAction() {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'TEACHER' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized')
  }

  const teacherProfile = await db.query.teacher.findFirst({
    where: eq(teacher.userId, session.user.id),
  })

  if (!teacherProfile && session.user.role === 'TEACHER') {
    return { results: [], classes: [], subjects: [] }
  }

  const handlingClasses = Array.isArray(teacherProfile?.handlingClasses) ? (teacherProfile?.handlingClasses as string[]) : []
  const teachingSubjects = Array.isArray(teacherProfile?.teachingSubjects) ? (teacherProfile?.teachingSubjects as string[]) : []

  const resultsList = await db.query.assessmentResult.findMany({
    with: {
      student: true,
      assessment: {
        with: {
          subject: true,
        },
      },
    },
    orderBy: [desc(assessmentResult.createdAt)],
  })

  return {
    results: resultsList,
    classes: handlingClasses,
    subjects: teachingSubjects,
    teacherType: teacherProfile?.type || 'FULL_TIME',
  }
}

export async function updateTeacherApplicationLetterAction(data: {
  teacherId: string
  applicationLetterUrl?: string | null
  applicationLetterText?: string | null
}) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  try {
    await db.update(teacher)
      .set({
        applicationLetterUrl: data.applicationLetterUrl || null,
        bio: data.applicationLetterText ? data.applicationLetterText : undefined,
        updatedAt: new Date()
      })
      .where(eq(teacher.id, data.teacherId))

    revalidatePath('/dashboard/teacher/overview')
    return { success: true }
  } catch (err: any) {
    console.error('Failed to update application letter:', err)
    return { success: false, error: err.message || 'Database update failed.' }
  }
}
