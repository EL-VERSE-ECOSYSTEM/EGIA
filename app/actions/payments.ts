'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { payment } from '@/lib/db/schema'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

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
  if (!session?.user) throw new Error('Unauthorized')

  const reference = `KOR-${Date.now()}-${Math.random().toString(36).substring(7)}`

  // 1. Create a pending payment record
  const newPayment = await db.insert(payment).values({
    id: randomUUID(),
    studentId: data.studentId,
    parentId: session.user.id,
    amount: data.amount.toString(),
    feeType: data.feeType,
    paymentMethod: 'CARD',
    transactionReference: reference,
    status: 'pending',
    description: data.description || `Payment for ${data.feeType}`,
    createdAt: new Date(),
    updatedAt: new Date()
  }).returning()

  // 2. In a real environment, you would call Korapay API here:
  // const response = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}` },
  //   body: JSON.stringify({ amount: data.amount, reference, ... })
  // })
  // const result = await response.json()

  // Simulation: Return a checkout URL
  return {
    checkoutUrl: `https://checkout.korapay.com/pay/${reference}`,
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
