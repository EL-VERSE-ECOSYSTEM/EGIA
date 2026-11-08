import { db } from '@/lib/db'
import { payment, schoolRegistrationApplication, student, school, transactions, paymentWebhookLogs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import {
  paystackAmountMatches,
  validatePaystackWebhook,
  validPaystackSignature,
  type PaystackWebhookBody
} from './paystack-security'
import { checkOrAcquireIdempotency, completeIdempotencyKey, failIdempotencyKey } from '@/lib/idempotency'

export { validPaystackSignature, validatePaystackWebhook, paystackAmountMatches }
export { validPaystackSignature as validKorapaySignature } from './paystack-security'

export interface InitializePaymentParams {
  amount: number // In Naira
  customerEmail: string
  customerName?: string
  currency?: string
  reference?: string
  studentId?: string
  feeType?: string
  description?: string
  schoolId?: string | null
  parentId?: string | null
  callbackUrl?: string
  redirectUrl?: string
  metadata?: Record<string, any>
}

export interface PaymentVerificationParams {
  reference: string
  expectedAmount?: number
  expectedCurrency?: string
}

export type WebhookProcessResult =
  | { success: true; event?: string; reference?: string; note?: string }
  | { success: false; error: string }

export async function createStudentPaymentRecord(params: {
  studentId: string
  amount: number
  feeType: string
  description?: string
  schoolId?: string
  reference?: string
}) {
  const reference = params.reference || `pay_${randomUUID()}`
  const now = new Date()

  const [record] = await db.insert(payment).values({
    id: randomUUID(),
    studentId: params.studentId,
    amount: params.amount.toString(),
    feeType: params.feeType,
    description: params.description || `Payment for ${params.feeType}`,
    paymentMethod: 'PAYSTACK',
    status: 'pending',
    transactionReference: reference,
    paymentDate: now,
    schoolId: params.schoolId,
    createdAt: now,
    updatedAt: now,
  }).returning()

  return record
}

/**
 * Initializes a transaction with Paystack Checkout API.
 * Amount is converted from Naira to Kobo (multiply by 100).
 */
export async function initializePaystackPayment(params: InitializePaymentParams) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) {
    throw new Error('Paystack payment service is unavailable because its secret key is not configured.')
  }

  const reference = params.reference || `pstk_${Date.now()}_${randomUUID().slice(0, 8)}`
  const currency = params.currency || 'NGN'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_SITE_URL || 'http://localhost:3000'
  const callbackUrl = params.callbackUrl || `${siteUrl.replace(/\/$/, '')}/payment/return`

  // Create pending payment record in DB if studentId is provided
  let paymentRecord: any = null
  if (params.studentId && params.feeType) {
    paymentRecord = await createStudentPaymentRecord({
      studentId: params.studentId,
      amount: params.amount,
      feeType: params.feeType,
      description: params.description,
      schoolId: params.schoolId || undefined,
      reference,
    })
  }

  let checkoutUrl = ''
  try {
    const koboAmount = Math.round(params.amount * 100)

    const payload = {
      email: params.customerEmail,
      amount: koboAmount,
      reference,
      currency,
      callback_url: params.redirectUrl || callbackUrl,
      metadata: {
        customer_name: params.customerName || 'Customer',
        student_id: params.studentId,
        fee_type: params.feeType,
        school_id: params.schoolId,
        ...(params.metadata || {}),
        custom_fields: [
          {
            display_name: 'Customer Name',
            variable_name: 'customer_name',
            value: params.customerName || 'Customer',
          },
          ...(params.feeType ? [{
            display_name: 'Fee Type',
            variable_name: 'fee_type',
            value: params.feeType,
          }] : []),
        ]
      }
    }

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const paystackData = await res.json()

    if (!res.ok || !paystackData.status || !paystackData.data?.authorization_url) {
      console.error('Paystack transaction initialize error:', paystackData)
      throw new Error(paystackData.message || 'Paystack did not return a valid checkout URL.')
    }

    checkoutUrl = paystackData.data.authorization_url
  } catch (error) {
    if (paymentRecord) {
      await db.update(payment)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(payment.id, paymentRecord.id))
    }
    throw error
  }

  return {
    checkoutUrl,
    authorizationUrl: checkoutUrl,
    reference,
    paymentId: paymentRecord?.id || null,
    amount: params.amount,
    currency,
  }
}

// Backward-compatible alias for existing callers
export const initializeKorapayPayment = initializePaystackPayment

/**
 * Verifies transaction directly with Paystack API.
 * Idempotently updates payment, school, application, and transaction tables.
 */
export async function verifyPaystackPayment(params: PaymentVerificationParams) {
  const { reference, expectedAmount, expectedCurrency = 'NGN' } = params
  const secretKey = process.env.PAYSTACK_SECRET_KEY

  const paymentRec = await db.query.payment.findFirst({
    where: eq(payment.transactionReference, reference)
  })

  const appRec = await db.query.schoolRegistrationApplication.findFirst({
    where: eq(schoolRegistrationApplication.paymentReference, reference)
  })

  let schoolRec = await db.query.school.findFirst({
    where: eq(school.paymentReference, reference)
  })

  if (!schoolRec && appRec?.schoolId) {
    schoolRec = (await db.query.school.findFirst({
      where: eq(school.id, appRec.schoolId)
    })) || undefined
  }

  const schoolCode = schoolRec?.code || undefined
  const schoolName = schoolRec?.name || appRec?.schoolName || undefined

  if (!secretKey) {
    return { success: false, status: 'failed', schoolCode, schoolName, error: 'Paystack secret key is not configured.' }
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })

  if (!res.ok) {
    const errText = await res.text()
    return { success: false, status: 'failed', schoolCode, schoolName, error: `Verification request failed (${res.status}): ${errText}` }
  }

  const json = await res.json()
  if (!json.status || !json.data) {
    return { success: false, status: 'failed', schoolCode, schoolName, error: json.message || 'Invalid verification response from Paystack' }
  }

  const data = json.data
  const status = (data.status || '').toLowerCase()
  const amountInNaira = typeof data.amount === 'number' ? data.amount / 100 : Number(data.amount) / 100

  if (status === 'success') {
    const requiredAmount = expectedAmount ?? (paymentRec ? Number(paymentRec.amount) : schoolRec ? 30161.25 : undefined)
    if (requiredAmount !== undefined && !paystackAmountMatches(data.amount, requiredAmount)) {
      return { success: false, status: 'failed', schoolCode, schoolName, error: 'Verified payment amount does not match the required total.' }
    }
    if (data.reference !== reference) {
      return { success: false, status: 'failed', schoolCode, schoolName, error: 'Verified payment reference does not match.' }
    }
    if (data.currency && data.currency.toUpperCase() !== expectedCurrency.toUpperCase()) {
      return { success: false, status: 'failed', schoolCode, schoolName, error: 'Verified payment currency does not match.' }
    }

    if (paymentRec) {
      await markPaymentSuccessful(paymentRec.id, data.id?.toString() || data.reference)
    }
    if (schoolRec) {
      await db.update(school).set({ paymentStatus: 'PAID', updatedAt: new Date() }).where(eq(school.id, schoolRec.id))
      await db.update(schoolRegistrationApplication).set({ paymentStatus: 'SUCCESS', updatedAt: new Date() }).where(eq(schoolRegistrationApplication.schoolId, schoolRec.id))
    }
  } else if (status === 'failed') {
    if (paymentRec) {
      await markPaymentFailed(paymentRec.id)
    }
    if (schoolRec) {
      await db.update(school).set({ paymentStatus: 'FAILED', updatedAt: new Date() }).where(eq(school.id, schoolRec.id))
      await db.update(schoolRegistrationApplication).set({ paymentStatus: 'FAILED', updatedAt: new Date() }).where(eq(schoolRegistrationApplication.schoolId, schoolRec.id))
    }
  }

  return {
    success: status === 'success',
    status,
    payment: paymentRec || null,
    school: schoolRec || null,
    schoolCode,
    schoolName,
    data: {
      reference: data.reference,
      status: data.status,
      amount: amountInNaira,
      currency: data.currency,
      paidAt: data.paid_at,
    }
  }
}

// Backward-compatible alias
export const verifyKorapayPayment = verifyPaystackPayment

/**
 * Idempotently processes real-time Paystack webhooks (e.g. charge.success).
 */
export async function processPaystackWebhook(rawBody: string, signature: string | null): Promise<WebhookProcessResult> {
  const validation = validatePaystackWebhook(rawBody, signature)
  if (!validation.success) return validation
  if (!validation.body || !validation.event || !validation.reference) {
    return { success: true, note: validation.note }
  }

  const { body, event, reference } = validation
  const idempotencyKey = `paystack_webhook_${reference}_${event}`

  // 1. Check idempotency lock to prevent concurrent double-processing
  const lock = await checkOrAcquireIdempotency(idempotencyKey, 'paystack_webhook', { event, reference })
  if (lock.isDuplicate) {
    return { success: true, reference, note: 'Event already processed' }
  }

  try {
    const existingLog = await db.query.paymentWebhookLogs.findFirst({
      where: and(
        eq(paymentWebhookLogs.reference, reference),
        eq(paymentWebhookLogs.eventType, event)
      )
    })

    if (existingLog) {
      await completeIdempotencyKey(idempotencyKey, { success: true, note: 'Event already processed' })
      return { success: true, reference, note: 'Event already processed' }
    }

    await db.insert(paymentWebhookLogs).values({
      id: randomUUID(),
      reference,
      eventType: event,
      payload: body as any,
      status: 'PROCESSED',
      createdAt: new Date(),
    })

    const isSuccess = event === 'charge.success' || body.data?.status === 'success'
    const isFailed = event === 'charge.failed' || body.data?.status === 'failed'
    const amountKobo = body.data?.amount

    // 1. School Registration Payment Check
    const appRecord = await db.query.schoolRegistrationApplication.findFirst({ where: eq(schoolRegistrationApplication.paymentReference, reference) })
    const schRecord = await db.query.school.findFirst({ where: eq(school.paymentReference, reference) })

    if (appRecord || schRecord) {
      if (isSuccess) {
        if (appRecord) {
          await db.update(schoolRegistrationApplication)
            .set({ paymentStatus: 'SUCCESS', updatedAt: new Date() })
            .where(eq(schoolRegistrationApplication.id, appRecord.id))
        }
        if (schRecord) {
          await db.update(school).set({ paymentStatus: 'PAID', updatedAt: new Date() }).where(eq(school.id, schRecord.id))
        }
      } else if (isFailed) {
        if (appRecord) {
          await db.update(schoolRegistrationApplication)
            .set({ paymentStatus: 'FAILED', updatedAt: new Date() })
            .where(eq(schoolRegistrationApplication.id, appRecord.id))
        }
        if (schRecord) {
          await db.update(school).set({ paymentStatus: 'FAILED', updatedAt: new Date() }).where(eq(school.id, schRecord.id))
        }
      }
      await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
      return { success: true, event, reference, note: 'School application payment status updated' }
    }

    // 2. Transactions Table Check
    const trxRecord = await db.query.transactions.findFirst({ where: eq(transactions.reference, reference) })
    if (trxRecord) {
      if (isSuccess) {
        if (!paystackAmountMatches(amountKobo, Number(trxRecord.amount))) {
          await failIdempotencyKey(idempotencyKey)
          return { success: false, error: 'Payment amount mismatch' }
        }
        await db.update(transactions).set({ status: 'success', updatedAt: new Date() }).where(eq(transactions.id, trxRecord.id))
      } else if (isFailed) {
        await db.update(transactions).set({ status: 'failed', updatedAt: new Date() }).where(eq(transactions.id, trxRecord.id))
      }
      await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
      return { success: true, event, reference, note: 'Transaction status updated' }
    }

    // 3. Student Payment Table Check
    const paymentRecord = await db.query.payment.findFirst({ where: eq(payment.transactionReference, reference) })
    if (paymentRecord) {
      if (isSuccess) {
        if (!paystackAmountMatches(amountKobo, Number(paymentRecord.amount))) {
          await failIdempotencyKey(idempotencyKey)
          return { success: false, error: 'Payment amount mismatch' }
        }
        await markPaymentSuccessful(paymentRecord.id, body.data?.id?.toString() || reference)
      } else if (isFailed) {
        await markPaymentFailed(paymentRecord.id)
      }
      await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
      return { success: true, event, reference, note: 'Student payment status updated' }
    }

    await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
    return { success: true, event, reference, note: 'No matching transaction record found' }
  } catch (err: any) {
    await failIdempotencyKey(idempotencyKey)
    throw err
  }
}

// Backward-compatible alias
export const processKorapayWebhook = processPaystackWebhook

export async function markPaymentSuccessful(paymentId: string, paystackRef?: string) {
  const existingPayment = await db.query.payment.findFirst({
    where: eq(payment.id, paymentId)
  })

  if (!existingPayment) return null

  const isAlreadySuccess = existingPayment.status === 'success'
  const now = new Date()

  const updated = await db.update(payment)
    .set({
      status: 'success',
      korapayReference: paystackRef || existingPayment.korapayReference || undefined,
      paidAt: existingPayment.paidAt || now,
      paymentDate: existingPayment.paymentDate || now,
      updatedAt: now,
    })
    .where(eq(payment.id, paymentId))
    .returning()

  // Only extend student registration validity on the INITIAL transition to success
  if (
    !isAlreadySuccess &&
    updated.length > 0 &&
    (updated[0].feeType === 'registration' || updated[0].feeType === 'STUDENT_4MONTH_REGISTRATION')
  ) {
    const nextDue = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000)
    await db.update(student)
      .set({
        registrationStatus: 'ACTIVE',
        lastRegistrationFeePaidAt: now,
        registrationDueDate: nextDue,
        updatedAt: now,
      })
      .where(eq(student.id, updated[0].studentId))
  }

  return updated[0] || null
}

export async function markPaymentFailed(paymentId: string) {
  const now = new Date()
  const updated = await db.update(payment)
    .set({
      status: 'failed',
      updatedAt: now,
    })
    .where(eq(payment.id, paymentId))
    .returning()

  return updated[0] || null
}

export async function reconcilePayment(paymentId: string, adminUserId: string) {
  const now = new Date()
  const updated = await db.update(payment)
    .set({
      reconciliationStatus: 'RECONCILED',
      reconciledBy: adminUserId,
      reconciledAt: now,
      status: 'success',
      paidAt: now,
      updatedAt: now,
    })
    .where(eq(payment.id, paymentId))
    .returning()

  if (updated.length > 0 && updated[0].feeType === 'registration') {
    await db.update(student)
      .set({ registrationStatus: 'ACTIVE', updatedAt: now })
      .where(eq(student.id, updated[0].studentId))
  }

  return updated[0] || null
}
