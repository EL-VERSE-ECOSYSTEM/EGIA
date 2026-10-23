'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { assessment, assessmentQuestion, assessmentResult, term, teacher, class_, student, teacherWallet, teacherRequest, subject, teacherOnSubject } from '@/lib/db/schema'
import { eq, desc, sql, and, inArray, type SQL } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function getTeacherRequestAdminScope() {
  const session = await auth.getSession()
  if (!session?.user || !['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    throw new Error('Unauthorized')
  }
  if (session.user.role !== 'SUPER_ADMIN' && !session.user.schoolId) {
    throw new Error('School identity context missing for administrative action.')
  }
  return { user: session.user, schoolId: session.user.schoolId }
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

  return db.query.teacher.findFirst({
    where: eq(teacher.userId, userId)
  })
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

  const requestType = data.type.trim().toUpperCase()
  const phoneNumber = data.phoneNumber.replace(/\D/g, '')
  const details = data.details.trim()
  if (!['DATA', 'AIRTIME'].includes(requestType)) throw new Error('Request type must be DATA or AIRTIME.')
  if (!Number.isFinite(data.amount) || data.amount <= 0) throw new Error('Request amount must be positive.')
  if (phoneNumber.length < 10 || phoneNumber.length > 15) throw new Error('Enter a valid phone number.')
  if (!details || details.length > 500) throw new Error('Request details must contain 1 to 500 characters.')

  const request = await db.transaction(async (tx) => {
    const wallet = await tx.query.teacherWallet.findFirst({
      where: eq(teacherWallet.teacherId, teacherProfile.id),
    })
    if (!wallet) throw new Error('Teacher wallet not found.')

    const deducted = await tx.update(teacherWallet)
      .set({
        balance: sql`${teacherWallet.balance} - ${data.amount.toFixed(2)}`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(teacherWallet.id, wallet.id),
        sql`${teacherWallet.balance} >= ${data.amount.toFixed(2)}`,
      ))
      .returning({ id: teacherWallet.id })
    if (!deducted[0]) throw new Error('Insufficient wallet balance.')

    const inserted = await tx.insert(teacherRequest).values({
      id: randomUUID(),
      teacherId: teacherProfile.id,
      type: requestType,
      amount: data.amount.toFixed(2),
      details,
      phoneNumber,
      status: 'pending',
    }).returning()
    if (!inserted[0]) throw new Error('Unable to create teacher request.')
    return inserted[0]
  })

  revalidatePath('/dashboard/teacher/wallet')
  return request
}

export async function getAdminTeacherRequests() {
  const { user: currentUser, schoolId } = await getTeacherRequestAdminScope()
  const rows = await db
    .select({
      request: teacherRequest,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
    })
    .from(teacherRequest)
    .innerJoin(teacher, eq(teacherRequest.teacherId, teacher.id))
    .where(currentUser.role === 'SUPER_ADMIN' ? undefined : eq(teacher.schoolId, schoolId!))
    .orderBy(desc(teacherRequest.createdAt))
  return rows.map(({ request, firstName, lastName }) => ({
    ...request,
    teacherName: `${firstName} ${lastName}`,
  }))
}

export async function getAllTeachersWithWallets() {
  const { user: currentUser, schoolId } = await getTeacherRequestAdminScope()
  const list = await db.select().from(teacher)
    .where(currentUser.role === 'SUPER_ADMIN' ? undefined : eq(teacher.schoolId, schoolId!))
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

const DIRECTCOUPON_BASE_URL = process.env.DATA_BASE_URL || 'https://directcoupon.com.ng'

export async function approveTeacherRequest(requestId: string, status: 'approved' | 'rejected') {
  const { user: currentUser, schoolId } = await getTeacherRequestAdminScope()
  if (status !== 'approved' && status !== 'rejected') throw new Error('Invalid request decision.')

  const requestRecord = await db.query.teacherRequest.findFirst({
    where: eq(teacherRequest.id, requestId)
  })
  if (!requestRecord) throw new Error('Request not found')
  const requestTeacher = await db.query.teacher.findFirst({
    where: eq(teacher.id, requestRecord.teacherId)
  })
  if (!requestTeacher || (currentUser.role !== 'SUPER_ADMIN' && requestTeacher.schoolId !== schoolId)) {
    throw new Error('Forbidden: Request is outside your school.')
  }
  if (requestRecord.status !== 'pending') throw new Error('This request has already been processed.')

  if (status === 'approved') {
    const token = process.env.DATA_API || process.env.DIRECTCOUPON_TOKEN
    if (!token) {
      throw new Error('Fulfilment is unavailable because DIRECTCOUPON_TOKEN is not configured.')
    }
    const requestType = requestRecord.type.toUpperCase()
    if (requestType !== 'DATA' && requestType !== 'AIRTIME') throw new Error('Unsupported teacher wallet request type.')

    const isDataRequest = requestType === 'DATA'
    const endpoint = isDataRequest
      ? `${DIRECTCOUPON_BASE_URL}/api/loadCoupon`
      : `${DIRECTCOUPON_BASE_URL}/api/airtime`
    const payload = isDataRequest
      ? {
          plan_id: Number(requestRecord.details?.match(/plan_id[:=]\s*(\d+)/i)?.[1] || '1'),
          phone_number: requestRecord.phoneNumber,
          custom_ref: requestRecord.id,
        }
      : {
          network_id: /airtel/i.test(requestRecord.details || '') ? 'airtel'
            : /glo/i.test(requestRecord.details || '') ? 'glo'
            : /9mobile/i.test(requestRecord.details || '') ? '9mobile' : 'mtn',
          phone: requestRecord.phoneNumber,
          amount: Number(requestRecord.amount),
        }
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) {
      const providerError = (await response.text()).slice(0, 500)
      throw new Error(`Provider fulfilment failed (${response.status}): ${providerError}`)
    }
  }

  const result = await db.transaction(async (tx) => {
    const updated = await tx.update(teacherRequest)
      .set({ status, updatedAt: new Date() })
      .where(and(
        eq(teacherRequest.id, requestId),
        eq(teacherRequest.status, 'pending'),
      ))
      .returning()
    if (!updated[0]) throw new Error('This request has already been processed.')

    if (status === 'rejected') {
      const wallet = await tx.query.teacherWallet.findFirst({
        where: eq(teacherWallet.teacherId, requestRecord.teacherId),
      })
      if (!wallet) throw new Error('Teacher wallet not found; cannot refund rejected request.')
      await tx.update(teacherWallet)
        .set({
          balance: sql`${teacherWallet.balance} + ${requestRecord.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(teacherWallet.id, wallet.id))
    }
    return updated[0]
  })

  revalidatePath('/dashboard/teacher/wallet')
  revalidatePath('/dashboard/admin/finance/teacher-requests')
  return result
}

export async function updateTeacherSalaryAmount(teacherId: string, salaryAmount: string) {
  const { user: currentUser, schoolId } = await getTeacherRequestAdminScope()
  const numericAmount = parseFloat(salaryAmount)
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    throw new Error('Please enter a valid salary amount.')
  }

  const targetTeacher = await db.query.teacher.findFirst({
    where: and(
      eq(teacher.id, teacherId),
      currentUser.role === 'SUPER_ADMIN' ? undefined : eq(teacher.schoolId, schoolId!),
    ),
  })
  if (!targetTeacher) throw new Error('Teacher not found in your school.')

  const wallet = await db.query.teacherWallet.findFirst({
    where: eq(teacherWallet.teacherId, teacherId)
  })

  if (!wallet) {
    await db.insert(teacherWallet).values({
      id: randomUUID(),
      teacherId,
      salaryAmount: numericAmount.toFixed(2),
      balance: '0.00',
      salaryStatus: 'pending',
      updatedAt: new Date()
    })
  } else {
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
  const { user: currentUser, schoolId } = await getTeacherRequestAdminScope()
  const targetTeacher = await db.query.teacher.findFirst({
    where: and(
      eq(teacher.id, teacherId),
      currentUser.role === 'SUPER_ADMIN' ? undefined : eq(teacher.schoolId, schoolId!),
    ),
  })
  if (!targetTeacher) throw new Error('Teacher not found in your school.')

  const wallet = await db.query.teacherWallet.findFirst({
    where: eq(teacherWallet.teacherId, teacherId)
  })
  if (!wallet) throw new Error('Wallet not found')
  if (!Number.isFinite(Number(wallet.salaryAmount)) || Number(wallet.salaryAmount) <= 0) {
    throw new Error('Set a valid salary amount before processing payment.')
  }

  const result = await db.update(teacherWallet)
    .set({
      salaryStatus: 'paid',
      balance: sql`${teacherWallet.balance} + ${wallet.salaryAmount}`,
      updatedAt: new Date()
    })
    .where(and(
      eq(teacherWallet.id, wallet.id),
      sql`${teacherWallet.salaryStatus} IS DISTINCT FROM 'paid'`,
    ))
    .returning()
  if (!result[0]) throw new Error('Salary has already been paid for this period.')

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
  const { user: currentUser, schoolId } = await getTeacherRequestAdminScope()
  const result = await db.update(teacher)
    .set({
      handlingClasses: classes,
      teachingSubjects: subjects,
      updatedAt: new Date()
    })
    .where(and(
      eq(teacher.id, teacherId),
      currentUser.role === 'SUPER_ADMIN' ? undefined : eq(teacher.schoolId, schoolId!),
    ))
    .returning()
  if (!result[0]) throw new Error('Teacher not found in your school.')

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
  if (!teacherProfile.schoolId) return []
  const studentsList = await db.query.student.findMany({
    where: eq(student.schoolId, teacherProfile.schoolId),
    orderBy: (s, { asc }) => [asc(s.class), asc(s.lastName), asc(s.firstName)],
  })
  return studentsList.filter(s => allowedClasses.has(normalizeClass(s.class)) && Array.isArray(s.subjectsDone) && (s.subjectsDone as string[]).some(item => item.toLowerCase() === subjectName.trim().toLowerCase()))
}

export async function getStudentFullProfile(studentId: string) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'TEACHER') throw new Error('Unauthorized')
  const profile = await db.query.teacher.findFirst({ where: eq(teacher.userId, session.user.id) })
  if (!profile?.schoolId) return null
  const learner = await db.query.student.findFirst({
    where: and(eq(student.id, studentId), eq(student.schoolId, profile.schoolId)),
  })
  if (!learner) return null
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

  const isTeacher = session.user.role === 'TEACHER'
  const allowedClasses = new Set(handlingClasses.map((name) => name.trim().toLowerCase()).filter(Boolean))
  const allowedSubjects = new Set(teachingSubjects.map((name) => name.trim().toLowerCase()).filter(Boolean))
  if (isTeacher && teacherProfile) {
    const registrations = await db
      .select({ className: class_.name, subjectName: subject.name })
      .from(teacherOnSubject)
      .innerJoin(class_, eq(teacherOnSubject.classId, class_.id))
      .innerJoin(subject, eq(teacherOnSubject.subjectId, subject.id))
      .where(and(
        eq(teacherOnSubject.teacherId, teacherProfile.id),
        eq(class_.schoolId, teacherProfile.schoolId || ''),
      ))
    for (const registration of registrations) {
      allowedClasses.add(registration.className.trim().toLowerCase())
      allowedSubjects.add(registration.subjectName.trim().toLowerCase())
    }
  }

  if (isTeacher && teacherProfile?.isClassTeacher && teacherProfile.assignedClassId) {
    const assignedClasses = await db.select({ name: class_.name }).from(class_).where(and(
        eq(class_.id, teacherProfile.assignedClassId),
        eq(class_.schoolId, teacherProfile.schoolId || ''),
      ))
    if (assignedClasses[0]) allowedClasses.add(assignedClasses[0].name.trim().toLowerCase())
  }

  const studentFilters: SQL[] = []
  if (isTeacher) {
    if (!teacherProfile?.schoolId || allowedClasses.size === 0) {
      return { results: [], classes: [], subjects: teachingSubjects, teacherType: teacherProfile?.type || 'FULL_TIME' }
    }
    studentFilters.push(eq(student.schoolId, teacherProfile.schoolId))
    studentFilters.push(inArray(student.class, [...allowedClasses]))
  } else if (session.user.role !== 'SUPER_ADMIN') {
    if (!session.user.schoolId) {
      throw new Error('School identity context missing for results access.')
    }
    studentFilters.push(eq(student.schoolId, session.user.schoolId))
  }

  const allowedStudents = studentFilters.length
    ? await db.query.student.findMany({
        where: and(...studentFilters),
        columns: { id: true },
      })
    : null
  const allowedStudentIds = allowedStudents?.map((record) => record.id)
  if (allowedStudentIds && allowedStudentIds.length === 0) {
    return { results: [], classes: [...allowedClasses], subjects: teachingSubjects, teacherType: teacherProfile?.type || 'FULL_TIME' }
  }

  const resultsList = await db.query.assessmentResult.findMany({
    where: allowedStudentIds ? inArray(assessmentResult.studentId, allowedStudentIds) : undefined,
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
  const filteredResults = isTeacher && allowedSubjects.size > 0
    ? resultsList.filter((result) =>
        allowedSubjects.has(result.assessment.subject.name.trim().toLowerCase())
      )
    : isTeacher
      ? []
      : resultsList

  return {
    results: filteredResults,
    classes: [...allowedClasses],
    subjects: [...allowedSubjects],
    teacherType: teacherProfile?.type || 'FULL_TIME',
  }
}

export async function updateSchoolSalaryPaymentDateAction(salaryPaymentDate: string) {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized')
  }

  const { user: userTable, school: schoolTable } = await import('@/lib/db/schema')
  const uRec = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) })
  const schoolId = uRec?.schoolId || session.user.schoolId

  if (!schoolId) throw new Error('School identity missing')

  await db.update(schoolTable)
    .set({ salaryPaymentDate: salaryPaymentDate.trim(), updatedAt: new Date() })
    .where(eq(schoolTable.id, schoolId))

  revalidatePath('/dashboard/admin/payroll/deductions')
  revalidatePath('/dashboard/teacher/payroll')
  return { success: true, salaryPaymentDate }
}

export async function getSchoolSalaryPaymentDateAction() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const { user: userTable, school: schoolTable } = await import('@/lib/db/schema')
  const uRec = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) })
  const schoolId = uRec?.schoolId || session.user.schoolId

  if (!schoolId) return { salaryPaymentDate: '25' }

  const sch = await db.query.school.findFirst({ where: eq(schoolTable.id, schoolId) })
  return { salaryPaymentDate: sch?.salaryPaymentDate || '25' }
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
