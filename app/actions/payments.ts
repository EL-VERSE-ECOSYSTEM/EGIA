'use server'

import { db } from '@/lib/db'
import { payment, student, paymentReceiptUploads, user as userTable, parent as parentTable, feeStructure, studentGifts } from '@/lib/db/schema'
import { eq, and, desc, sql, notInArray } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseSecretKey, getSupabaseUrl } from '@/utils/supabase/config'
import { canSchoolAdminAccess } from '@/lib/auth/school-admin-permissions'
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

  await db.transaction(async (tx) => {
    await tx.insert(payment).values({
      id: paymentId,
      schoolId,
      studentId: currentStudent.id,
      parentId: pRec.id,
      amount: claimedAmount.toFixed(2),
      feeType: data.feeType,
      paymentMethod: 'BANK_TRANSFER',
      transactionReference: `MANUAL-${Date.now()}-${randomUUID().slice(0, 6)}`,
      status: 'pending',
      receiptUrl: receiptUrl.toString(),
      description: `Manual receipt upload for ${data.feeType}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

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

  revalidatePath('/dashboard/parent/payments/history')
  return { success: true, paymentId, uploadId }
}

export async function initializeKorapayPayment(data: { studentId: string; amount: number; feeType: string; description?: string }) {
  return initializePaystackPayment(data)
}

export async function verifyKorapayPayment(reference: string) {
  return verifyPaystackPayment(reference)
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
  if (!approvedFee || Number(approvedFee.amount) !== Number(data.amount)) {
    throw new Error('The selected fee or amount is not approved by this school.')
  }

  const baseAmount = Number(approvedFee.amount)
  const totalAmount = Number((baseAmount + PAYSTACK_GATEWAY_FEE).toFixed(2))

  const paymentConfirmationMessage = `Payment of ₦${baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} for ${approvedFee.feeType.toUpperCase()} (${child.firstName} ${child.lastName}, Class: ${child.class}) + Paystack Gateway Fee (₦161.25)`

  const paymentRes = await serviceInitializePaystackPayment({
    schoolId: child.schoolId || undefined,
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
    description: `Session registration for ${child.firstName} ${child.lastName} (NGN 2000 + NGN 161.25 gateway fee)`,
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

  return db.query.payment.findMany({
    where: eq(payment.studentId, studentRecord.id),
    orderBy: [desc(payment.createdAt)]
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
  } else if (['STUDENT', 'PUPIL'].includes(role)) {
    const child = await db.query.student.findFirst({ where: eq(student.userId, session.user.id) })
    if (!child || child.id !== studentId) throw new Error('Student payment scope does not match your account.')
    schoolId = child.schoolId
  }
  if (!schoolId) return []

  const list = await db.query.feeStructure.findMany({
    where: and(eq(feeStructure.schoolId, schoolId), eq(feeStructure.isActive, true))
  })

  return list.filter(f =>
    f.class.toLowerCase() === className.toLowerCase() &&
    (!department || !f.department || f.department.toLowerCase() === department.toLowerCase())
  )
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

  await db.transaction(async (tx) => {
    const paymentRecord = await tx.query.payment.findFirst({
      where: and(eq(payment.id, upload.paymentId!), eq(payment.schoolId, upload.schoolId)),
    })
    if (!paymentRecord || paymentRecord.status !== 'pending' || ['PAYSTACK', 'KORAPAY'].includes(paymentRecord.paymentMethod.toUpperCase())) {
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
      notInArray(payment.paymentMethod, ['PAYSTACK', 'KORAPAY']),
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
  const upload = await db.query.paymentReceiptUploads.findFirst({ where: eq(paymentReceiptUploads.id, uploadId) })
  if (!upload) throw new Error('Receipt upload record not found')
  assertReceiptSchoolAccess(session.user, upload.schoolId)

  await db.update(paymentReceiptUploads).set({
    status: 'REJECTED',
    rejectionReason: reason,
    reviewedBy: session.user.id,
    reviewedAt: now,
    updatedAt: now,
  }).where(and(eq(paymentReceiptUploads.id, uploadId), eq(paymentReceiptUploads.schoolId, upload.schoolId)))

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
