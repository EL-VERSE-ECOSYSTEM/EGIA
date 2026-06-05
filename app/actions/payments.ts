'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { payment, userRole } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function isParent() {
  const userId = await getUserId()
  const role = await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  })
  if (role?.role !== 'parent') throw new Error('Parent access required')
  return true
}

// Fee structure
export const FEE_STRUCTURE = {
  tuition: 150000,
  development: 50000,
  exam: 30000,
  sports: 20000,
  pta: 25000,
} as const

export type FeeType = keyof typeof FEE_STRUCTURE

export async function initiatePayment(data: {
  studentId: string
  feeType: FeeType
  amount: number
  reference: string
}) {
  await isParent()
  const userId = await getUserId()

  const newPayment = await db.insert(payment).values({
    id: crypto.randomUUID(),
    parentId: userId,
    studentId: data.studentId,
    amount: data.amount,
    feeType: data.feeType,
    status: 'pending',
    korapayReference: data.reference,
    createdAt: new Date(),
  }).returning()

  return newPayment[0]
}

export async function confirmPayment(reference: string, status: 'completed' | 'failed') {
  await isParent()

  const paymentRecord = await db.query.payment.findFirst({
    where: eq(payment.korapayReference, reference),
  })

  if (!paymentRecord) throw new Error('Payment not found')

  const result = await db.update(payment)
    .set({
      status: status === 'completed' ? 'completed' : 'failed',
      paidAt: status === 'completed' ? new Date() : undefined,
    })
    .where(eq(payment.id, paymentRecord.id))
    .returning()

  return result[0]
}

export async function getPaymentHistory(studentId?: string) {
  await isParent()
  const userId = await getUserId()

  if (studentId) {
    return db.query.payment.findMany({
      where: eq(payment.parentId, userId),
    })
  }

  return db.query.payment.findMany({
    where: eq(payment.parentId, userId),
  })
}

export async function getOutstandingBalance(studentId: string) {
  const payments = await db.query.payment.findMany({
    where: eq(payment.studentId, studentId),
  })

  const completed = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  const outstanding = Object.values(FEE_STRUCTURE).reduce((sum, fee) => sum + fee, 0) - completed

  return {
    totalFees: Object.values(FEE_STRUCTURE).reduce((sum, fee) => sum + fee, 0),
    paid: completed,
    outstanding: Math.max(0, outstanding),
  }
}

// Mock Korapay integration
export async function generateKorapayCheckoutLink(data: {
  reference: string
  amount: number
  customerEmail: string
  customerName: string
}) {
  // In production, this would call the actual Korapay API
  // For now, returning a mock checkout link
  const korapayUrl = new URL('https://checkout.korapay.com/pay')
  korapayUrl.searchParams.append('reference', data.reference)
  korapayUrl.searchParams.append('amount', (data.amount * 100).toString()) // Korapay uses smallest currency unit
  korapayUrl.searchParams.append('customer_email', data.customerEmail)
  korapayUrl.searchParams.append('customer_name', data.customerName)

  return korapayUrl.toString()
}
