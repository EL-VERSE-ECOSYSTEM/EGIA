'use server'

import { db } from '@/lib/db'
import { payment, student, paymentReceiptUploads, user as userTable, parent as parentTable, feeStructure, studentGifts } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import {
  initializeKorapayPayment as serviceInitializeKorapayPayment,
  verifyKorapayPayment as serviceVerifyKorapayPayment,
  reconcilePayment as serviceReconcilePayment,
} from '@/lib/payments/service'

const KORAPAY_GATEWAY_FEE = 161.25
const REGISTRATION_FEE = 2000.00

export async function getKorapayGatewayFee() {
  return KORAPAY_GATEWAY_FEE
}

export async function verifyKorapayPayment(reference: string) {
  const result = await serviceVerifyKorapayPayment({ reference })
  revalidatePath('/dashboard/parent/payments/history')
  revalidatePath('/dashboard/student/payments/history')
  return result
}

export async function submitManualPayment(data: { studentId: string; amount: string; feeType: string; receiptUrl: string }) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const currentStudent = await db.query.student.findFirst({ where: eq(student.id, data.studentId) })
  if (!currentStudent) throw new Error('Student record not found')

  const pRec = await db.query.parent.findFirst({ where: eq(parentTable.userId, session.user.id) })

  const paymentId = randomUUID()
  const uploadId = randomUUID()

  await db.transaction(async (tx) => {
    await tx.insert(payment).values({
      id: paymentId,
      schoolId: currentStudent.schoolId || null,
      studentId: currentStudent.id,
      parentId: pRec?.id || currentStudent.parentId || null,
      amount: data.amount,
      feeType: data.feeType,
      paymentMethod: 'BANK_TRANSFER',
      transactionReference: `MANUAL-${Date.now()}-${randomUUID().slice(0, 6)}`,
      status: 'pending',
      receiptUrl: data.receiptUrl,
      description: `Manual receipt upload for ${data.feeType}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await tx.insert(paymentReceiptUploads).values({
      id: uploadId,
      schoolId: currentStudent.schoolId || 'default-school',
      paymentId: paymentId,
      studentId: currentStudent.id,
      parentId: pRec?.id || null,
      uploadedBy: session.user.id,
      uploadedByRole: session.user.role || 'PARENT',
      fileUrl: data.receiptUrl,
      filePath: data.receiptUrl,
      fileType: 'image/jpeg',
      amountClaimed: data.amount,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  })

  revalidatePath('/dashboard/parent/payments/history')
  return { success: true, paymentId, uploadId }
}

export async function initializeKorapayPayment(data: { studentId: string; amount: number; feeType: string; description?: string }) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const child = await db.query.student.findFirst({ where: eq(student.id, data.studentId) })
  if (!child) throw new Error('Student record was not found.')

  const totalAmount = Number((data.amount + KORAPAY_GATEWAY_FEE).toFixed(2))

  const paymentRes = await serviceInitializeKorapayPayment({
    schoolId: child.schoolId || null,
    studentId: child.id,
    parentId: child.parentId || null,
    amount: totalAmount,
    feeType: data.feeType,
    description: data.description || `${data.feeType} fee payment for ${child.firstName} ${child.lastName}`,
    customerEmail: session.user.email || `student_${child.id}@ellearners.app`,
    customerName: `${child.firstName} ${child.lastName}`,
    metadata: {
      studentId: child.id,
      type: data.feeType,
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
  if (!session?.user) throw new Error('Unauthorized')

  const child = await db.query.student.findFirst({ where: eq(student.id, studentId) })
  if (!child) throw new Error('Student registration record was not found.')

  const totalAmount = REGISTRATION_FEE + KORAPAY_GATEWAY_FEE

  const paymentRes = await serviceInitializeKorapayPayment({
    schoolId: child.schoolId || null,
    studentId: child.id,
    parentId: child.parentId || null,
    amount: totalAmount,
    feeType: 'registration',
    description: `Session registration for ${child.firstName} ${child.lastName} (NGN 2000 + NGN 161.25 gateway fee)`,
    customerEmail: session.user.email || `student_${child.id}@ellearners.app`,
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

  const payments = await db.query.payment.findMany({
    where: eq(payment.studentId, studentId),
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

  return db.query.payment.findMany({
    where: eq(payment.studentId, targetStudentId),
    orderBy: [desc(payment.createdAt)]
  })
}

export async function getParentPaymentHistory() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const pRec = await db.query.parent.findFirst({ where: eq(parentTable.userId, session.user.id) })
  if (!pRec) return []

  return db.query.payment.findMany({
    where: eq(payment.parentId, pRec.id),
    with: { student: true },
    orderBy: [desc(payment.createdAt)]
  })
}

export async function getStudentIdByAdmissionNumber(admissionNumber: string) {
  const child = await db.query.student.findFirst({ where: eq(student.admissionNumber, admissionNumber.trim().toUpperCase()) })
  return child?.id || null
}

export async function getFeeStructuresForClass(className: string, department?: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const uRec = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id) })
  if (!uRec?.schoolId) return []

  const list = await db.query.feeStructure.findMany({
    where: eq(feeStructure.schoolId, uRec.schoolId)
  })

  return list.filter(f => f.class.toLowerCase() === className.toLowerCase())
}

export async function approveReceipt(uploadId: string) {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized')
  }

  const upload = await db.query.paymentReceiptUploads.findFirst({ where: eq(paymentReceiptUploads.id, uploadId) })
  if (!upload) throw new Error('Receipt upload record not found')

  const now = new Date()

  await db.transaction(async (tx) => {
    await tx.update(paymentReceiptUploads).set({
      status: 'APPROVED',
      reviewedBy: session.user.id,
      reviewedAt: now,
      updatedAt: now,
    }).where(eq(paymentReceiptUploads.id, uploadId))

    if (upload.paymentId) {
      await serviceReconcilePayment(upload.paymentId, session.user.id)
    }
  })

  revalidatePath('/dashboard/admin/payments/pending-receipts')
  return { success: true }
}

export async function rejectReceipt(uploadId: string, reason: string) {
  const session = await auth.getSession()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized')
  }

  const now = new Date()
  await db.update(paymentReceiptUploads).set({
    status: 'REJECTED',
    rejectionReason: reason,
    reviewedBy: session.user.id,
    reviewedAt: now,
    updatedAt: now,
  }).where(eq(paymentReceiptUploads.id, uploadId))

  revalidatePath('/dashboard/admin/payments/pending-receipts')
  return { success: true }
}

export async function getReceiptDownloadUrl(uploadId: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const upload = await db.query.paymentReceiptUploads.findFirst({
    where: eq(paymentReceiptUploads.id, uploadId)
  })
  if (!upload?.generatedReceiptPath) return null

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

  const schoolPayments = await db.query.payment.findMany({
    where: and(eq(payment.schoolId, schoolId), eq(payment.status, 'success')),
    orderBy: [desc(payment.createdAt)],
  })

  const totalRevenue = schoolPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const categoryBreakdown: Record<string, number> = {}
  for (const p of schoolPayments) {
    const cat = p.feeType || 'tuition'
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + Number(p.amount || 0)
  }

  return {
    totalRevenue,
    transactionCount: schoolPayments.length,
    categoryBreakdown,
    recentTransactions: schoolPayments.slice(0, 15)
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
