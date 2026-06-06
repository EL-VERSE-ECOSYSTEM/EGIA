'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { payment, userRole, feeStructure } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { checkPermission } from '@/lib/abac'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function getUserRoleData(userId: string) {
  return await db.query.userRole.findFirst({
    where: eq(userRole.userId, userId),
  })
}

export async function getFeeStructure(className: string) {
  return db.query.feeStructure.findMany({
    where: eq(feeStructure.class, className),
  })
}

export async function initializeKorapayPayment(data: {
  studentId: string
  feeType: string
  amount: number
}) {
  const userId = await getUserId()
  const roleData = await getUserRoleData(userId)

  const hasPermission = await checkPermission(
    userId,
    roleData?.role || '',
    'create',
    'payment',
    { studentId: data.studentId }
  )

  if (!hasPermission) throw new Error('Permission denied')

  const reference = `KORA-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  const newPayment = await db.insert(payment).values({
    id: crypto.randomUUID(),
    parentId: userId,
    studentId: data.studentId,
    amount: data.amount.toString(),
    feeType: data.feeType,
    status: 'pending',
    korapayReference: reference,
    paymentMethod: 'korapay',
    createdAt: new Date(),
  }).returning()

  const checkoutUrl = `https://checkout.korapay.com/pay/${reference}`

  return {
    payment: newPayment[0],
    checkoutUrl,
  }
}

export async function verifyKorapayPayment(reference: string) {
  const paymentRecord = await db.query.payment.findFirst({
    where: eq(payment.korapayReference, reference),
  })

  if (!paymentRecord) throw new Error('Payment record not found')

  if (paymentRecord.status === 'completed') return paymentRecord

  // In production, this would verify with Korapay API
  const updatedPayment = await db.update(payment)
    .set({
      status: 'completed',
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(payment.id, paymentRecord.id))
    .returning()

  revalidatePath('/dashboard/parent/payments')
  return updatedPayment[0]
}

export async function handleKorapayWebhook(payload: any) {
  const { event, data } = payload
  const reference = data.reference

  if (event === 'charge.success') {
    await db.update(payment)
      .set({
        status: 'completed',
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payment.korapayReference, reference))
  } else if (event === 'charge.failed') {
    await db.update(payment)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(payment.korapayReference, reference))
  }

  return { received: true }
}

export async function getPaymentHistory() {
  const userId = await getUserId()
  const roleData = await getUserRoleData(userId)

  const hasPermission = await checkPermission(
    userId,
    roleData?.role || '',
    'read',
    'payment'
  )

  if (!hasPermission) throw new Error('Permission denied')

  return db.query.payment.findMany({
    where: eq(payment.parentId, userId),
    orderBy: (payment, { desc }) => [desc(payment.createdAt)],
  })
}
