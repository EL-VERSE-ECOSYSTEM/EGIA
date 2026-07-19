'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { payment, paymentInstallment, student } from '@/lib/db/schema'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { eq, desc, and, or } from 'drizzle-orm'

export async function submitManualPayment(data: {
  studentId: string
  amount: string
  feeType: string
  receiptUrl: string // Mock URL for now
}) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const result = await db.insert(payment).values({
    id: randomUUID(),
    studentId: data.studentId,
    parentId: session.user.id,
    amount: data.amount,
    feeType: data.feeType,
    paymentMethod: 'TRANSFER',
    transactionReference: `MAN-${Date.now()}`,
    receiptUrl: data.receiptUrl,
    status: 'pending',
    description: `Manual transfer receipt uploaded. Waiting for verification.`,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning()

  revalidatePath('/dashboard/parent/payments/history')
  revalidatePath('/dashboard/admin/finance/fees/pending')
  return result[0]
}

export async function initializeKorapayPayment(data: {
  studentId: string
  amount: number
  feeType: string
  description?: string
}) {
  const session = await auth.getSession()
  const parentId = session?.user?.id || null

  const reference = `KOR-${Date.now()}-${Math.random().toString(36).substring(7)}`

  // 1. Create a pending payment record
  const newPayment = await db.insert(payment).values({
    id: randomUUID(),
    studentId: data.studentId,
    parentId: parentId,
    amount: data.amount.toString(),
    feeType: data.feeType,
    paymentMethod: 'CARD',
    transactionReference: reference,
    status: 'pending',
    description: data.description || `Payment for ${data.feeType}`,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning()

  // 2. Direct checkout link provided by the merchant
  return {
    checkoutUrl: 'https://checkout.korapay.com/pay/BHba4zdsceZDgyW',
    reference: reference,
    paymentId: newPayment[0].id
  }
}

export async function getPaymentSummary(studentId: string) {
  const payments = await db.query.payment.findMany({
    where: eq(payment.studentId, studentId)
  })

  const totalPaid = payments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const pending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return { totalPaid, pending, paymentCount: payments.length }
}

export async function getParentPaymentHistory() {
  const session = await auth.getSession()
  if (!session?.user) return []

  const list = await db.select()
    .from(payment)
    .where(eq(payment.parentId, session.user.id))
    .orderBy(desc(payment.createdAt))

  const result = []
  for (const p of list) {
    const s = await db.query.student.findFirst({
      where: eq(student.id, p.studentId)
    })
    result.push({
      ...p,
      childName: s ? `${s.firstName} ${s.lastName}` : 'Enrolled Pupil'
    })
  }
  return result
}

export async function simulatePaymentSuccess(paymentId: string) {
  // Generate and save unique receipt code on transaction completion
  const receiptCode = `REC-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`

  const result = await db.update(payment)
    .set({
      status: 'success',
      paidAt: new Date(),
      receiptUrl: receiptCode,
      updatedAt: new Date()
    })
    .where(eq(payment.id, paymentId))
    .returning()

  revalidatePath('/dashboard/parent/payments/history')
  return result[0]
}

export async function authenticatePaymentByReference(reference: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  // Find the pending payment by transactionReference or ID
  const record = await db.query.payment.findFirst({
    where: and(
      eq(payment.parentId, session.user.id),
      or(
        eq(payment.transactionReference, reference),
        eq(payment.id, reference)
      )
    )
  })

  if (!record) {
    throw new Error('Payment record with this reference was not found on your account.')
  }

  if (record.status === 'success') {
    return record // Already authenticated
  }

  const receiptCode = `REC-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`

  const result = await db.update(payment)
    .set({
      status: 'success',
      paidAt: new Date(),
      receiptUrl: receiptCode,
      updatedAt: new Date()
    })
    .where(eq(payment.id, record.id))
    .returning()

  revalidatePath('/dashboard/parent/payments/history')
  return result[0]
}
