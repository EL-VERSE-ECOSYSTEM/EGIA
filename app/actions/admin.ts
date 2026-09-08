'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user as userTable, student, teacher, parent as parentTable, userRole, academicSession, term, class_, payment, promotionHistory, paymentInstallment, feeStructure } from '@/lib/db/schema'
import { eq, sql, and, count } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { checkPermission } from '@/lib/abac'
import { randomUUID } from 'crypto'
import { generateAdmissionNumber, isValidAdmissionNumber } from '@/lib/id'
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
    const admissionNumber = data.admissionNumber?.trim().toUpperCase() || generateAdmissionNumber(data.class)
    if (!isValidAdmissionNumber(admissionNumber, data.class)) {
      throw new Error('Admission number must match the learner level: EGIA-P-###### for Primary 3–5/6 or EGIA-S-###### for JSS1–SSS3.')
    }
    const studentId = randomUUID()

    let parentId = data.parentId
    if (actorRole === 'PARENT') {
      const parentProfile = await tx.query.parent.findFirst({
        where: eq(parentTable.userId, session.user.id)
      })
      if (parentProfile) parentId = parentProfile.id
      if (!parentId) throw new Error('Parent profile not found')
      const linkedCount = await tx.select({ value: count() }).from(student).where(eq(student.parentId, parentId))
      if ((linkedCount[0]?.value || 0) >= 5) throw new Error('A parent account can be linked to a maximum of 5 children.')
    }

    const newStudent = (await tx.insert(student).values({
      id: studentId,
      firstName: data.firstName,
      lastName: data.lastName,
      class: data.class,
      admissionNumber: admissionNumber,
      gender: data.gender,
      parentId: parentId,
      isActive: true,
      termId: data.termId,
      sessionId: data.sessionId
    }).returning())[0]

    let checkoutUrl: string | undefined
    if (actorRole === 'ADMIN') {
      await tx.insert(payment).values({
        id: randomUUID(), studentId, parentId: parentId || null, amount: '0.00', feeType: 'registration',
        paymentMethod: 'ADMIN', transactionReference: `ADMIN-ADMISSION-${studentId}`,
        status: 'success', paymentDate: new Date(), paidAt: new Date(),
        description: 'Admission provisioned by school administration — registration fee waived.',
      })
    } else {
      const reference = `EGIA-PARENT-REG-${Date.now()}-${randomUUID().slice(0, 8)}`
      await tx.update(student).set({ registrationStatus: 'PENDING_PAYMENT' }).where(eq(student.id, studentId))
      await tx.insert(payment).values({
        id: randomUUID(), studentId, parentId: parentId || null, amount: '2000.00', feeType: 'registration',
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
  return await db.query.payment.findMany({
    where: eq(payment.status, 'pending'),
    with: {
       student: true
    }
  })
}

export async function getAllPaymentsWithStudents() {
  await checkAdminPermission('read', 'payment')
  return await db.query.payment.findMany({
    with: {
       student: true
    },
    orderBy: (p, { desc }) => [desc(p.createdAt)]
  })
}

export async function verifyPayment(paymentId: string, status: 'success' | 'failed') {
  await checkAdminPermission('update', 'payment')

  const result = await db.update(payment)
    .set({
      status,
      paidAt: status === 'success' ? new Date() : null,
      updatedAt: new Date()
    })
    .where(eq(payment.id, paymentId))
    .returning()

  if (result[0]?.feeType === 'registration' && status === 'success') {
    await db.update(student).set({ registrationStatus: 'ACTIVE', updatedAt: new Date() }).where(eq(student.id, result[0].studentId))
  }
  revalidatePath('/dashboard/admin/finance/fees/pending')
  return result[0]
}

export async function getAdminDashboardStats() {
  const userId = await getUserId()
  const roleData = await getUserRoleData(userId)
  if (roleData?.role !== 'ADMIN') throw new Error('Permission denied')

  const [studentCount] = await db.select({ count: sql<number>`count(*)` }).from(student)
  const [teacherCount] = await db.select({ count: sql<number>`count(*)` }).from(teacher)
  const [parentCount] = await db.select({ count: sql<number>`count(*)` }).from(parentTable)
  const [revenue] = await db.select({ sum: sql<string>`sum(amount)` }).from(payment).where(eq(payment.status, 'success'))

  return {
    totalStudents: Number(studentCount?.count ?? 0),
    totalTeachers: Number(teacherCount?.count ?? 0),
    totalParents: Number(parentCount?.count ?? 0),
    revenue: revenue?.sum || '0',
    activeCBTs: 5
  }
}

export async function createAcademicSession(name: string, startDate: any, endDate: any) {
  await checkAdminPermission('create', 'academicSession')

  // Format string YYYY-MM-DD from input or Date
  const startStr = typeof startDate === 'string' ? startDate : new Date(startDate).toISOString().split('T')[0]
  const endStr = typeof endDate === 'string' ? endDate : new Date(endDate).toISOString().split('T')[0]

  return db.insert(academicSession).values({
    id: randomUUID(),
    name,
    startDate: startStr,
    endDate: endStr,
    isCurrent: true,
  } as any).returning()
}

export async function createTerm(sessionId: string, name: string, startDate: any, endDate: any) {
  await checkAdminPermission('create', 'term')

  // Format string YYYY-MM-DD from input or Date
  const startStr = typeof startDate === 'string' ? startDate : new Date(startDate).toISOString().split('T')[0]
  const endStr = typeof endDate === 'string' ? endDate : new Date(endDate).toISOString().split('T')[0]

  return db.insert(term).values({
    id: randomUUID(),
    sessionId,
    name,
    startDate: startStr,
    endDate: endStr,
    isCurrent: true,
  } as any).returning()
}

export async function getAllStudents() {
  await checkAdminPermission('read', 'student')
  return db.query.student.findMany()
}

export async function getAllTeachers() {
  await checkAdminPermission('read', 'teacher')
  return db.query.teacher.findMany()
}

export async function getAllParents() {
  await checkAdminPermission('read', 'parent')
  return db.query.parent.findMany()
}

export async function getEligibleStudents() {
  await checkAdminPermission('read', 'student')
  return db.query.student.findMany()
}

export async function promoteStudents(studentIds: string[], targetClass: string, reason: string, adminComment: string) {
  const userId = await getUserId()
  await checkAdminPermission('publish', 'student')

  return await db.transaction(async (tx) => {
    const results: any[] = []
    for (const id of studentIds) {
      const studentData = await tx.query.student.findFirst({
        where: eq(student.id, id)
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
        .where(eq(student.id, id))
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

  return await db.transaction(async (tx) => {
    const studentData = await tx.query.student.findFirst({
      where: eq(student.id, studentId)
    })

    if (!studentData) throw new Error('Student not found')

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
      .where(eq(student.id, studentId))
      .returning()

    revalidatePath('/dashboard/admin/users/students')
    return updated[0]
  })
}

export async function createInstallmentPlan(paymentId: string, totalAmount: number, numberOfInstallments: number = 10) {
  await checkAdminPermission('create', 'payment')

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
  return db.insert(teacher).values({
    id: randomUUID(),
    userId: data.userId,
    firstName: data.firstName,
    lastName: data.lastName,
    staffCode: data.staffCode,
    type: data.type,
    isClassTeacher: data.isClassTeacher,
    assignedClassId: data.assignedClassId,
    daysPresent: data.daysPresent,
    applicationLetterUrl: data.applicationLetterUrl,
    cvUrl: data.cvUrl,
    status: 'APPROVED'
  } as any).returning()
}

export async function getAllClasses() {
  await checkAdminPermission('read', 'class')
  return db.query.class_.findMany()
}

export async function processBulkPromotion(data: any) {
  return await promoteStudents(data.studentIds, data.targetClass, data.reason, data.adminComment)
}

export async function setFees(data: { class: string, department?: string, feeType: string, amount: string, dueDate: string }) {
  await checkAdminPermission('create', 'payment')
  return db.insert(feeStructure).values({
    id: randomUUID(),
    ...data
  }).returning()
}

export async function getAcademicSessions() {
  return db.query.academicSession.findMany()
}

export async function getTerms() {
  return db.query.term.findMany()
}
