import { db, sqlClient } from '@/lib/db'
import { payment, schoolRegistrationApplication, student, school, transactionLedger, transactions, paymentWebhookLogs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import {
  paystackAmountMatches,
  validatePaystackWebhook,
  validPaystackSignature
} from './paystack-security'
import { checkOrAcquireIdempotency, completeIdempotencyKey, failIdempotencyKey } from '@/lib/idempotency'
import { completeLearnAiPurchase } from '@/lib/learn-ai'

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

  if (!Number.isFinite(params.amount) || params.amount <= 0 || Math.round(params.amount * 100) <= 0) {
    throw new Error('Payment amount must be a positive amount in Naira.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.customerEmail)) {
    throw new Error('A valid payer email address is required.')
  }
  if (params.currency && params.currency.toUpperCase() !== 'NGN') {
    throw new Error('This payment flow only supports NGN.')
  }

  const reference = params.reference || `pstk-${randomUUID()}`
  const currency = params.currency || 'NGN'
  const configuredSiteUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.NODE_ENV === 'production' && !configuredSiteUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL must be configured for Paystack redirects in production.')
  }
  const siteUrl = configuredSiteUrl || 'http://localhost:3000'
  const callbackUrl = params.callbackUrl || `${siteUrl.replace(/\/$/, '')}/payment/return`
  const redirectUrl = params.redirectUrl || callbackUrl
  try {
    if (new URL(redirectUrl).origin !== new URL(siteUrl).origin) {
      throw new Error('Paystack callback URL must use the configured application origin.')
    }
  } catch {
    throw new Error('A valid same-origin Paystack callback URL is required.')
  }

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
      callback_url: redirectUrl,
      metadata: {
        ...(params.metadata || {}),
        customer_name: params.customerName || 'Customer',
        student_id: params.studentId,
        fee_type: params.feeType,
        school_id: params.schoolId,
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
      signal: AbortSignal.timeout(15000),
    })

    const paystackData = await res.json()

    if (!res.ok || !paystackData.status || !paystackData.data?.authorization_url) {
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
  if (typeof reference !== 'string' || reference.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(reference)) {
    return { success: false, status: 'failed', error: 'Invalid payment reference.' }
  }
  const secretKey = process.env.PAYSTACK_SECRET_KEY

  const paymentRec = await db.query.payment.findFirst({
    where: eq(payment.transactionReference, reference)
  })

  const appRec = await db.query.schoolRegistrationApplication.findFirst({
    where: eq(schoolRegistrationApplication.paymentReference, reference)
  })

  const transactionRec = await db.query.transactions.findFirst({
    where: eq(transactions.reference, reference)
  })

  let schoolRec = await db.query.school.findFirst({
    where: eq(school.paymentReference, reference)
  })

  if (!schoolRec && appRec?.schoolId) {
    schoolRec = (await db.query.school.findFirst({
      where: eq(school.id, appRec.schoolId)
    })) || undefined
  }

  if (!paymentRec && !appRec && !schoolRec && !transactionRec) {
    return { success: false, status: 'failed', error: 'No matching payment record was found.' }
  }
  if (paymentRec && (typeof paymentRec.status !== 'string' || !['pending', 'success'].includes(paymentRec.status.toLowerCase()))) {
    return { success: false, status: 'failed', error: 'This payment reference is no longer pending.' }
  }
  if (appRec && !['PENDING', 'SUCCESS'].includes(appRec.paymentStatus.toUpperCase())) {
    return { success: false, status: 'failed', error: 'This school application payment is no longer pending.' }
  }
  if (schoolRec && !['PENDING', 'PAID'].includes(schoolRec.paymentStatus.toUpperCase())) {
    return { success: false, status: 'failed', error: 'This school payment is no longer pending.' }
  }
  if (transactionRec && !['pending', 'success'].includes(transactionRec.status.toLowerCase())) {
    return { success: false, status: 'failed', error: 'This payment reference is no longer pending.' }
  }

  const schoolCode = schoolRec?.code || undefined
  const schoolName = schoolRec?.name || appRec?.schoolName || undefined

  if (!secretKey) {
    return { success: false, status: 'failed', schoolCode, schoolName, error: 'Paystack secret key is not configured.' }
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    signal: AbortSignal.timeout(15000),
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
    const requiredAmount = expectedAmount ?? (paymentRec
      ? Number(paymentRec.amount)
      : transactionRec
        ? Number(transactionRec.amount)
        : (schoolRec || appRec) ? 30161.25 : undefined)
    if (requiredAmount !== undefined && !paystackAmountMatches(data.amount, requiredAmount)) {
      return { success: false, status: 'failed', schoolCode, schoolName, error: 'Verified payment amount does not match the required total.' }
    }
    if (data.reference !== reference) {
      return { success: false, status: 'failed', schoolCode, schoolName, error: 'Verified payment reference does not match.' }
    }
    if (typeof data.currency !== 'string' || data.currency.toUpperCase() !== expectedCurrency.toUpperCase()) {
      return { success: false, status: 'failed', schoolCode, schoolName, error: 'Verified payment currency does not match.' }
    }

    if (paymentRec) {
      await markPaymentSuccessful(paymentRec.id, data.id?.toString() || data.reference)
    }
    if (transactionRec) {
      await db.update(transactions)
        .set({ status: 'success', updatedAt: new Date() })
        .where(and(eq(transactions.id, transactionRec.id), eq(transactions.status, 'pending')))
      const metadata = transactionRec.metadata as Record<string, unknown> | null
      if (typeof metadata?.paymentType === 'string' && metadata.paymentType.startsWith('ADULT_EDUCATION_')) {
        const adultEducation = await import('@/app/actions/adult-education')
        await adultEducation.fulfillAdultEducationPayment(reference, transactionRec.amount, metadata)
      }
    }
    if (schoolRec) {
      await db.update(school).set({ paymentStatus: 'PAID', updatedAt: new Date() }).where(eq(school.id, schoolRec.id))
      await db.update(schoolRegistrationApplication).set({ paymentStatus: 'SUCCESS', updatedAt: new Date() }).where(eq(schoolRegistrationApplication.schoolId, schoolRec.id))
    }
  } else if (status === 'failed') {
    if (paymentRec) {
      await markPaymentFailed(paymentRec.id)
    }
    if (transactionRec) {
      await db.update(transactions)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(and(eq(transactions.id, transactionRec.id), eq(transactions.status, 'pending')))
    }
    if (schoolRec) {
      await db.update(school).set({ paymentStatus: 'FAILED', updatedAt: new Date() }).where(and(eq(school.id, schoolRec.id), eq(school.paymentStatus, 'PENDING')))
      await db.update(schoolRegistrationApplication).set({ paymentStatus: 'FAILED', updatedAt: new Date() }).where(and(eq(schoolRegistrationApplication.schoolId, schoolRec.id), eq(schoolRegistrationApplication.paymentStatus, 'PENDING')))
    }
  }

  return {
    success: status === 'success',
    status,
    payment: paymentRec ? { amount: paymentRec.amount, feeType: paymentRec.feeType } : null,
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

/** Applies a verified school renewal exactly once, independent of the browser callback. */
export async function completeSchoolRenewalTransaction(reference: string) {
  return db.transaction(async (tx) => {
    const transactionRecord = await tx.query.transactions.findFirst({
      where: eq(transactions.reference, reference),
    })
    const metadata = transactionRecord?.metadata as Record<string, unknown> | null
    const schoolId = typeof metadata?.schoolId === 'string' ? metadata.schoolId : ''
    if (!transactionRecord || transactionRecord.status !== 'success' ||
      metadata?.paymentType !== 'SCHOOL_REGISTRATION_RENEWAL' || !schoolId ||
      Number(transactionRecord.amount) !== 30161.25 || transactionRecord.currency !== 'NGN') {
      return { success: false as const, error: 'No verified school renewal transaction was found.' }
    }

    const existingLedger = await tx.query.transactionLedger.findFirst({
      where: eq(transactionLedger.reference, reference),
    })
    if (existingLedger) {
      if (existingLedger.status !== 'SUCCESS') {
        return { success: false as const, error: 'School renewal ledger entry is not in a successful state.' }
      }
      const existingSchool = await tx.query.school.findFirst({ where: eq(school.id, schoolId) })
      return {
        success: true as const,
        schoolId,
        nextDueDate: existingSchool?.registrationDueDate || new Date(),
        alreadyProcessed: true,
      }
    }

    const schoolRecord = await tx.query.school.findFirst({ where: eq(school.id, schoolId) })
    if (!schoolRecord) return { success: false as const, error: 'School renewal target no longer exists.' }

    const now = new Date()
    const previousDueDate = schoolRecord.registrationDueDate
      ? new Date(schoolRecord.registrationDueDate).getTime()
      : 0
    const nextDueDate = new Date(Math.max(now.getTime(), previousDueDate) + 60 * 24 * 60 * 60 * 1000)

    const [ledgerEntry] = await tx.insert(transactionLedger).values({
      id: randomUUID(),
      schoolId,
      type: 'REGISTRATION_FEE',
      direction: 'IN',
      amount: '30161.25',
      currency: 'NGN',
      reference,
      gateway: 'PAYSTACK',
      status: 'SUCCESS',
      description: 'Bi-monthly School Registration Renewal Fee Payment',
      confirmationMethod: 'PAYSTACK_AUTO',
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing().returning({ id: transactionLedger.id })

    if (!ledgerEntry) {
      const currentSchool = await tx.query.school.findFirst({ where: eq(school.id, schoolId) })
      return {
        success: true as const,
        schoolId,
        nextDueDate: currentSchool?.registrationDueDate || now,
        alreadyProcessed: true,
      }
    }

    await tx.update(school).set({
      paymentStatus: 'PAID',
      registrationPaidAt: now,
      registrationDueDate: nextDueDate,
      updatedAt: now,
    }).where(eq(school.id, schoolId))

    return { success: true as const, schoolId, nextDueDate, alreadyProcessed: false }
  })
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

  const recordEvent = async (status: string) => {
    await db.insert(paymentWebhookLogs).values({
      id: randomUUID(), reference, eventType: event, payload: body as any, status, createdAt: new Date(),
    }).onConflictDoNothing()
  }

  try {
    const existingLog = await db.query.paymentWebhookLogs.findFirst({
      where: and(eq(paymentWebhookLogs.reference, reference), eq(paymentWebhookLogs.eventType, event))
    })
    if (existingLog) {
      await completeIdempotencyKey(idempotencyKey, { success: true, note: 'Event already processed' })
      return { success: true, reference, note: 'Event already processed' }
    }

    const isSuccess = event === 'charge.success' && body.data?.status === 'success'
    const isFailed = event === 'charge.failed' && body.data?.status === 'failed'
    const amountKobo = body.data?.amount
    const currency = body.data?.currency

    if (!isSuccess && !isFailed) {
      await recordEvent('IGNORED')
      await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
      return { success: true, event, reference, note: 'Unsupported Paystack event ignored' }
    }

    const [learnAiPurchase] = await sqlClient`
      select amount_kobo from public.learn_ai_purchases where reference = ${reference} limit 1
    `
    if (learnAiPurchase) {
      if (isSuccess) {
        if (typeof amountKobo !== 'number' || amountKobo !== Number(learnAiPurchase.amount_kobo) || currency !== 'NGN') {
          await recordEvent('REJECTED_AMOUNT')
          await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
          return { success: true, event, reference, note: 'Payment amount or currency mismatch; purchase was not fulfilled' }
        }
        const completed = await completeLearnAiPurchase(reference, amountKobo)
        if (!completed) {
          await recordEvent('REJECTED_PURCHASE_STATE')
          await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
          return { success: true, event, reference, note: 'Purchase was not pending and was not fulfilled' }
        }
      } else if (isFailed) {
        await sqlClient`
          update public.learn_ai_purchases set status = 'failed'
          where reference = ${reference} and status = 'pending'
        `
      }
      await recordEvent('PROCESSED')
      await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
      return { success: true, event, reference, note: 'Learn AI token purchase updated' }
    }

    // 1. School Registration Payment Check
    const appRecord = await db.query.schoolRegistrationApplication.findFirst({ where: eq(schoolRegistrationApplication.paymentReference, reference) })
    const schRecord = await db.query.school.findFirst({ where: eq(school.paymentReference, reference) })

    if (appRecord || schRecord) {
      if (isSuccess) {
        if (currency !== 'NGN' || !paystackAmountMatches(amountKobo, 30161.25)) {
          await recordEvent('REJECTED_AMOUNT')
          await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
          return { success: true, event, reference, note: 'Payment amount or currency mismatch; school was not activated' }
        }
        if (appRecord) {
          await db.update(schoolRegistrationApplication)
            .set({ paymentStatus: 'SUCCESS', updatedAt: new Date() })
            .where(and(eq(schoolRegistrationApplication.id, appRecord.id), eq(schoolRegistrationApplication.paymentStatus, 'PENDING')))
        }
        if (schRecord) {
          await db.update(school).set({ paymentStatus: 'PAID', updatedAt: new Date() }).where(and(eq(school.id, schRecord.id), eq(school.paymentStatus, 'PENDING')))
        }
      } else if (isFailed) {
        if (appRecord) {
          await db.update(schoolRegistrationApplication)
            .set({ paymentStatus: 'FAILED', updatedAt: new Date() })
            .where(and(eq(schoolRegistrationApplication.id, appRecord.id), eq(schoolRegistrationApplication.paymentStatus, 'PENDING')))
        }
        if (schRecord) {
          await db.update(school).set({ paymentStatus: 'FAILED', updatedAt: new Date() }).where(and(eq(school.id, schRecord.id), eq(school.paymentStatus, 'PENDING')))
        }
      }
      await recordEvent('PROCESSED')
      await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
      return { success: true, event, reference, note: 'School application payment status updated' }
    }

    // 2. Transactions Table Check
    const trxRecord = await db.query.transactions.findFirst({ where: eq(transactions.reference, reference) })
    if (trxRecord) {
      if (isSuccess) {
        if (currency !== 'NGN' || !paystackAmountMatches(amountKobo, Number(trxRecord.amount))) {
          await recordEvent('REJECTED_AMOUNT')
          await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
          return { success: true, event, reference, note: 'Payment amount or currency mismatch; transaction was not fulfilled' }
        }
        if (trxRecord.status === 'failed') {
          await recordEvent('REJECTED_PURCHASE_STATE')
          await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
          return { success: true, event, reference, note: 'Failed transactions cannot be marked successful' }
        }
        if (trxRecord.status === 'pending') {
          await db.update(transactions)
            .set({ status: 'success', updatedAt: new Date() })
            .where(and(eq(transactions.id, trxRecord.id), eq(transactions.status, 'pending')))
        }
        const transactionMetadata = trxRecord.metadata as Record<string, unknown> | null
        if (typeof transactionMetadata?.paymentType === 'string' && transactionMetadata.paymentType.startsWith('ADULT_EDUCATION_')) {
          const adultEducation = await import('@/app/actions/adult-education')
          await adultEducation.fulfillAdultEducationPayment(reference, trxRecord.amount, transactionMetadata)
        }
        if (transactionMetadata?.paymentType === 'SCHOOL_REGISTRATION_RENEWAL') {
          const completedRenewal = await completeSchoolRenewalTransaction(reference)
          if (!completedRenewal.success) {
            await recordEvent('REJECTED_RENEWAL_STATE')
            await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
            return { success: true, event, reference, note: 'School renewal was not fulfilled' }
          }
        }
      } else if (isFailed) {
        await db.update(transactions).set({ status: 'failed', updatedAt: new Date() }).where(and(eq(transactions.id, trxRecord.id), eq(transactions.status, 'pending')))
      }
      await recordEvent('PROCESSED')
      await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
      return { success: true, event, reference, note: 'Transaction status updated' }
    }

    // 3. Student Payment Table Check
    const paymentRecord = await db.query.payment.findFirst({ where: eq(payment.transactionReference, reference) })
    if (paymentRecord) {
      if (isSuccess) {
        if (currency !== 'NGN' || !paystackAmountMatches(amountKobo, Number(paymentRecord.amount))) {
          await recordEvent('REJECTED_AMOUNT')
          await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
          return { success: true, event, reference, note: 'Payment amount or currency mismatch; payment was not fulfilled' }
        }
        await markPaymentSuccessful(paymentRecord.id, body.data?.id?.toString() || reference)
      } else if (isFailed) {
        await markPaymentFailed(paymentRecord.id)
      }
      await recordEvent('PROCESSED')
      await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
      return { success: true, event, reference, note: 'Student payment status updated' }
    }

    await recordEvent('IGNORED_UNMATCHED')
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
  return db.transaction(async (tx) => {
    const existingPayment = await tx.query.payment.findFirst({
      where: eq(payment.id, paymentId),
    })
    if (!existingPayment) return null

    const now = new Date()
    const updated = await tx.update(payment)
      .set({
        status: 'success',
        korapayReference: paystackRef || existingPayment.korapayReference || undefined,
        paidAt: existingPayment.paidAt || now,
        paymentDate: existingPayment.paymentDate || now,
        updatedAt: now,
      })
      .where(and(eq(payment.id, paymentId), eq(payment.status, 'pending')))
      .returning()

    // The pending-to-success transition and the registration activation commit together.
    if (
      updated.length > 0 &&
      (updated[0].feeType === 'registration' || updated[0].feeType === 'STUDENT_4MONTH_REGISTRATION')
    ) {
      await tx.update(student)
        .set({
          registrationStatus: 'ACTIVE',
          lastRegistrationFeePaidAt: now,
          registrationDueDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
          updatedAt: now,
        })
        .where(eq(student.id, updated[0].studentId))
    }

    return updated[0] || null
  })
}

export async function markPaymentFailed(paymentId: string) {
  const now = new Date()
  const updated = await db.update(payment)
    .set({
      status: 'failed',
      updatedAt: now,
    })
    .where(and(eq(payment.id, paymentId), eq(payment.status, 'pending')))
    .returning()

  return updated[0] || null
}

export async function reconcilePayment(paymentId: string, adminUserId: string) {
  const now = new Date()
  const existing = await db.query.payment.findFirst({ where: eq(payment.id, paymentId) })
  if (!existing) return null
  if (['PAYSTACK', 'KORAPAY'].includes(existing.paymentMethod.toUpperCase())) {
    throw new Error('Gateway payments must be reconciled against the provider before being marked successful.')
  }
  if (existing.status !== 'pending') throw new Error('Only pending manual payments can be reconciled.')
  const updated = await db.update(payment)
    .set({
      reconciliationStatus: 'RECONCILED',
      reconciledBy: adminUserId,
      reconciledAt: now,
      status: 'success',
      paidAt: now,
      updatedAt: now,
    })
    .where(and(eq(payment.id, paymentId), eq(payment.status, 'pending')))
    .returning()

  if (updated.length > 0 && updated[0].feeType === 'registration') {
    await db.update(student)
      .set({ registrationStatus: 'ACTIVE', updatedAt: now })
      .where(eq(student.id, updated[0].studentId))
  }

  return updated[0] || null
}
