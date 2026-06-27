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
