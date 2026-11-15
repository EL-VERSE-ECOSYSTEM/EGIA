import { and, eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { notification, payment, parent } from '@/lib/db/schema'
import { sendPushNotification } from '@/lib/services/notifications'

export type PaymentNotificationStatus = 'pending' | 'processing' | 'success' | 'failed'

export function getPaymentStatusNotificationCopy(
  status: PaymentNotificationStatus,
  amount: number,
  studentName: string,
  feeType: string | null,
) {
  const formattedAmount = `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
  const feeLabel = feeType ? ` for ${feeType}` : ''
  const messages = {
    pending: {
      title: 'Payment awaiting confirmation',
      type: 'payment_pending',
      message: `${formattedAmount}${feeLabel} for ${studentName} is awaiting school confirmation.`,
    },
    processing: {
      title: 'Payment processing',
      type: 'payment_processing',
      message: `${formattedAmount}${feeLabel} for ${studentName} is being processed securely.`,
    },
    success: {
      title: 'Payment confirmed',
      type: 'payment_confirmation',
      message: `${formattedAmount}${feeLabel} for ${studentName} was recorded successfully.`,
    },
    failed: {
      title: 'Payment not confirmed',
      type: 'payment_failed',
      message: `${formattedAmount}${feeLabel} for ${studentName} was not confirmed. Contact your school if you need help.`,
    },
  } satisfies Record<PaymentNotificationStatus, { title: string; type: string; message: string }>
  return messages[status]
}

export async function notifyPaymentStatus(paymentId: string, status: PaymentNotificationStatus) {
  let record
  try {
    record = await db.query.payment.findFirst({
      where: eq(payment.id, paymentId),
      with: { student: true },
    })
  } catch (error) {
    console.error('Unable to load payment for status notification', {
      paymentId,
      status,
      error: error instanceof Error ? error.message : String(error),
    })
    return
  }
  if (!record || !record.schoolId || record.student.schoolId !== record.schoolId) return

  let linkedParent: typeof parent.$inferSelect | null = null
  if (record.parentId) {
    try {
      linkedParent = await db.query.parent.findFirst({
        where: and(eq(parent.id, record.parentId), eq(parent.schoolId, record.schoolId)),
      }) || null
    } catch (error) {
      console.error('Unable to load linked parent for payment status notification', {
        paymentId,
        status,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
  const recipients = new Map<string, string>()
  if (record.student.userId) recipients.set(record.student.userId, '/dashboard/student/payments/history')
  if (
    linkedParent &&
    linkedParent.schoolId === record.schoolId &&
    record.student.parentId === linkedParent.id &&
    linkedParent.userId
  ) {
    recipients.set(linkedParent.userId, '/dashboard/parent/payments/history')
  }
  if (!recipients.size) return

  const studentName = `${record.student.firstName} ${record.student.lastName}`.trim()
  const amount = Number(record.amount)
  const reference = record.transactionReference || record.id
  const { title, type, message: body } = getPaymentStatusNotificationCopy(
    status,
    amount,
    studentName,
    record.feeType,
  )
  const data = { paymentId: record.id, studentId: record.studentId, amount, reference, status }

  try {
    await db.insert(notification).values([...recipients.keys()].map((userId) => ({
      id: randomUUID(),
      userId,
      schoolId: record.schoolId,
      title,
      message: body,
      type,
      metadata: data,
      actionUrl: recipients.get(userId) || '/dashboard',
      createdAt: new Date(),
    })))
  } catch (error) {
    console.error('Unable to persist payment status notifications', {
      paymentId,
      status,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  await Promise.all([...recipients].map(async ([userId, link]) => {
    try {
      await sendPushNotification({
        userId,
        eventKey: `payment-${status}:${record.id}`,
        type,
        title,
        body,
        data,
        link,
      })
    } catch (error) {
      console.error('Unable to deliver payment status push notification', {
        paymentId,
        status,
        userId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }))
}

export async function notifyPaymentConfirmed(paymentId: string) {
  return notifyPaymentStatus(paymentId, 'success')
}
