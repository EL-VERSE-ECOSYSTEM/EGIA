'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { payment, paymentInstallment, student } from '@/lib/db/schema'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { eq, desc } from 'drizzle-orm'

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

  // 2. Call Korapay live charge initialization API
  try {
    const payload = {
      amount: data.amount,
      reference,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://el-goodnews.vercel.app'}/api/korapay/webhook`,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://el-goodnews.vercel.app'}/dashboard/parent/payments/history`,
      currency: 'NGN',
      customer: {
        email: session.user.email || 'parent@elgoodnews.com',
        name: session.user.name || 'Parent User'
      },
      description: data.description || `School Fees Payment for ${data.feeType}`
    }

    const response = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KORAPAY_SECRET_KEY || ''}`
      },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      const result = await response.json()
      if (result.status === 'success' && result.data?.checkout_url) {
        return {
          checkoutUrl: result.data.checkout_url,
          reference: reference,
          paymentId: newPayment[0].id
        }
      }
    }
    console.warn('Korapay live checkout API returned unsuccessful status, utilizing simulated checkout.')
  } catch (err) {
    console.error('Error contacting Korapay Merchant API:', err)
  }

  // Simulation: Return a mock checkout URL as fallback for test/offline environments
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
  const result = await db.update(payment)
    .set({
      status: 'success',
      paidAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(payment.id, paymentId))
    .returning()

  revalidatePath('/dashboard/parent/payments/history')
  return result[0]
}
