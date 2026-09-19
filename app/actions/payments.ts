'use server'

import { db } from '@/lib/db'
import { payment, student, paymentReceiptUploads, transactionLedger, studentGifts, user as userTable, parent as parentTable, feeStructure } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

const KORAPAY_GATEWAY_FEE = 161.25
const REGISTRATION_FEE = 2000.00

function checkoutUrl(reference: string): string {
  const base = process.env.KORAPAY_CHECKOUT_LINK || 'https://checkout.korapay.com/pay/BHba4zdsceZDgyW'
  const url = new URL(base)
  url.searchParams.set('reference', reference)

  const siteUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) {
    url.searchParams.set('redirect_url', `${siteUrl.replace(/\/$/, '')}/payment/return?reference=${encodeURIComponent(reference)}`)
  }

  return url.toString()
}

export async function getKorapayGatewayFee() {
  return KORAPAY_GATEWAY_FEE
}

export async function verifyKorapayPayment(reference: string) {
  const secretKey = process.env.KORAPAY_SECRET_KEY
  if (!secretKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Korapay secret key is unconfigured in production environment.')
    }
    const rec = await db.query.payment.findFirst({ where: eq(payment.transactionReference, reference) })
    if (rec) {
      await db.update(payment)
        .set({ status: 'success', paidAt: new Date(), paymentDate: new Date(), updatedAt: new Date() })
        .where(eq(payment.id, rec.id))

      if (rec.feeType === 'registration') {
        await db.update(student)
          .set({ registrationStatus: 'ACTIVE', updatedAt: new Date() })
          .where(eq(student.id, rec.studentId))
      }
    }

    return {
      success: true,
      status: 'success',
      payment: rec || null,
      schoolCode: undefined as string | undefined,
      schoolName: undefined as string | undefined,
      data: {
        reference,
        status: 'success',
        amount: rec?.amount ? Number(rec.amount) : 2161.25,
      },
    }
  }

  const res = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })

  if (!res.ok) {
    const errText = await res.text()
    return { success: false, status: 'failed', payment: null, schoolCode: undefined, schoolName: undefined, error: `Verification request failed (${res.status}): ${errText}` }
  }

  const json = await res.json()
  if (!json.status || !json.data) {
    return { success: false, status: 'failed', payment: null, schoolCode: undefined, schoolName: undefined, error: json.message || 'Invalid verification response from Korapay' }
  }

  const data = json.data
  const status = (data.status || '').toLowerCase()

  const rec = await db.query.payment.findFirst({ where: eq(payment.transactionReference, reference) })

  if (rec && status === 'success') {
    if (data.amount !== undefined && Number(data.amount) < Number(rec.amount)) {
      return { success: false, status: 'failed', payment: rec, schoolCode: undefined, schoolName: undefined, error: 'Verified payment amount is less than required invoice total.' }
    }

    await db.update(payment)
      .set({
        status: 'success',
        korapayReference: data.korapay_reference || data.reference || null,
        paidAt: new Date(),
        paymentDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payment.id, rec.id))

    if (rec.feeType === 'registration') {
      await db.update(student)
        .set({ registrationStatus: 'ACTIVE', updatedAt: new Date() })
        .where(eq(student.id, rec.studentId))
    }
  } else if (rec && status === 'failed') {
    await db.update(payment)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(payment.id, rec.id))
  }

  revalidatePath('/dashboard/parent/payments/history')
  revalidatePath('/dashboard/student/payments/history')

  return {
    success: status === 'success',
    status: status === 'success' ? 'success' : 'failed',
    payment: rec || null,
    schoolCode: undefined as string | undefined,
    schoolName: undefined as string | undefined,
    data: {
      reference: data.reference,
      status: data.status,
      amount: data.amount,
      fee: data.fee,
      currency: data.currency,
      paidAt: data.paid_at,
    },
  }
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
  const reference = `EGIA-PAY-${Date.now()}-${randomUUID().slice(0, 8)}`

  const record = (await db.insert(payment).values({
    id: randomUUID(),
    schoolId: child.schoolId || null,
    studentId: child.id,
    amount: totalAmount.toFixed(2),
    feeType: data.feeType,
    paymentMethod: 'KORAPAY',
    transactionReference: reference,
    status: 'pending',
    description: data.description || `${data.feeType} fee payment for ${child.firstName} ${child.lastName}`,
  }).returning())[0]

  const secretKey = process.env.KORAPAY_SECRET_KEY
  const siteUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  let checkout = checkoutUrl(reference)

  if (secretKey) {
    try {
      const payload = {
        amount: totalAmount,
        currency: 'NGN',
        reference,
        narration: data.description || `${data.feeType} payment - ${child.firstName} ${child.lastName}`,
        notification_url: `${siteUrl.replace(/\/$/, '')}/api/webhooks/korapay`,
        redirect_url: `${siteUrl.replace(/\/$/, '')}/payment/return?reference=${encodeURIComponent(reference)}`,
        customer: {
          email: session.user.email || `student_${child.id}@ellearners.app`,
          name: `${child.firstName} ${child.lastName}`,
        },
        metadata: {
          studentId: child.id,
          type: data.feeType,
        },
      }
      const res = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const koraData = await res.json()
        if (koraData.status && koraData.data?.checkout_url) {
          checkout = koraData.data.checkout_url
        }
      }
    } catch (err) {
      console.warn('Failed to call Korapay initialize endpoint:', err)
    }
  }

  return { checkoutUrl: checkout, reference, paymentId: record.id, totalAmount }
}

export async function initializeStudentRegistrationPayment(studentId: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const child = await db.query.student.findFirst({ where: eq(student.id, studentId) })
  if (!child) throw new Error('Student registration record was not found.')

  const totalAmount = REGISTRATION_FEE + KORAPAY_GATEWAY_FEE
  const reference = `EGIA-REG-${Date.now()}-${randomUUID().slice(0, 8)}`

  const record = (await db.insert(payment).values({
    id: randomUUID(),
    schoolId: child.schoolId || null,
    studentId,
    amount: totalAmount.toFixed(2),
    feeType: 'registration',
    paymentMethod: 'KORAPAY',
    transactionReference: reference,
    status: 'pending',
    description: `Session registration for ${child.firstName} ${child.lastName} (NGN 2000 + NGN 161.25 gateway fee)`,
  }).returning())[0]

  await db.update(student).set({ registrationStatus: 'PENDING_PAYMENT', updatedAt: new Date() }).where(eq(student.id, studentId))

  const secretKey = process.env.KORAPAY_SECRET_KEY
  const siteUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  let checkout = checkoutUrl(reference)

  if (secretKey) {
    try {
      const payload = {
        amount: totalAmount,
        currency: 'NGN',
        reference,
        narration: `Student Registration Fee - ${child.firstName} ${child.lastName}`,
        notification_url: `${siteUrl.replace(/\/$/, '')}/api/webhooks/korapay`,
        redirect_url: `${siteUrl.replace(/\/$/, '')}/payment/return?reference=${encodeURIComponent(reference)}`,
        customer: {
          email: session.user.email || `student_${child.id}@ellearners.app`,
          name: `${child.firstName} ${child.lastName}`,
        },
        metadata: {
          studentId,
          type: 'STUDENT_REGISTRATION',
        },
      }
      const res = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const koraData = await res.json()
        if (koraData.status && koraData.data?.checkout_url) {
          checkout = koraData.data.checkout_url
        }
      }
    } catch (err) {
      console.warn('Failed to call Korapay initialize endpoint:', err)
    }
  }

  return { checkoutUrl: checkout, reference, paymentId: record.id, totalAmount }
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
      await tx.update(payment).set({
        status: 'success',
        reconciliationStatus: 'RECONCILED',
        reconciledBy: session.user.id,
        reconciledAt: now,
        paidAt: now,
        updatedAt: now,
      }).where(eq(payment.id, upload.paymentId))

      const pRec = await tx.query.payment.findFirst({ where: eq(payment.id, upload.paymentId) })
      if (pRec?.feeType === 'registration') {
        await tx.update(student).set({ registrationStatus: 'ACTIVE', updatedAt: now }).where(eq(student.id, pRec.studentId))
      }
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
