'use server'

import { db } from '@/lib/db'
import { payment, feeStructure, student } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

interface ManualPaymentParams {
  amount: number
  studentId: string
  feeType: string
  bankName: string
  receiptImage: string
  description?: string
}

export async function submitManualPayment({
  amount,
  studentId,
  feeType,
  bankName,
  receiptImage,
  description
}: ManualPaymentParams) {
  const reference = `ELG-MAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  // Check for late fee penalty (mock logic)
  let finalAmount = amount
  const feeInfo = await db.query.feeStructure.findFirst({
      where: and(eq(feeStructure.feeType, feeType))
  })

  if (feeInfo?.dueDate && new Date() > new Date(feeInfo.dueDate)) {
      // 5% penalty
      // finalAmount = amount * 1.05
  }

  const newPayment = await db.insert(payment).values({
    id: crypto.randomUUID(),
    studentId,
    amount: finalAmount.toString(),
    feeType,
    paymentMethod: 'bank_transfer',
    bankName,
    receiptImage,
    transactionReference: reference,
    status: 'pending',
    description: description || `Manual transfer for ${feeType} to ${bankName}`,
    paymentDate: new Date(),
  }).returning()

  revalidatePath('/dashboard/parent/payments/history')
  return newPayment[0]
}

export async function verifyManualPayment(paymentId: string, status: 'success' | 'failed') {
  await db.update(payment)
    .set({
      status,
      paidAt: status === 'success' ? new Date() : null,
      updatedAt: new Date()
    })
    .where(eq(payment.id, paymentId))

  revalidatePath('/dashboard/admin/finance/fees/payments')
  revalidatePath('/dashboard/parent/payments/history')
}

export async function getFeeStructure(className: string) {
    return await db.query.feeStructure.findMany({
        where: eq(feeStructure.class, className)
    })
}
