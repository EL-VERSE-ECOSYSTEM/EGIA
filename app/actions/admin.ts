'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  user as userTable,
  student,
  teacher,
  parent as parentTable,
  userRole,
  academicSession,
  term,
  class_,
  payment,
  promotionHistory,
  paymentInstallment,
  feeStructure,
  schoolAdminRoles,
} from '@/lib/db/schema'
import { eq, sql, and, count, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { checkPermission } from '@/lib/abac'
import { randomUUID } from 'crypto'
import { generateAdmissionNumber, isValidAdmissionNumber, generateStaffId } from '@/lib/id'
import { studentEnrollmentSchema } from '@/lib/validators/student.schema'

async function getUserId() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function getUserRoleData(userId: string) {
  return await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  })
}

async function getAdminSchoolId(): Promise<string> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const userRec = await db.query.user.findFirst({
    where: eq(userTable.id, session.user.id),
  })

  if (userRec?.schoolId) return userRec.schoolId

  const adminRoleRec = await db.query.schoolAdminRoles.findFirst({
    where: eq(schoolAdminRoles.userId, session.user.id),
  })

  if (adminRoleRec?.schoolId) return adminRoleRec.schoolId

  const parentRec = await db.query.parent.findFirst({ where: eq(parentTable.userId, session.user.id) })
  if (parentRec?.schoolId) return parentRec.schoolId

  const teacherRec = await db.query.teacher.findFirst({ where: eq(teacher.userId, session.user.id) })
  if (teacherRec?.schoolId) return teacherRec.schoolId

  throw new Error('School identity context missing for administrative action.')
}

async function checkAdminPermission(action: any, resource: any) {
  const userId = await getUserId()
  const roleData = await getUserRoleData(userId)

  const hasPermission = await checkPermission(
    userId,
    roleData?.role || '',
    action,
    resource
  )

  if (!hasPermission) throw new Error('Permission denied')
  return true
}

export async function createStudent(data: any) {
  const validated = studentEnrollmentSchema.safeParse(data)
  if (!validated.success) throw new Error(validated.error.issues[0]?.message || 'Invalid student enrollment data')
  data = validated.data
  const session = await auth.getSession()
  if (!session) throw new Error('Unauthorized')

  const actorRole = session.user.role

  if (actorRole !== 'ADMIN' && actorRole !== 'PARENT') {
    throw new Error('Permission denied')
  }

  return await db.transaction(async (tx) => {
    let parentId: string | null = null
    let schoolId: string | null = null

    if (actorRole === 'PARENT') {
      const parentProfile = await tx.query.parent.findFirst({
        where: eq(parentTable.userId, session.user.id)
      })
      if (!parentProfile) throw new Error('Parent profile not found for current session')
      parentId = parentProfile.id
      schoolId = parentProfile.schoolId || null

      const linkedCount = await tx.select({ value: count() }).from(student).where(eq(student.parentId, parentId))
      if ((linkedCount[0]?.value || 0) >= 5) throw new Error('A parent account can be linked to a maximum of 5 children.')
    } else {
      schoolId = await getAdminSchoolId()
      if (data.parentId) {
        const pRec = await tx.query.parent.findFirst({
          where: and(eq(parentTable.id, data.parentId), eq(parentTable.schoolId, schoolId))
        })
        if (!pRec) throw new Error('Parent profile not found in this school.')
        parentId = pRec.id
      }
    }

    const admissionNumber = data.admissionNumber?.trim().toUpperCase() || generateAdmissionNumber(data.class)
    if (!isValidAdmissionNumber(admissionNumber, data.class)) {
      throw new Error('Admission number must match the learner level: EGIA-P-###### for Primary 3–5/6 or EGIA-S-###### for JSS1–SSS3.')
    }
    const studentId = randomUUID()

    const newStudent = (await tx.insert(student).values({
      id: studentId,
      schoolId,
      firstName: data.firstName,
      lastName: data.lastName,
      class: data.class,
      admissionNumber,
      gender: data.gender || 'Male',
      parentId,
      isActive: true,
      termId: data.termId,
      sessionId: data.sessionId,
    }).returning())[0]

    let checkoutUrl: string | undefined
    if (actorRole === 'ADMIN') {
      await tx.insert(payment).values({
        id: randomUUID(), schoolId, studentId, parentId: parentId || null, amount: '0.00', feeType: 'registration',
        paymentMethod: 'ADMIN', transactionReference: `ADMIN-ADMISSION-${studentId}`,
        status: 'success', paymentDate: new Date(), paidAt: new Date(),
        description: 'Admission provisioned by school administration — registration fee waived.',
      })
    } else {
      const reference = `EGIA-PARENT-REG-${Date.now()}-${randomUUID().slice(0, 8)}`
      await tx.update(student).set({ registrationStatus: 'PENDING_PAYMENT' }).where(eq(student.id, studentId))
      await tx.insert(payment).values({
        id: randomUUID(), schoolId, studentId, parentId: parentId || null, amount: '2100.00', feeType: 'registration',
        paymentMethod: 'KORAPAY', transactionReference: reference, status: 'pending',
        description: 'Parent registration — awaiting Korapay confirmation.',
      })
      const checkout = new URL(process.env.KORAPAY_CHECKOUT_LINK || 'https://checkout.korapay.com/pay/BHba4zdsceZDgyW')
      checkout.searchParams.set('reference', reference)
      const siteUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
      if (siteUrl) checkout.searchParams.set('redirect_url', `${siteUrl.replace(/\/$/, '')}/payment/return?reference=${encodeURIComponent(reference)}`)
      checkoutUrl = checkout.toString()
    }

    revalidatePath('/dashboard/admin/users/students/list')
    revalidatePath('/dashboard/parent/children/list')
    return { ...newStudent, checkoutUrl }
  })
}

export async function getPendingPayments() {
  await checkAdminPermission('read', 'payment')
  const schoolId = await getAdminSchoolId()
  return await db.query.payment.findMany({
    where: and(eq(payment.schoolId, schoolId), eq(payment.status, 'pending')),
    with: {
       student: true
    }
  })
}

export async function getAllPaymentsWithStudents() {
  await checkAdminPermission('read', 'payment')
  const schoolId = await getAdminSchoolId()
  const paymentsList = await db.query.payment.findMany({
    where: eq(payment.schoolId, schoolId),
    with: {
       student: true,
       parent: {
         with: {
           user: true
         }
       }
    },
    orderBy: (p, { desc }) => [desc(p.createdAt)]
  })

  const schoolFeeStructures = await db.query.feeStructure.findMany({
    where: eq(feeStructure.schoolId, schoolId)
  })

  return {
    payments: paymentsList,
    feeStructures: schoolFeeStructures
  }
}

export async function verifyPayment(paymentId: string, status: 'success' | 'failed') {
  await checkAdminPermission('update', 'payment')
  const schoolId = await getAdminSchoolId()

  return await db.transaction(async (tx) => {
    const existingPayment = await tx.query.payment.findFirst({
      where: and(eq(payment.id, paymentId), eq(payment.schoolId, schoolId))
    })

    if (!existingPayment) throw new Error('Payment record not found or tenant mismatch.')

    const result = await tx.update(payment)
      .set({
        status,
        paidAt: status === 'success' ? new Date() : null,
        updatedAt: new Date()
      })
      .where(and(eq(payment.id, paymentId), eq(payment.schoolId, schoolId)))
      .returning()

    if (result[0]?.feeType === 'registration' && status === 'success') {
      await tx.update(student)
        .set({ registrationStatus: 'ACTIVE', updatedAt: new Date() })
        .where(and(eq(student.id, result[0].studentId), eq(student.schoolId, schoolId)))
    }

    revalidatePath('/dashboard/admin/finance/fees/pending')
    return result[0]
  })
}

export async function getAdminDashboardStats() {
  const userId = await getUserId()
  const roleData = await getUserRoleData(userId)
  if (roleData?.role !== 'ADMIN' && roleData?.role !== 'SCHOOL_ADMIN' && roleData?.role !== 'SUPER_ADMIN') {
    throw new Error('Permission denied')
  }

  const schoolId = await getAdminSchoolId()

  const [studentCount] = await db.select({ count: sql<number>`count(*)` }).from(student).where(eq(student.schoolId, schoolId))
  const [teacherCount] = await db.select({ count: sql<number>`count(*)` }).from(teacher).where(eq(teacher.schoolId, schoolId))
  const [parentCount] = await db.select({ count: sql<number>`count(*)` }).from(parentTable).where(eq(parentTable.schoolId, schoolId))
  const [revenue] = await db.select({ sum: sql<string>`sum(amount)` }).from(payment).where(and(eq(payment.schoolId, schoolId), eq(payment.status, 'success')))

  return {
    totalStudents: Number(studentCount?.count ?? 0),
    totalTeachers: Number(teacherCount?.count ?? 0),
    totalParents: Number(parentCount?.count ?? 0),
    revenue: revenue?.sum || '0',
    activeCBTs: 0
  }
}

export async function createAcademicSession(name: string, startDate: any, endDate: any) {
  await checkAdminPermission('create', 'academicSession')

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    throw new Error('Invalid academic session date range. End date must be after start date.')
  }

  const startStr = start.toISOString().split('T')[0]
  const endStr = end.toISOString().split('T')[0]

  return await db.transaction(async (tx) => {
    await tx.update(academicSession).set({ isCurrent: false })

    return (await tx.insert(academicSession).values({
      id: randomUUID(),
      name,
      startDate: startStr,
      endDate: endStr,
      isCurrent: true,
    } as any).returning())
  })
}

export async function createTerm(sessionId: string, name: string, startDate: any, endDate: any) {
  await checkAdminPermission('create', 'term')

  const existingSession = await db.query.academicSession.findFirst({
    where: eq(academicSession.id, sessionId)
  })

  if (!existingSession) throw new Error('Academic session not found.')

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    throw new Error('Invalid term date range. End date must be after start date.')
  }

  const startStr = start.toISOString().split('T')[0]
  const endStr = end.toISOString().split('T')[0]

  return await db.transaction(async (tx) => {
    await tx.update(term).set({ isCurrent: false }).where(eq(term.sessionId, sessionId))

    return (await tx.insert(term).values({
      id: randomUUID(),
      sessionId,
      name,
      startDate: startStr,
      endDate: endStr,
      isCurrent: true,
    } as any).returning())
  })
}

export async function getAllStudents() {
  await checkAdminPermission('read', 'student')
  const schoolId = await getAdminSchoolId()
  return db.query.student.findMany({ where: eq(student.schoolId, schoolId) })
}

export async function getAllTeachers() {
  await checkAdminPermission('read', 'teacher')
  const schoolId = await getAdminSchoolId()
  return db.query.teacher.findMany({ where: eq(teacher.schoolId, schoolId) })
}

export async function getAllParents() {
  await checkAdminPermission('read', 'parent')
  const schoolId = await getAdminSchoolId()
  return db.query.parent.findMany({ where: eq(parentTable.schoolId, schoolId) })
}

export async function getEligibleStudents() {
  await checkAdminPermission('read', 'student')
  const schoolId = await getAdminSchoolId()
  return db.query.student.findMany({ where: eq(student.schoolId, schoolId) })
}

export async function promoteStudents(studentIds: string[], targetClass: string, reason: string, adminComment: string) {
  const userId = await getUserId()
  await checkAdminPermission('publish', 'student')
  const schoolId = await getAdminSchoolId()

  return await db.transaction(async (tx) => {
    const results: any[] = []
    for (const id of studentIds) {
      const studentData = await tx.query.student.findFirst({
        where: and(eq(student.id, id), eq(student.schoolId, schoolId))
      })

      if (!studentData) continue

      await tx.insert(promotionHistory).values({
        id: randomUUID(),
        studentId: id,
        fromClass: studentData.class,
        toClass: targetClass,
        type: 'PROMOTION',
        reason,
        adminComment,
        performedBy: userId
      })

      const updated = await tx.update(student)
        .set({ class: targetClass, updatedAt: new Date() })
        .where(and(eq(student.id, id), eq(student.schoolId, schoolId)))
        .returning()

      results.push(updated[0])
    }

    revalidatePath('/dashboard/admin/users/students')
    return results
  })
}

export async function demoteStudent(studentId: string, targetClass: string, reason: string, adminComment: string) {
  const userId = await getUserId()
  await checkAdminPermission('publish', 'student')
  const schoolId = await getAdminSchoolId()

  return await db.transaction(async (tx) => {
    const studentData = await tx.query.student.findFirst({
      where: and(eq(student.id, studentId), eq(student.schoolId, schoolId))
    })

    if (!studentData) throw new Error('Student not found in current school tenant')

    await tx.insert(promotionHistory).values({
      id: randomUUID(),
      studentId,
      fromClass: studentData.class,
      toClass: targetClass,
      type: 'DEMOTION',
      reason,
      adminComment,
      performedBy: userId
    })

    const updated = await tx.update(student)
      .set({ class: targetClass, updatedAt: new Date() })
      .where(and(eq(student.id, studentId), eq(student.schoolId, schoolId)))
      .returning()

    revalidatePath('/dashboard/admin/users/students')
    return updated[0]
  })
}

export async function createInstallmentPlan(paymentId: string, totalAmount: number, numberOfInstallments: number = 10) {
  await checkAdminPermission('create', 'payment')
  const schoolId = await getAdminSchoolId()

  const targetPayment = await db.query.payment.findFirst({
    where: and(eq(payment.id, paymentId), eq(payment.schoolId, schoolId))
  })

  if (!targetPayment) throw new Error('Payment record not found or tenant mismatch.')

  const installmentAmount = (totalAmount / numberOfInstallments).toFixed(2)
  const installments: any[] = []
  const intervalDays = Math.floor(90 / numberOfInstallments)

  for (let i = 1; i <= numberOfInstallments; i++) {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + (i * intervalDays))

    installments.push({
      id: randomUUID(),
      paymentId,
      amount: installmentAmount,
      dueDate: dueDate.toISOString().split('T')[0],
      installmentNumber: i,
      status: 'pending'
    })
  }

  const results = await db.insert(paymentInstallment).values(installments as any).returning()
  revalidatePath('/dashboard/parent/payments')
  return results
}

export async function createTeacher(data: any) {
  await checkAdminPermission('create', 'teacher')
  const schoolId = await getAdminSchoolId()

  const email = (data.email || '').trim().toLowerCase()
  if (!email) throw new Error('Teacher email address is required')

  const staffCode = data.staffCode || generateStaffId()
  let userId = randomUUID()

  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (secretKey) {
    const { createClient: createSupabaseAdminClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
    const adminClient = createSupabaseAdminClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const authRes = await adminClient.auth.admin.createUser({
      id: userId,
      email: email,
      email_confirm: true,
      user_metadata: {
        full_name: `${data.firstName} ${data.lastName}`,
        role: 'TEACHER',
        staff_code: staffCode,
        school_id: schoolId,
      },
    })

    if (authRes.error || !authRes.data?.user?.id) {
      throw new Error(`Failed to create teacher account in Supabase Auth: ${authRes.error?.message || 'Unknown error'}`)
    }
    userId = authRes.data.user.id as `${string}-${string}-${string}-${string}-${string}`
  }

  return await db.transaction(async (tx) => {
    await tx.insert(userTable).values({
      id: userId,
      email: email,
      name: `${data.firstName} ${data.lastName}`,
      schoolId: schoolId,
    }).onConflictDoNothing()

    await tx.insert(userRole).values({
      id: randomUUID(),
      userId: userId,
      role: 'TEACHER',
    }).onConflictDoNothing()

    const insertedTeacher = (await tx.insert(teacher).values({
      id: randomUUID(),
      userId: userId,
      schoolId: schoolId,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber || data.phone || null,
      gender: data.gender || 'Male',
      staffCode: staffCode,
      type: data.type || 'FULL_TIME',
      isClassTeacher: Boolean(data.isClassTeacher),
      assignedClassId: data.assignedClassId || null,
      daysPresent: Array.isArray(data.daysPresent) ? data.daysPresent : [],
      applicationLetterUrl: data.applicationLetterUrl || null,
      cvUrl: data.cvUrl || null,
      qualification: data.qualification || null,
      specialization: data.specialization || null,
      status: 'APPROVED',
      isActive: true,
    } as any).returning())[0]

    revalidatePath('/dashboard/admin/users/teachers/list')
    return insertedTeacher
  })
}

export async function getAllClasses() {
  await checkAdminPermission('read', 'class')
  const schoolId = await getAdminSchoolId()
  return db.query.class_.findMany({ where: eq(class_.schoolId, schoolId) })
}

export async function processBulkPromotion(data: any) {
  return await promoteStudents(data.studentIds, data.targetClass, data.reason, data.adminComment)
}

export async function setFees(data: { class: string, department?: string, feeType: string, amount: string, dueDate?: string, warningDate?: string }) {
  await checkAdminPermission('create', 'payment')
  const schoolId = await getAdminSchoolId()

  const inserted = await db.insert(feeStructure).values({
    id: randomUUID(),
    schoolId,
    class: data.class,
    department: data.department || null,
    feeType: data.feeType,
    amount: data.amount,
    dueDate: data.dueDate || null,
    warningDate: data.warningDate || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()

  revalidatePath('/dashboard/admin/finance/fees/structure')
  return inserted[0]
}

export async function getFeeStructuresAction() {
  await checkAdminPermission('read', 'payment')
  const schoolId = await getAdminSchoolId()
  return db.query.feeStructure.findMany({
    where: eq(feeStructure.schoolId, schoolId),
    orderBy: (f, { desc }) => [desc(f.createdAt)]
  })
}

export async function deleteFeeStructureAction(id: string) {
  await checkAdminPermission('update', 'payment')
  const schoolId = await getAdminSchoolId()

  await db.delete(feeStructure).where(and(eq(feeStructure.id, id), eq(feeStructure.schoolId, schoolId)))
  revalidatePath('/dashboard/admin/finance/fees/structure')
  return { success: true }
}

export async function getAcademicSessions() {
  return db.query.academicSession.findMany()
}

export async function getTerms() {
  return db.query.term.findMany()
}

export async function createSchoolAdmin(data: { name: string; email: string; phone?: string; adminLevel?: string }) {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'PRIMARY_ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
    throw new Error('Unauthorized: Primary Administrator permissions required.')
  }

  const schoolId = await getAdminSchoolId()
  const adminEmail = data.email.trim().toLowerCase()
  const adminLevel = data.adminLevel || 'VICE_PRINCIPAL_ACADEMICS'
  let userId = randomUUID()

  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (secretKey) {
    const { createClient: createSupabaseAdminClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
    const adminClient = createSupabaseAdminClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const authRes = await adminClient.auth.admin.createUser({
      id: userId,
      email: adminEmail,
      email_confirm: true,
      user_metadata: {
        full_name: data.name,
        role: 'SCHOOL_ADMIN',
        admin_level: adminLevel,
        school_id: schoolId,
      },
    })

    if (authRes.error || !authRes.data?.user?.id) {
      throw new Error(`Failed to create school admin account in Supabase Auth: ${authRes.error?.message || 'Unknown error'}`)
    }
    userId = authRes.data.user.id as `${string}-${string}-${string}-${string}-${string}`
  }

  await db.transaction(async (tx) => {
    await tx.insert(userTable).values({
      id: userId,
      email: adminEmail,
      name: data.name,
      schoolId: schoolId,
      adminLevel: adminLevel,
      lastIdentityId: schoolId,
      lastIdentityAt: new Date(),
    }).onConflictDoNothing()

    await tx.insert(userRole).values({
      id: randomUUID(),
      userId: userId,
      role: 'SCHOOL_ADMIN',
    }).onConflictDoNothing()

    await tx.insert(schoolAdminRoles).values({
      id: randomUUID(),
      schoolId: schoolId,
      userId: userId,
      level: adminLevel,
      isActive: true,
    }).onConflictDoUpdate({
      target: [schoolAdminRoles.schoolId, schoolAdminRoles.userId],
      set: { level: adminLevel, isActive: true },
    })
  })

  revalidatePath('/dashboard/admin/users/admins/list')
  return { success: true, userId, email: adminEmail, adminLevel }
}

export async function promoteTeacherAction(data: {
  teacherId: string
  newType?: 'FULL_TIME' | 'PART_TIME'
  isClassTeacher?: boolean
  adminLevel?: 'PRIMARY_ADMIN' | 'VICE_PRINCIPAL_ACADEMICS' | 'VICE_PRINCIPAL_ADMIN' | 'HOD_SCIENCE' | 'HOD_ARTS' | 'HOD_COMMERCIAL' | 'NONE'
}) {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized: School Admin permissions required.')
  }

  const schoolId = await getAdminSchoolId()

  const teacherRecord = await db.query.teacher.findFirst({
    where: and(eq(teacher.id, data.teacherId), eq(teacher.schoolId, schoolId))
  })

  if (!teacherRecord) throw new Error('Teacher record not found in current school tenant.')

  return await db.transaction(async (tx) => {
    await tx.update(teacher)
      .set({
        type: data.newType || teacherRecord.type,
        isClassTeacher: data.isClassTeacher !== undefined ? data.isClassTeacher : teacherRecord.isClassTeacher,
        updatedAt: new Date()
      })
      .where(and(eq(teacher.id, data.teacherId), eq(teacher.schoolId, schoolId)))

    if (data.adminLevel && data.adminLevel !== 'NONE' && teacherRecord.userId) {
      const existingRole = await tx.query.userRole.findFirst({
        where: eq(userRole.userId, teacherRecord.userId)
      })

      if (existingRole) {
        await tx.update(userRole)
          .set({ role: 'SCHOOL_ADMIN' })
          .where(eq(userRole.userId, teacherRecord.userId))
      } else {
        await tx.insert(userRole).values({
          id: randomUUID(),
          userId: teacherRecord.userId,
          role: 'SCHOOL_ADMIN'
        })
      }

      await tx.insert(schoolAdminRoles).values({
        id: randomUUID(),
        schoolId: schoolId,
        userId: teacherRecord.userId,
        level: data.adminLevel,
        isActive: true
      }).onConflictDoUpdate({
        target: [schoolAdminRoles.schoolId, schoolAdminRoles.userId],
        set: { level: data.adminLevel, isActive: true }
      })
    }

    revalidatePath('/dashboard/admin/users/teachers/list')
    revalidatePath('/dashboard/admin/users/teachers')
    return { success: true }
  })
}

export async function getSchoolAdmins() {
  const session = await auth.getSession()
  if (!session?.user) return []

  const schoolId = await getAdminSchoolId()

  const usersInSchool = await db.query.user.findMany({
    where: eq(userTable.schoolId, schoolId),
    with: {
      userRole: true,
    },
    orderBy: (u, { desc }) => [desc(u.createdAt)],
  })

  return usersInSchool.filter(u => u.userRole?.role === 'ADMIN' || u.userRole?.role === 'SCHOOL_ADMIN' || u.userRole?.role === 'SUPER_ADMIN')
}
