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
import { paymentInstallment } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getStudentPayments(studentId: string) {
  return db.query.payment.findMany({
    where: eq(payment.studentId, studentId),
    with: {
      termId: true // If term is linked
    },
    orderBy: (payment, { desc }) => [desc(payment.createdAt)]
  })
}

export async function getInstallmentsForPayment(paymentId: string) {
  return db.query.paymentInstallment.findMany({
    where: eq(paymentInstallment.paymentId, paymentId),
    orderBy: (paymentInstallment, { asc }) => [asc(paymentInstallment.installmentNumber)]
  })
}

export async function payInstallment(installmentId: string) {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const result = await db.update(paymentInstallment)
    .set({
      status: 'paid',
      paidAt: new Date()
    })
    .where(eq(paymentInstallment.id, installmentId))
    .returning()

  revalidatePath('/dashboard/parent/payments')
  return result[0]
}
