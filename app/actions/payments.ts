'use server'

import { db } from '@/lib/db'
import { payment, student, paymentReceiptUploads, user as userTable, parent as parentTable, feeStructure, studentGifts, term, paymentInstallment, schoolAdminRoles, transactionLedger } from '@/lib/db/schema'
import { eq, and, desc, sql, notInArray, inArray } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseSecretKey, getSupabaseUrl } from '@/utils/supabase/config'
import { canSchoolAdminAccess } from '@/lib/auth/school-admin-permissions'
import { allocatePaymentAcrossInstallments, splitAmountIntoInstallments, createInstallmentDueDates, INSTALLMENTS_PER_TERM } from '@/lib/payments/installments'
import { notifyPaymentConfirmed, notifyPaymentStatus } from '@/lib/payments/notifications'
import {
  initializePaystackPayment as serviceInitializePaystackPayment,
  verifyPaystackPayment as serviceVerifyPaystackPayment,
} from '@/lib/payments/service'

const PAYSTACK_GATEWAY_FEE = 161.25
const REGISTRATION_FEE = 2000.00

async function assertStudentPaymentAccess(
  user: { id: string; role: string; schoolId: string | null; adminLevel?: string | null },
  studentRecord: typeof student.$inferSelect,
) {
  if (user.role === 'SUPER_ADMIN') return
  if (['STUDENT', 'PUPIL'].includes(user.role) && studentRecord.userId === user.id) return

  if (user.role === 'PARENT') {
    const parentRecord = await db.query.parent.findFirst({ where: eq(parentTable.userId, user.id) })
    if (parentRecord?.id === studentRecord.parentId && parentRecord.schoolId === studentRecord.schoolId) return
  }

  if (
    (user.role === 'ADMIN' || (user.role === 'SCHOOL_ADMIN' && user.adminLevel === 'PRIMARY_ADMIN')) &&
    user.schoolId &&
    studentRecord.schoolId === user.schoolId
  ) return

  throw new Error('Forbidden: You can only access payment records for your own student or school.')
}

function assertReceiptSchoolAccess(user: { role: string; schoolId: string | null; adminLevel?: string | null }, schoolId: string) {
  if (user.role === 'SUPER_ADMIN') return
  if (
    (user.role === 'ADMIN' || (user.role === 'SCHOOL_ADMIN' && user.adminLevel === 'PRIMARY_ADMIN')) &&
    user.schoolId &&
    user.schoolId === schoolId
  ) return

  throw new Error('Forbidden: You can only review receipts for your own school.')
}

export async function getPaystackGatewayFee() {
  return PAYSTACK_GATEWAY_FEE
}

async function getSchoolPaymentAdminContext(action: 'read' | 'create') {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Sign in before managing school payments.')
  const role = session.user.role.toUpperCase()
  if (!['ADMIN', 'SCHOOL_ADMIN'].includes(role)) throw new Error('Only school administrators can manage in-school payments.')
  if (role === 'SCHOOL_ADMIN' && !canSchoolAdminAccess(session.user.adminLevel, action, 'payment')) {
    throw new Error('Your school administrator role does not have permission to manage payments.')
  }

  const [userRecord, adminRole] = await Promise.all([
    db.query.user.findFirst({ where: eq(userTable.id, session.user.id) }),
    db.query.schoolAdminRoles.findFirst({
      where: and(eq(schoolAdminRoles.userId, session.user.id), eq(schoolAdminRoles.isActive, true)),
    }),
  ])
  const schoolId = session.user.schoolId || userRecord?.schoolId || adminRole?.schoolId || null
  if (!schoolId) throw new Error('Your administrator account is not assigned to a school.')
  return { session, schoolId }
}

export async function getManualPaymentOptions() {
  const { schoolId } = await getSchoolPaymentAdminContext('read')
  const [students, fees] = await Promise.all([
    db.query.student.findMany({
      where: and(eq(student.schoolId, schoolId), eq(student.isActive, true)),
      orderBy: (record, { asc }) => [asc(record.lastName), asc(record.firstName)],
    }),
    db.query.feeStructure.findMany({
      where: and(eq(feeStructure.schoolId, schoolId), eq(feeStructure.isActive, true)),
      orderBy: (record, { asc }) => [asc(record.feeType)],
    }),
  ])
  const parentIds = [...new Set(students.map((record) => record.parentId).filter(
    (id): id is string => Boolean(id),
  ))]
  const linkedParents = parentIds.length
    ? await db.query.parent.findMany({
      where: and(inArray(parentTable.id, parentIds), eq(parentTable.schoolId, schoolId)),
    })
    : []
  const parentUsers = linkedParents.length
    ? await db.query.user.findMany({
      where: inArray(userTable.id, linkedParents.map((record) => record.userId)),
    })
    : []
  const usersById = new Map(parentUsers.map((record) => [record.id, record]))
  const parentsById = new Map(linkedParents.map((record) => [record.id, record]))
  return {
    students: students.map(({ id, firstName, lastName, class: className, admissionNumber, department, parentId }) => {
      const linkedParent = parentId ? parentsById.get(parentId) : null
      return {
        id,
        firstName,
        lastName,
        class: className,
        admissionNumber,
        department,
        parentName: linkedParent ? `${linkedParent.firstName} ${linkedParent.lastName}`.trim() : null,
        parentEmail: linkedParent ? usersById.get(linkedParent.userId)?.email || null : null,
      }
    }),
    fees: fees.map(({ id, class: className, department, feeType, amount }) => ({
      id, class: className, department, feeType, amount,
    })),
  }
}

export async function recordManualSchoolPayment(data: {
  studentId: string
  amount: string
  feeType: string
  paymentMethod: string
  receiptReference?: string
}) {
  const { session, schoolId } = await getSchoolPaymentAdminContext('create')
  if (!data || typeof data.studentId !== 'string' || typeof data.feeType !== 'string' ||
    typeof data.amount !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(data.amount) ||
    typeof data.paymentMethod !== 'string' ||
    (data.receiptReference !== undefined && typeof data.receiptReference !== 'string')) {
    throw new Error('Enter a student, fee category, payment method, and valid amount.')
  }
  const amount = Number(data.amount)
  const feeType = data.feeType.trim()
  const method = data.paymentMethod.toUpperCase()
  const receiptReference = data.receiptReference?.trim()
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
    throw new Error('Enter a valid payment amount greater than zero.')
  }
  if (!feeType || feeType.length > 80) throw new Error('Select a valid fee category.')
  if (!['CASH', 'BANK_TRANSFER', 'POS', 'CHEQUE', 'OTHER'].includes(method)) {
    throw new Error('Select a supported in-school payment method.')
  }
  if (receiptReference && receiptReference.length > 100) {
    throw new Error('Receipt reference must be 100 characters or fewer.')
  }

  const currentStudent = await db.query.student.findFirst({
    where: and(eq(student.id, data.studentId), eq(student.schoolId, schoolId), eq(student.isActive, true)),
  })
  if (!currentStudent) throw new Error('Select an active student from your school.')
  const applicableFees = await db.query.feeStructure.findMany({
    where: and(
      eq(feeStructure.schoolId, schoolId),
      eq(feeStructure.class, currentStudent.class),
      eq(feeStructure.isActive, true),
    ),
  })
  const approvedFee = applicableFees.find((fee) =>
    fee.feeType === feeType && fee.department === currentStudent.department
  ) || applicableFees.find((fee) => fee.feeType === feeType && !fee.department)
  if (!approvedFee) throw new Error('The selected fee category is not active for this student.')
  const paymentTermId = currentStudent.termId || (await getParentTerm(currentStudent))?.id || null

  const now = new Date()
  const paymentId = randomUUID()
  const transactionReference = `SCHOOL-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`
  const recordedPayment = await db.transaction(async (tx) => {
    const [created] = await tx.insert(payment).values({
      id: paymentId,
      schoolId,
      studentId: currentStudent.id,
      parentId: currentStudent.parentId,
      termId: paymentTermId,
      amount: amount.toFixed(2),
      feeType,
      paymentMethod: method,
      transactionReference,
      reconciliationStatus: 'RECONCILED',
      reconciledBy: session.user.id,
      reconciledAt: now,
      status: 'success',
      paymentDate: now,
      paidAt: now,
      description: receiptReference
        ? `In-school payment recorded by administrator. Receipt: ${receiptReference}`
        : 'In-school payment recorded by administrator.',
      createdAt: now,
      updatedAt: now,
    }).returning()

    await tx.insert(transactionLedger).values({
      id: randomUUID(),
      schoolId,
      userId: session.user.id,
      studentId: currentStudent.id,
      type: feeType.toLowerCase().includes('registration') ? 'REGISTRATION_FEE' : 'FEE_PAYMENT',
      direction: 'IN',
      amount: created.amount,
      currency: 'NGN',
      reference: transactionReference,
      gateway: 'SCHOOL_ACCOUNT',
      status: 'SUCCESS',
      description: created.description,
      confirmationMethod: 'SCHOOL_ACCOUNT',
      metadata: { paymentId: created.id, feeType },
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing()

    if (paymentTermId) {
      const scheduledInstallments = await tx.query.paymentInstallment.findMany({
        where: and(
          eq(paymentInstallment.studentId, currentStudent.id),
          eq(paymentInstallment.schoolId, schoolId),
          eq(paymentInstallment.termId, paymentTermId),
          eq(paymentInstallment.feeType, feeType),
          inArray(paymentInstallment.status, ['pending', 'partial', 'overdue']),
        ),
        orderBy: (record, { asc }) => [asc(record.dueDate), asc(record.installmentNumber)],
      })
      const allocation = allocatePaymentAcrossInstallments(scheduledInstallments, amount)
      for (const update of allocation.updates) {
        await tx.update(paymentInstallment)
          .set({
            paidAmount: update.paidAmount,
            status: update.status,
            paidAt: update.isPaid ? now : null,
          })
          .where(eq(paymentInstallment.id, update.id))
      }
    }

    if (feeType.toLowerCase() === 'registration') {
      const paidRecords = await tx.query.payment.findMany({
        where: and(
          eq(payment.studentId, currentStudent.id),
          eq(payment.schoolId, schoolId),
          eq(payment.feeType, feeType),
          eq(payment.status, 'success'),
        ),
      })
      const netPaid = paidRecords.reduce((sum, record) => sum + Math.max(
        0,
        Number(record.amount || 0) - (record.paymentMethod.toUpperCase() === 'PAYSTACK' ? PAYSTACK_GATEWAY_FEE : 0),
      ), 0)
      if (netPaid >= Number(approvedFee.amount)) {
        await tx.update(student)
          .set({ registrationStatus: 'ACTIVE', registrationPaid: true, updatedAt: now })
          .where(and(eq(student.id, currentStudent.id), eq(student.schoolId, schoolId)))
      }
    }

    return created
  })

  await notifyPaymentConfirmed(recordedPayment.id)
  revalidatePath('/dashboard/admin/finance/fees/payments')
  revalidatePath('/dashboard/parent/payments/history')
  revalidatePath('/dashboard/student/payments/history')
  return { success: true, paymentId: recordedPayment.id, reference: recordedPayment.transactionReference }
}

async function getParentTerm(studentRecord: typeof student.$inferSelect) {
  const currentTerm = studentRecord.termId
    ? await db.query.term.findFirst({ where: eq(term.id, studentRecord.termId) })
    : await db.query.term.findFirst({ where: eq(term.isCurrent, true) })
  return currentTerm || null
}

async function getSuccessfulFeePayments(studentId: string, schoolId: string, termId: string, feeType?: string) {
  return db.query.payment.findMany({
    where: and(
      eq(payment.studentId, studentId),
      eq(payment.schoolId, schoolId),
      eq(payment.termId, termId),
      ...(feeType ? [eq(payment.feeType, feeType)] : []),
      eq(payment.status, 'success'),
    ),
  })
}

function getNetPaidAmount(records: typeof payment.$inferSelect[]) {
  return records.reduce((sum, record) => sum + Math.max(
    0,
    Number(record.amount || 0) - (record.paymentMethod.toUpperCase() === 'PAYSTACK' ? PAYSTACK_GATEWAY_FEE : 0),
  ), 0)
}

export async function getParentInstallmentOptions() {
  const session = await auth.getSession()
  if (!session?.user || session.user.role.toUpperCase() !== 'PARENT') {
    throw new Error('Only a parent account can manage linked student installments.')
  }
  const parentProfile = await db.query.parent.findFirst({
    where: eq(parentTable.userId, session.user.id),
  })
  if (!parentProfile?.schoolId) return []

  const children = await db.query.student.findMany({
    where: and(eq(student.parentId, parentProfile.id), eq(student.schoolId, parentProfile.schoolId)),
    orderBy: (record, { asc }) => [asc(record.lastName), asc(record.firstName)],
  })
  return Promise.all(children.map(async (child) => {
    const [fees, currentTerm] = await Promise.all([
      child.schoolId ? db.query.feeStructure.findMany({
        where: and(
          eq(feeStructure.schoolId, child.schoolId),
          eq(feeStructure.class, child.class),
          eq(feeStructure.isActive, true),
        ),
      }) : Promise.resolve([]),
      getParentTerm(child),
    ])
    const applicableFees = fees.filter((fee) =>
      !fee.department || fee.department === child.department
    )
    const termPayments = child.schoolId && currentTerm
      ? await getSuccessfulFeePayments(child.id, child.schoolId, currentTerm.id)
      : []
    return {
      studentId: child.id,
      studentName: `${child.firstName} ${child.lastName}`.trim(),
      className: child.class,
      termId: currentTerm?.id || null,
      termName: currentTerm?.name || null,
      termStartDate: currentTerm?.startDate || null,
      termEndDate: currentTerm?.endDate || null,
      gatewayFee: PAYSTACK_GATEWAY_FEE,
      fees: applicableFees.map((fee) => ({
        id: fee.id,
        feeType: fee.feeType,
        amount: fee.amount,
        remainingAmount: Math.max(0, Number(fee.amount) - getNetPaidAmount(termPayments.filter((record) => record.feeType === fee.feeType))),
      })),
    }
  }))
}

export async function getParentInstallments() {
  const session = await auth.getSession()
  if (!session?.user || session.user.role.toUpperCase() !== 'PARENT') {
    throw new Error('Only a parent account can view student installments.')
  }
  const parentProfile = await db.query.parent.findFirst({
    where: eq(parentTable.userId, session.user.id),
  })
  if (!parentProfile?.schoolId) return []

  const installments = await db.query.paymentInstallment.findMany({
    where: and(
      eq(paymentInstallment.parentId, parentProfile.id),
      eq(paymentInstallment.schoolId, parentProfile.schoolId),
    ),
    orderBy: (record, { asc }) => [asc(record.dueDate), asc(record.installmentNumber)],
    limit: 500,
  })
  const studentIds = [...new Set(installments.map((item) => item.studentId).filter(
    (id): id is string => Boolean(id),
  ))]
  const students = studentIds.length
    ? await db.query.student.findMany({
      where: and(inArray(student.id, studentIds), eq(student.schoolId, parentProfile.schoolId)),
    })
    : []
  const studentById = new Map(students.map((record) => [record.id, record]))
  return installments.map((item) => ({
    id: item.id,
    studentId: item.studentId,
    studentName: item.studentId
      ? `${studentById.get(item.studentId)?.firstName || ''} ${studentById.get(item.studentId)?.lastName || ''}`.trim()
      : 'Student',
    termId: item.termId,
    feeType: item.feeType,
    amount: item.amount,
    paidAmount: item.paidAmount,
    dueDate: item.dueDate,
    installmentNumber: item.installmentNumber,
    status: item.status,
  }))
}

export async function createParentInstallmentPlan(studentId: string, feeType: string) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role.toUpperCase() !== 'PARENT') {
    throw new Error('Only a parent account can create a payment plan.')
  }
  const parentProfile = await db.query.parent.findFirst({
    where: eq(parentTable.userId, session.user.id),
  })
  if (!parentProfile?.schoolId) throw new Error('Parent profile is not assigned to a school.')
  const child = await db.query.student.findFirst({
    where: and(eq(student.id, studentId), eq(student.parentId, parentProfile.id), eq(student.schoolId, parentProfile.schoolId)),
  })
  if (!child || !child.schoolId) throw new Error('This student is not linked to your school account.')
  const currentTerm = await getParentTerm(child)
  if (!currentTerm) throw new Error('Your school has not assigned this student to an active term.')
  const today = new Date()
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const termEnd = new Date(`${currentTerm.endDate}T00:00:00.000Z`)
  if (!Number.isFinite(termEnd.getTime()) || termEnd.getTime() < todayUtc) {
    throw new Error('This term has ended. Contact your school to confirm the current fee schedule.')
  }
  const fees = await db.query.feeStructure.findMany({
    where: and(
      eq(feeStructure.schoolId, child.schoolId),
      eq(feeStructure.class, child.class),
      eq(feeStructure.isActive, true),
    ),
  })
  const selectedFee = fees.find((fee) =>
    fee.feeType === feeType && fee.department === child.department
  ) || fees.find((fee) => fee.feeType === feeType && !fee.department)
  if (!selectedFee) throw new Error('The selected fee is not active for this student.')

  const existingPlan = await db.query.paymentInstallment.findMany({
    where: and(
      eq(paymentInstallment.studentId, child.id),
      eq(paymentInstallment.schoolId, child.schoolId),
      eq(paymentInstallment.termId, currentTerm.id),
      eq(paymentInstallment.feeType, selectedFee.feeType),
    ),
  })
  if (existingPlan.length && existingPlan.length !== INSTALLMENTS_PER_TERM) {
    throw new Error('An incomplete plan already exists for this student and term. Contact your school administrator.')
  }
  if (existingPlan.length === INSTALLMENTS_PER_TERM) {
    return { success: true, alreadyCreated: true, installments: existingPlan }
  }

  const termPayments = await getSuccessfulFeePayments(child.id, child.schoolId, currentTerm.id, selectedFee.feeType)
  const remainingAmount = Number(selectedFee.amount) - getNetPaidAmount(termPayments)
  if (remainingAmount <= 0) throw new Error('This school fee has already been paid in full for the term.')
  const amountPieces = splitAmountIntoInstallments(remainingAmount)
  const termStart = new Date(`${currentTerm.startDate}T00:00:00.000Z`)
  const rangeStart = new Date(Math.max(todayUtc, termStart.getTime()))
  const dueDates = createInstallmentDueDates(rangeStart, termEnd, INSTALLMENTS_PER_TERM)

  const now = new Date()
  const records = amountPieces.map((amount, index) => ({
    id: randomUUID(),
    paymentId: null,
    schoolId: child.schoolId,
    studentId: child.id,
    parentId: parentProfile.id,
    termId: currentTerm.id,
    feeType: selectedFee.feeType,
    amount,
    dueDate: dueDates[index],
    installmentNumber: index + 1,
    status: 'pending',
    createdAt: now,
  }))

  await db.transaction(async (tx) => {
    await tx.insert(paymentInstallment).values(records).onConflictDoNothing()
  })
  const plan = await db.query.paymentInstallment.findMany({
    where: and(
      eq(paymentInstallment.studentId, child.id),
      eq(paymentInstallment.termId, currentTerm.id),
      eq(paymentInstallment.feeType, selectedFee.feeType),
    ),
    orderBy: (record, { asc }) => [asc(record.installmentNumber)],
  })
  if (plan.length !== INSTALLMENTS_PER_TERM) {
    throw new Error('The installment plan could not be created completely. Please retry or contact your school.')
  }

  revalidatePath('/dashboard/parent/payments/installments')
  return { success: true, alreadyCreated: false, installments: plan }
}

export async function initializeInstallmentPayment(installmentId: string) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role.toUpperCase() !== 'PARENT') {
    throw new Error('Only a parent account can pay linked student installments.')
  }
  const parentProfile = await db.query.parent.findFirst({
    where: eq(parentTable.userId, session.user.id),
  })
  if (!parentProfile?.schoolId) throw new Error('Parent profile is not assigned to a school.')
  const installment = await db.query.paymentInstallment.findFirst({
    where: and(eq(paymentInstallment.id, installmentId), eq(paymentInstallment.parentId, parentProfile.id)),
  })
  if (!installment || !installment.studentId || !installment.schoolId || !installment.termId || !installment.feeType) {
    throw new Error('Installment not found for your linked students.')
  }
  if (installment.status === 'paid') throw new Error('This installment has already been paid.')
  if (installment.status === 'processing' && !installment.paymentId) {
    throw new Error('This installment payment is already being initialized.')
  }

  if (installment.paymentId) {
    const previousAttempt = await db.query.payment.findFirst({
      where: eq(payment.id, installment.paymentId),
    })
    if (previousAttempt?.status === 'pending') {
      const previousVerification = previousAttempt.transactionReference
        ? await serviceVerifyPaystackPayment({ reference: previousAttempt.transactionReference })
        : null
      const terminalFailure = previousVerification?.data &&
        ['failed', 'abandoned'].includes(String(previousVerification.data.status).toLowerCase())
      if (!terminalFailure) {
        if (previousVerification?.success) throw new Error('This installment has already been paid.')
        throw new Error('The previous checkout has not reached a confirmed failure. Check its status before trying again.')
      }
    }
  }

  const claim = await db.update(paymentInstallment)
    .set({ status: 'processing' })
    .where(and(
      eq(paymentInstallment.id, installment.id),
      eq(paymentInstallment.parentId, parentProfile.id),
      inArray(paymentInstallment.status, ['pending', 'partial', 'overdue']),
    ))
    .returning({ id: paymentInstallment.id })
  if (!claim.length) throw new Error('This installment is no longer available to pay.')

  const child = await db.query.student.findFirst({
    where: and(eq(student.id, installment.studentId), eq(student.parentId, parentProfile.id), eq(student.schoolId, installment.schoolId)),
  })
  const payer = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) })
  if (!child || !payer?.email) {
    await db.update(paymentInstallment)
      .set({ status: Number(installment.paidAmount || 0) > 0 ? 'partial' : 'pending' })
      .where(eq(paymentInstallment.id, installment.id))
    throw new Error('A linked student and valid parent email are required for checkout.')
  }

  try {
    const remainingAmount = Number((Number(installment.amount) - Number(installment.paidAmount || 0)).toFixed(2))
    if (remainingAmount <= 0) throw new Error('This installment has already been paid.')
    const totalAmount = Number((remainingAmount + PAYSTACK_GATEWAY_FEE).toFixed(2))
    const paymentResult = await serviceInitializePaystackPayment({
      schoolId: installment.schoolId,
      studentId: child.id,
      parentId: parentProfile.id,
      termId: installment.termId,
      installmentId: installment.id,
      amount: totalAmount,
      feeType: installment.feeType,
      description: `Installment ${installment.installmentNumber} of ${INSTALLMENTS_PER_TERM} for ${child.firstName} ${child.lastName}`,
      customerEmail: payer.email,
      customerName: `${child.firstName} ${child.lastName}`,
      metadata: {
        studentId: child.id,
        parentId: parentProfile.id,
        termId: installment.termId,
        installmentId: installment.id,
        installmentNumber: installment.installmentNumber,
        baseAmount: remainingAmount,
        gatewayFee: PAYSTACK_GATEWAY_FEE,
      },
    })
    revalidatePath('/dashboard/parent/payments/installments')
    return paymentResult
  } catch (error) {
    await db.update(paymentInstallment)
      .set({ status: Number(installment.paidAmount || 0) > 0 ? 'partial' : 'pending' })
      .where(and(eq(paymentInstallment.id, installment.id), eq(paymentInstallment.status, 'processing')))
    throw error
  }
}

export async function verifyPaystackPayment(reference: string) {
  const result = await serviceVerifyPaystackPayment({ reference })
  revalidatePath('/dashboard/parent/payments/history')
  revalidatePath('/dashboard/student/payments/history')
  return result
}

export async function submitManualPayment(data: { studentId: string; amount: string; feeType: string; receiptUrl: string; fileType: string }) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  if (session.user.role.toUpperCase() !== 'PARENT') throw new Error('Only the linked parent can submit a manual payment receipt.')
  if (!data || typeof data.studentId !== 'string' || typeof data.feeType !== 'string' ||
    typeof data.amount !== 'string' || typeof data.receiptUrl !== 'string' || typeof data.fileType !== 'string' ||
    !/^\d+(?:\.\d{1,2})?$/.test(data.amount) || data.feeType.length > 80) {
    throw new Error('Invalid payment details.')
  }

  const currentStudent = await db.query.student.findFirst({ where: eq(student.id, data.studentId) })
  if (!currentStudent) throw new Error('Student record not found')
  await assertStudentPaymentAccess(session.user, currentStudent)
  if (!currentStudent.schoolId) throw new Error('Student is not assigned to a school fee schedule.')
  const schoolId = currentStudent.schoolId
  const pRec = await db.query.parent.findFirst({ where: eq(parentTable.userId, session.user.id) })
  if (!pRec || pRec.id !== currentStudent.parentId || pRec.schoolId !== schoolId) {
    throw new Error('This student is not linked to your parent account and school.')
  }

  const claimedAmount = Number(data.amount)
  if (!Number.isFinite(claimedAmount) || claimedAmount <= 0) throw new Error('Enter a valid payment amount.')
  const receiptUrl = new URL(data.receiptUrl)
  const storageBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!storageBaseUrl) throw new Error('Receipt storage is not configured.')
  const storageOrigin = new URL(storageBaseUrl)
  const localHttpStorage = process.env.NODE_ENV !== 'production' && storageOrigin.protocol === 'http:'
  const receiptObjectPrefix = `/storage/v1/object/public/school-receipts/${schoolId}/${currentStudent.id}/${pRec.id}/`
  if ((!localHttpStorage && receiptUrl.protocol !== 'https:') || receiptUrl.origin !== storageOrigin.origin ||
    !receiptUrl.pathname.startsWith(receiptObjectPrefix) ||
    receiptUrl.username || receiptUrl.password || receiptUrl.hash) {
    throw new Error('Receipt must be stored in this application’s Supabase Storage.')
  }
  const receiptObjectPath = decodeURIComponent(receiptUrl.pathname.slice(receiptObjectPrefix.length))
  if (!receiptObjectPath || receiptObjectPath.includes('/') || receiptObjectPath === '.' || receiptObjectPath === '..') {
    throw new Error('Receipt storage path is invalid.')
  }
  if (!['image/png', 'image/jpeg', 'application/pdf'].includes(data.fileType)) {
    throw new Error('Receipt must be a PNG, JPEG, or PDF file.')
  }

  const schoolFees = await db.query.feeStructure.findMany({
    where: and(
      eq(feeStructure.schoolId, schoolId),
      eq(feeStructure.class, currentStudent.class),
      eq(feeStructure.isActive, true),
    ),
  })
  const approvedFee = schoolFees.find((fee) => fee.feeType === data.feeType && fee.department === currentStudent.department) ||
    schoolFees.find((fee) => fee.feeType === data.feeType && !fee.department)
  if (!approvedFee || Number(approvedFee.amount) !== claimedAmount) {
    throw new Error('The amount and fee type must match an active fee set by your school.')
  }

  const paymentId = randomUUID()
  const uploadId = randomUUID()
  const manualReference = `MANUAL-${Date.now()}-${randomUUID().slice(0, 6)}`

  await db.transaction(async (tx) => {
    await tx.insert(payment).values({
      id: paymentId,
      schoolId,
      studentId: currentStudent.id,
      parentId: pRec.id,
      amount: claimedAmount.toFixed(2),
      feeType: data.feeType,
      paymentMethod: 'BANK_TRANSFER',
      transactionReference: manualReference,
      status: 'pending',
      receiptUrl: receiptUrl.toString(),
      description: `Manual receipt upload for ${data.feeType}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await tx.insert(transactionLedger).values({
      id: randomUUID(),
      schoolId,
      userId: session.user.id,
      studentId: currentStudent.id,
      type: data.feeType.toLowerCase().includes('registration') ? 'REGISTRATION_FEE' : 'FEE_PAYMENT',
      direction: 'IN',
      amount: claimedAmount.toFixed(2),
      currency: 'NGN',
      reference: manualReference,
      gateway: 'SCHOOL_ACCOUNT',
      status: 'PENDING',
      description: `Manual receipt upload for ${data.feeType}`,
      confirmationMethod: 'MANUAL_UPLOAD',
      metadata: { paymentId, uploadId, feeType: data.feeType },
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing()

    await tx.insert(paymentReceiptUploads).values({
      id: uploadId,
      schoolId,
      paymentId: paymentId,
      studentId: currentStudent.id,
      parentId: pRec.id,
      uploadedBy: session.user.id,
      uploadedByRole: 'PARENT',
      fileUrl: receiptUrl.toString(),
      filePath: `${schoolId}/${currentStudent.id}/${pRec.id}/${receiptObjectPath}`,
      fileType: data.fileType,
      amountClaimed: claimedAmount.toFixed(2),
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  })

  await notifyPaymentStatus(paymentId, 'pending')
  revalidatePath('/dashboard/parent/payments/history')
  return { success: true, paymentId, uploadId }
}

export async function initializePaystackPayment(data: { studentId: string; amount: number; feeType: string; description?: string }) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const child = await db.query.student.findFirst({ where: eq(student.id, data.studentId) })
  if (!child) throw new Error('Student record was not found.')
  await assertStudentPaymentAccess(session.user, child)

  if (!child.schoolId) throw new Error('Student does not have a school fee schedule.')
  const schoolFees = await db.query.feeStructure.findMany({
    where: and(
      eq(feeStructure.schoolId, child.schoolId),
      eq(feeStructure.class, child.class),
      eq(feeStructure.isActive, true),
    ),
  })
  const approvedFee = schoolFees.find((fee) =>
    fee.feeType === data.feeType && fee.department === child.department
  ) || schoolFees.find((fee) =>
    fee.feeType === data.feeType && !fee.department
  )
  if (!approvedFee || !Number.isFinite(data.amount) || data.amount <= 0) {
    throw new Error('The selected fee or amount is not approved by this school.')
  }

  const paymentTerm = await getParentTerm(child)
  const termId = paymentTerm?.id || child.termId || undefined
  const previousPayments = child.schoolId && termId
    ? await getSuccessfulFeePayments(child.id, child.schoolId, termId, approvedFee.feeType)
    : []
  const baseAmount = Math.max(0, Number(approvedFee.amount) - getNetPaidAmount(previousPayments))
  if (baseAmount <= 0 || Math.round(baseAmount * 100) !== Math.round(Number(data.amount) * 100)) {
    throw new Error('The amount must match the remaining fee balance for this student and term.')
  }
  const totalAmount = Number((baseAmount + PAYSTACK_GATEWAY_FEE).toFixed(2))

  const paymentConfirmationMessage = `Payment of ₦${baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} for ${approvedFee.feeType.toUpperCase()} (${child.firstName} ${child.lastName}, Class: ${child.class}) + Payment Processing Fee (₦161.25)`

  const paymentRes = await serviceInitializePaystackPayment({
    schoolId: child.schoolId || undefined,
    termId,
    studentId: child.id,
    parentId: child.parentId || undefined,
    amount: totalAmount,
    feeType: approvedFee.feeType,
    description: paymentConfirmationMessage,
    customerEmail: session.user.email || `student_${child.id}@ellearners.app`,
    customerName: `${child.firstName} ${child.lastName}`,
    metadata: {
      studentId: child.id,
      type: data.feeType,
      baseAmount,
      termId,
      gatewayFee: PAYSTACK_GATEWAY_FEE,
    },
  })

  return {
    checkoutUrl: paymentRes.checkoutUrl,
    reference: paymentRes.reference,
    paymentId: paymentRes.paymentId,
    totalAmount,
  }
}

export async function initializeStudentRegistrationPayment(studentId: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Sign in before paying student registration.')
  const child = await db.query.student.findFirst({ where: eq(student.id, studentId) })
  if (!child) throw new Error('Student registration record was not found.')
  if (child.registrationStatus !== 'PENDING_PAYMENT' || child.registrationPaid) {
    throw new Error('This student registration is not awaiting payment.')
  }
  await assertStudentPaymentAccess({ ...session.user, role: session.user.role.toUpperCase() }, child)

  const studentAccount = child.userId
    ? await db.query.user.findFirst({ where: eq(userTable.id, child.userId) })
    : null
  const customerEmail = session.user.email || studentAccount?.email
  if (!customerEmail) throw new Error('A valid payer email is required for registration checkout.')

  const totalAmount = REGISTRATION_FEE + PAYSTACK_GATEWAY_FEE

  const paymentRes = await serviceInitializePaystackPayment({
    schoolId: child.schoolId || undefined,
    studentId: child.id,
    parentId: child.parentId || undefined,
    amount: totalAmount,
    feeType: 'registration',
    description: `Session registration for ${child.firstName} ${child.lastName} (NGN 2000 + NGN 161.25 payment processing fee)`,
    customerEmail,
    customerName: `${child.firstName} ${child.lastName}`,
    metadata: {
      studentId: child.id,
      type: 'STUDENT_REGISTRATION',
    },
  })

  await db.update(student)
    .set({ registrationStatus: 'PENDING_PAYMENT', updatedAt: new Date() })
    .where(eq(student.id, studentId))

  return {
    checkoutUrl: paymentRes.checkoutUrl,
    reference: paymentRes.reference,
    paymentId: paymentRes.paymentId,
    totalAmount,
  }
}

export async function getPaymentSummary(studentId: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const studentRecord = await db.query.student.findFirst({ where: eq(student.id, studentId) })
  if (!studentRecord) throw new Error('Student record not found')
  await assertStudentPaymentAccess(session.user, studentRecord)

  const payments = await db.query.payment.findMany({
    where: eq(payment.studentId, studentRecord.id),
    orderBy: [desc(payment.createdAt)],
  })

  const totalPaid = payments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const pendingCount = payments.filter(p => p.status === 'pending').length

  return { payments, totalPaid, pendingCount }
}

export async function getStudentPaymentHistory(studentId?: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  let targetStudentId = studentId
  if (!targetStudentId) {
    const sRec = await db.query.student.findFirst({ where: eq(student.userId, session.user.id) })
    if (!sRec) throw new Error('Student record not found')
    targetStudentId = sRec.id
  }

  const studentRecord = await db.query.student.findFirst({ where: eq(student.id, targetStudentId) })
  if (!studentRecord) throw new Error('Student record not found')
  await assertStudentPaymentAccess(session.user, studentRecord)

  const payments = await db.query.payment.findMany({
    where: eq(payment.studentId, studentRecord.id),
    orderBy: [desc(payment.createdAt)]
  })
  if (!studentRecord.schoolId) return payments.map((record) => ({ ...record, feeCleared: false }))

  const fees = await db.query.feeStructure.findMany({
    where: and(
      eq(feeStructure.schoolId, studentRecord.schoolId),
      eq(feeStructure.class, studentRecord.class),
      eq(feeStructure.isActive, true),
    ),
  })

  return payments.map((record) => {
    const fee = fees.find((item) =>
      item.feeType === record.feeType && item.department === studentRecord.department
    ) || fees.find((item) => item.feeType === record.feeType && !item.department)
    if (!fee || record.status !== 'success') return { ...record, feeCleared: false }
    const paidForFee = getNetPaidAmount(payments.filter((item) =>
      item.status === 'success' &&
      item.feeType === record.feeType &&
      item.termId === record.termId
    ))
    return { ...record, feeCleared: paidForFee >= Number(fee.amount) }
  })
}

export async function getParentPaymentHistory() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const pRec = await db.query.parent.findFirst({ where: eq(parentTable.userId, session.user.id) })
  if (!pRec) return []

  const list = await db.query.payment.findMany({
    where: eq(payment.parentId, pRec.id),
    with: { student: true },
    orderBy: [desc(payment.createdAt)]
  })

  return list.map(p => ({
    ...p,
    childName: p.student ? `${p.student.firstName} ${p.student.lastName}` : 'Ward / Child',
  }))
}

export async function getStudentIdByAdmissionNumber(admissionNumber: string) {
  const session = await auth.getSession()
  if (!session?.user) return null
  const child = await db.query.student.findFirst({ where: eq(student.admissionNumber, admissionNumber.trim().toUpperCase()) })
  return child?.userId === session.user.id ? child.id : null
}

export async function getFeeStructuresForClass(className: string, department?: string, studentId?: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const role = session.user.role.toUpperCase()
  let schoolId = session.user.schoolId || (await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) }))?.schoolId || null
  let paymentStudent: typeof student.$inferSelect | null = null
  if (role === 'PARENT') {
    if (!studentId) throw new Error('Choose one of your linked students.')
    const parentProfile = await db.query.parent.findFirst({ where: eq(parentTable.userId, session.user.id) })
    const child = parentProfile && await db.query.student.findFirst({
      where: and(eq(student.id, studentId), eq(student.parentId, parentProfile.id)),
    })
    if (!child || child.class.toLowerCase() !== className.toLowerCase() ||
      (department && child.department?.toLowerCase() !== department.toLowerCase())) {
      throw new Error('Student payment scope does not match your account.')
    }
    schoolId = child.schoolId
    paymentStudent = child
  } else if (['STUDENT', 'PUPIL'].includes(role)) {
    const child = await db.query.student.findFirst({ where: eq(student.userId, session.user.id) })
    if (!child || child.id !== studentId) throw new Error('Student payment scope does not match your account.')
    schoolId = child.schoolId
    paymentStudent = child
  }
  if (!schoolId) return []

  const list = await db.query.feeStructure.findMany({
    where: and(eq(feeStructure.schoolId, schoolId), eq(feeStructure.isActive, true))
  })

  const applicableFees = list.filter(f =>
    f.class.toLowerCase() === className.toLowerCase() &&
    (!f.department || (!!department && f.department.toLowerCase() === department.toLowerCase()))
  )
  if (!paymentStudent?.schoolId) return applicableFees
  const currentTerm = await getParentTerm(paymentStudent)
  if (!currentTerm) return applicableFees
  const termPayments = await getSuccessfulFeePayments(
    paymentStudent.id,
    paymentStudent.schoolId,
    currentTerm.id,
  )
  return applicableFees.map((fee) => ({
    ...fee,
    amount: Math.max(
      0,
      Number(fee.amount) - getNetPaidAmount(termPayments.filter((record) => record.feeType === fee.feeType)),
    ).toFixed(2),
  }))
}

export async function approveReceipt(uploadId: string) {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized')
  }

  const upload = await db.query.paymentReceiptUploads.findFirst({ where: eq(paymentReceiptUploads.id, uploadId) })
  if (!upload) throw new Error('Receipt upload record not found')
  assertReceiptSchoolAccess(session.user, upload.schoolId)
  if (upload.status !== 'PENDING' || !upload.paymentId) throw new Error('Only pending receipts linked to a payment can be approved.')

  const now = new Date()

  const approvedPaymentId = await db.transaction(async (tx) => {
    const paymentRecord = await tx.query.payment.findFirst({
      where: and(eq(payment.id, upload.paymentId!), eq(payment.schoolId, upload.schoolId)),
    })
    if (!paymentRecord || paymentRecord.status !== 'pending' || paymentRecord.paymentMethod.toUpperCase() === 'PAYSTACK') {
      throw new Error('Receipt is not linked to a pending manual payment for this school.')
    }

    const updatedPayment = await tx.update(payment).set({
      reconciliationStatus: 'RECONCILED',
      reconciledBy: session.user.id,
      reconciledAt: now,
      status: 'success',
      paidAt: now,
      updatedAt: now,
    }).where(and(
      eq(payment.id, paymentRecord.id),
      eq(payment.schoolId, upload.schoolId),
      eq(payment.status, 'pending'),
      notInArray(payment.paymentMethod, ['PAYSTACK']),
    )).returning({ id: payment.id, feeType: payment.feeType, studentId: payment.studentId })
    if (!updatedPayment.length) throw new Error('Payment is no longer pending.')

    const approvedUpload = await tx.update(paymentReceiptUploads).set({
      status: 'APPROVED',
      reviewedBy: session.user.id,
      reviewedAt: now,
      updatedAt: now,
    }).where(and(
      eq(paymentReceiptUploads.id, uploadId),
      eq(paymentReceiptUploads.schoolId, upload.schoolId),
      eq(paymentReceiptUploads.status, 'PENDING'),
    )).returning({ id: paymentReceiptUploads.id })
    if (!approvedUpload.length) throw new Error('Receipt is no longer pending.')

    if (updatedPayment[0].feeType === 'registration') {
      await tx.update(student).set({ registrationStatus: 'ACTIVE', updatedAt: now })
        .where(and(eq(student.id, updatedPayment[0].studentId), eq(student.schoolId, upload.schoolId)))
    }
    const ledgerReference = paymentRecord.transactionReference || paymentRecord.id
    await tx.insert(transactionLedger).values({
      id: randomUUID(),
      schoolId: upload.schoolId,
      userId: session.user.id,
      studentId: paymentRecord.studentId,
      type: paymentRecord.feeType?.toLowerCase().includes('registration') ? 'REGISTRATION_FEE' : 'FEE_PAYMENT',
      direction: 'IN',
      amount: paymentRecord.amount,
      currency: 'NGN',
      reference: ledgerReference,
      gateway: 'SCHOOL_ACCOUNT',
      status: 'SUCCESS',
      description: paymentRecord.description,
      confirmationMethod: 'MANUAL_UPLOAD',
      receiptUploadId: uploadId,
      metadata: { paymentId: paymentRecord.id, feeType: paymentRecord.feeType },
      createdAt: paymentRecord.createdAt,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: transactionLedger.reference,
      set: { status: 'SUCCESS', updatedAt: now, receiptUploadId: uploadId },
    })
    return updatedPayment[0].id
  })

  await notifyPaymentConfirmed(approvedPaymentId)
  revalidatePath('/dashboard/admin/payments/pending-receipts')
  return { success: true }
}

export async function rejectReceipt(uploadId: string, reason: string) {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized')
  }

  const now = new Date()
  const upload = await db.query.paymentReceiptUploads.findFirst({ where: eq(paymentReceiptUploads.id, uploadId) })
  if (!upload) throw new Error('Receipt upload record not found')
  assertReceiptSchoolAccess(session.user, upload.schoolId)

  const failedPaymentId = await db.transaction(async (tx) => {
    const [rejectedUpload] = await tx.update(paymentReceiptUploads).set({
      status: 'REJECTED',
      rejectionReason: reason,
      reviewedBy: session.user.id,
      reviewedAt: now,
      updatedAt: now,
    }).where(and(
      eq(paymentReceiptUploads.id, uploadId),
      eq(paymentReceiptUploads.schoolId, upload.schoolId),
      eq(paymentReceiptUploads.status, 'PENDING'),
    )).returning({ paymentId: paymentReceiptUploads.paymentId })
    if (!rejectedUpload) throw new Error('Only a pending receipt can be rejected.')
    if (!rejectedUpload.paymentId) return null

    const [failedPayment] = await tx.update(payment).set({
      status: 'failed',
      updatedAt: now,
    }).where(and(
      eq(payment.id, rejectedUpload.paymentId),
      eq(payment.schoolId, upload.schoolId),
      eq(payment.status, 'pending'),
      notInArray(payment.paymentMethod, ['PAYSTACK']),
    )).returning({ id: payment.id })
    if (!failedPayment) throw new Error('Receipt is not linked to a pending manual payment for this school.')
    const failedPaymentRecord = await tx.query.payment.findFirst({
      where: and(eq(payment.id, failedPayment.id), eq(payment.schoolId, upload.schoolId)),
    })
    if (failedPaymentRecord?.transactionReference) {
      await tx.update(transactionLedger)
        .set({ status: 'FAILED', updatedAt: now })
        .where(eq(transactionLedger.reference, failedPaymentRecord.transactionReference))
    }
    return failedPayment.id
  })

  if (failedPaymentId) await notifyPaymentStatus(failedPaymentId, 'failed')
  revalidatePath('/dashboard/admin/payments/pending-receipts')
  return { success: true }
}

export async function getPaymentReceiptReviewList() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  const role = session.user.role.toUpperCase()
  if (!['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(role)) throw new Error('Unauthorized')
  if (role === 'SCHOOL_ADMIN' && !canSchoolAdminAccess(session.user.adminLevel, 'read', 'payment')) throw new Error('Unauthorized')

  const schoolId = role === 'SUPER_ADMIN'
    ? null
    : session.user.schoolId || (await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) }))?.schoolId || null
  if (role !== 'SUPER_ADMIN' && !schoolId) throw new Error('School context is required.')
  const uploads = await db.query.paymentReceiptUploads.findMany({
    where: schoolId
      ? and(eq(paymentReceiptUploads.schoolId, schoolId), eq(paymentReceiptUploads.status, 'PENDING'))
      : eq(paymentReceiptUploads.status, 'PENDING'),
    orderBy: [desc(paymentReceiptUploads.createdAt)],
    limit: 200,
  })
  const secretKey = getSupabaseSecretKey()
  if (uploads.length && !secretKey) throw new Error('Private receipt storage is not configured.')
  const storageAdmin = secretKey
    ? createSupabaseClient(getSupabaseUrl(), secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null
  return Promise.all(uploads.map(async (upload) => {
    const signed = upload.filePath && storageAdmin
      ? await storageAdmin.storage.from('school-receipts').createSignedUrl(upload.filePath, 300)
      : null
    return {
      id: upload.id,
      schoolid: upload.schoolId,
      payment_id: upload.paymentId,
      student_id: upload.studentId,
      amount_claimed: upload.amountClaimed,
      status: upload.status,
      created_at: upload.createdAt,
      generated_receipt_url: null,
      file_url: signed?.data?.signedUrl || null,
    }
  }))
}

export async function getReceiptDownloadUrl(uploadId: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const upload = await db.query.paymentReceiptUploads.findFirst({
    where: eq(paymentReceiptUploads.id, uploadId)
  })
  if (!upload?.generatedReceiptPath) return null

  const isUploader = upload.uploadedBy === session.user.id
  const isSameSchoolAdmin = ['ADMIN', 'SCHOOL_ADMIN'].includes(session.user.role) &&
    !!session.user.schoolId && session.user.schoolId === upload.schoolId
  if (!isUploader && !isSameSchoolAdmin && session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: You cannot access this receipt.')
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data } = await supabase.storage.from('school-generated-receipts')
    .createSignedUrl(upload.generatedReceiptPath, 3600)

  return data?.signedUrl || null
}

export async function getAdminWalletSummaryAction() {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized')
  }

  const uRec = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) })
  const schoolId = uRec?.schoolId || session.user.schoolId

  if (!schoolId) throw new Error('School identity missing')

  const [schoolPayments, allSchoolPayments, ledgerEntries] = await Promise.all([
    db.query.payment.findMany({
      where: and(eq(payment.schoolId, schoolId), eq(payment.status, 'success')),
    }),
    db.query.payment.findMany({
      where: eq(payment.schoolId, schoolId),
      with: { student: true },
      orderBy: [desc(payment.createdAt)],
      limit: 200,
    }),
    db.query.transactionLedger.findMany({
      where: eq(transactionLedger.schoolId, schoolId),
      orderBy: [desc(transactionLedger.createdAt)],
      limit: 200,
    }),
  ])

  const ledgerReferences = new Set(ledgerEntries.map((record) => record.reference).filter(Boolean))
  const legacyPayments = allSchoolPayments.filter((record) =>
    !record.transactionReference || !ledgerReferences.has(record.transactionReference)
  )
  const ledgerStudentIds = [...new Set(ledgerEntries.map((record) => record.studentId).filter(
    (id): id is string => Boolean(id),
  ))]
  const ledgerStudents = ledgerStudentIds.length
    ? await db.query.student.findMany({ where: inArray(student.id, ledgerStudentIds) })
    : []
  const studentsById = new Map(ledgerStudents.map((record) => [record.id, record]))
  const recentTransactions = [
    ...ledgerEntries.map((record) => ({
      id: record.id,
      student: record.studentId ? studentsById.get(record.studentId) || null : null,
      feeType: record.type,
      amount: record.amount,
      paymentMethod: record.gateway || 'N/A',
      transactionReference: record.reference,
      createdAt: record.createdAt,
      direction: record.type === 'REGISTRATION_FEE' ? 'OUT' : record.direction,
      status: record.status,
      description: record.description,
    })),
    ...legacyPayments.map((record) => ({
      ...record,
      direction: 'IN',
      description: record.description,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const totalRevenue = schoolPayments.reduce((sum, record) => sum + Number(record.amount || 0), 0)

  const categoryBreakdown: Record<string, number> = {}
  for (const record of schoolPayments) {
    const category = record.feeType || 'tuition'
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Number(record.amount || 0)
  }

  return {
    totalRevenue,
    transactionCount: ledgerEntries.filter((record) => record.status === 'SUCCESS').length +
      legacyPayments.filter((record) => record.status === 'success').length,
    categoryBreakdown,
    recentTransactions: recentTransactions.slice(0, 100),
  }
}

export async function getParentWalletSummaryAction() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const pRec = await db.query.parent.findFirst({ where: eq(parentTable.userId, session.user.id) })
  if (!pRec) return { parent: null, children: [], totalFeesPaid: 0, totalPaid: 0, pendingAmount: 0, paymentsCount: 0, recentPayments: [], payments: [] }

  const payments = await db.query.payment.findMany({
    where: eq(payment.parentId, pRec.id),
    orderBy: [desc(payment.createdAt)],
  })

  const children = await db.query.student.findMany({
    where: eq(student.parentId, pRec.id)
  })

  const totalPaid = payments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  return {
    parent: pRec,
    children,
    totalFeesPaid: totalPaid,
    totalPaid,
    pendingAmount,
    paymentsCount: payments.length,
    recentTransactions: payments.slice(0, 15),
    recentPayments: payments.slice(0, 15),
    payments,
  }
}

export async function getStudentWalletStatsAction(studentIdInput?: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  let studentRec
  if (studentIdInput) {
    studentRec = await db.query.student.findFirst({ where: eq(student.id, studentIdInput) })
  } else {
    studentRec = await db.query.student.findFirst({ where: eq(student.userId, session.user.id) })
  }

  if (!studentRec) throw new Error('Student record not found')
  await assertStudentPaymentAccess(session.user, studentRec)

  const now = new Date()

  await db.update(studentGifts)
    .set({ status: 'EXPIRED' })
    .where(
      and(
        eq(studentGifts.studentId, studentRec.id),
        eq(studentGifts.status, 'AVAILABLE'),
        sql`${studentGifts.expiresAt} < ${now}`
      )
    )

  const gifts = await db.query.studentGifts.findMany({
    where: eq(studentGifts.studentId, studentRec.id),
    orderBy: [desc(studentGifts.createdAt)]
  })

  const activeGifts = gifts.filter(g => g.status === 'AVAILABLE' && new Date(g.expiresAt) > now)
  const redeemedCashTotal = gifts.filter(g => g.status === 'REDEEMED_CASH').reduce((s, g) => s + Number(g.amount || 0), 0)
  const appliedFeeCreditTotal = gifts.filter(g => g.status === 'APPLIED_TO_FEES').reduce((s, g) => s + Number(g.amount || 0), 0)

  return {
    student: studentRec,
    activeGifts,
    allGifts: gifts,
    redeemedCashTotal,
    appliedFeeCreditTotal
  }
}

export async function claimStudentGiftAction(giftId: string, actionType: 'CASH' | 'FEE_CREDIT') {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const sRec = await db.query.student.findFirst({ where: eq(student.userId, session.user.id) })
  const gift = await db.query.studentGifts.findFirst({ where: eq(studentGifts.id, giftId) })

  if (!gift) throw new Error('Gift record not found')
  if (!sRec || gift.studentId !== sRec.id) {
    throw new Error('Forbidden: You can only claim your own student reward gifts.')
  }

  if (gift.status !== 'AVAILABLE' || new Date(gift.expiresAt) <= new Date()) {
    throw new Error('This reward gift has expired or has already been claimed.')
  }

  const newStatus = actionType === 'CASH' ? 'REDEEMED_CASH' : 'APPLIED_TO_FEES'

  await db.update(studentGifts)
    .set({ status: newStatus })
    .where(and(eq(studentGifts.id, giftId), eq(studentGifts.studentId, sRec.id)))

  revalidatePath('/dashboard/student/wallet')
  revalidatePath('/dashboard/parent/wallet')
  return { success: true, amount: gift.amount, newStatus }
}

export async function awardStudentGiftAction(studentId: string, title: string, reason: string, amount: number) {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized')
  }

  const studentRec = await db.query.student.findFirst({ where: eq(student.id, studentId) })
  if (!studentRec) throw new Error('Student not found')

  if (!amount || amount <= 0) {
    throw new Error('Valid gift reward amount is required.')
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const inserted = await db.insert(studentGifts).values({
    id: randomUUID(),
    schoolId: studentRec.schoolId,
    studentId: studentRec.id,
    title: title.trim(),
    reason: reason.trim(),
    amount: amount.toFixed(2),
    status: 'AVAILABLE',
    receivedAt: now,
    expiresAt,
    createdAt: now,
  }).returning()

  return { success: true, gift: inserted[0] }
}

export async function getStudentRegistrationStatusAction(studentIdInput?: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  let studentRec
  if (studentIdInput) {
    studentRec = await db.query.student.findFirst({ where: eq(student.id, studentIdInput) })
  } else {
    studentRec = await db.query.student.findFirst({ where: eq(student.userId, session.user.id) })
  }

  if (!studentRec) return { success: false, error: 'Student record not found.' }
  await assertStudentPaymentAccess(session.user, studentRec)

  const now = new Date()
  const paidAt = studentRec.lastRegistrationFeePaidAt
    ? new Date(studentRec.lastRegistrationFeePaidAt)
    : new Date(studentRec.createdAt)

  const dueAt = studentRec.registrationDueDate
    ? new Date(studentRec.registrationDueDate)
    : new Date(paidAt.getTime() + 120 * 24 * 60 * 60 * 1000) // 4 months (120 days)

  const diffMs = dueAt.getTime() - now.getTime()
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  const isWaived = studentRec.registrationStatus === 'WAIVED'
  const isLockedOut = !isWaived && daysRemaining <= 0

  return {
    success: true,
    student: studentRec,
    paidAt: paidAt.toISOString(),
    dueAt: dueAt.toISOString(),
    daysRemaining,
    isLockedOut,
    isWaived,
  }
}

export async function renewStudentRegistrationFeeAction(studentId: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const child = await db.query.student.findFirst({ where: eq(student.id, studentId) })
  if (!child) throw new Error('Student record not found.')
  await assertStudentPaymentAccess(session.user, child)

  const totalAmount = REGISTRATION_FEE + PAYSTACK_GATEWAY_FEE
  const paymentReference = `STU-RNW-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`

  const paymentRes = await serviceInitializePaystackPayment({
    schoolId: child.schoolId || undefined,
    studentId: child.id,
    parentId: child.parentId || undefined,
    amount: totalAmount,
    feeType: 'STUDENT_4MONTH_REGISTRATION',
    description: `4-Month Registration Renewal for ${child.firstName} ${child.lastName}`,
    customerEmail: session.user.email || `student_${child.id}@ellearners.app`,
    customerName: `${child.firstName} ${child.lastName}`,
    redirectUrl: `${(process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')}/dashboard/student/overview?registration_renewed=true`,
    metadata: {
      studentId: child.id,
      paymentType: 'STUDENT_4MONTH_REGISTRATION',
    },
  })

  return {
    success: true,
    checkoutUrl: paymentRes.checkoutUrl,
    reference: paymentRes.reference || paymentReference,
  }
}
