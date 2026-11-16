import { db, sqlClient } from '@/lib/db'
import { payment, schoolRegistrationApplication, schoolRegistrationBatches, student, school, transactionLedger, transactions, paymentWebhookLogs, paymentInstallment } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import {
  paystackAmountMatches,
  validatePaystackWebhook,
  validPaystackSignature
} from './paystack-security'
import { checkOrAcquireIdempotency, completeIdempotencyKey, failIdempotencyKey } from '@/lib/idempotency'
import { completeLearnAiPurchase } from '@/lib/learn-ai'
import { notifyPaymentConfirmed, notifyPaymentStatus } from '@/lib/payments/notifications'
import { allocatePaymentAcrossInstallments } from '@/lib/payments/installments'
import { calculateSchoolRegistrationTotal } from '@/lib/school-registration'

export { validPaystackSignature, validatePaystackWebhook, paystackAmountMatches }

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
  termId?: string | null
  installmentId?: string
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

async function syncSchoolRegistrationLedger(
  schoolId: string,
  reference: string,
  status: 'PENDING' | 'SUCCESS' | 'FAILED',
) {
  const now = new Date()
  await db.insert(transactionLedger).values({
    id: randomUUID(),
    schoolId,
    type: 'REGISTRATION_FEE',
    direction: 'IN',
    amount: '30161.25',
    currency: 'NGN',
    reference,
    gateway: 'PAYSTACK',
    status,
    description: 'School registration fee payment',
    confirmationMethod: 'PAYSTACK_AUTO',
    metadata: { paymentType: 'SCHOOL_REGISTRATION' },
    createdAt: now,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: transactionLedger.reference,
    set: { status, updatedAt: now },
  })
}

export async function createStudentPaymentRecord(params: {
  studentId: string
  parentId?: string | null
  termId?: string | null
  amount: number
  feeType: string
  description?: string
  schoolId?: string
  reference?: string
  installmentId?: string
}) {
  const reference = params.reference || `pay_${randomUUID()}`
  const now = new Date()

  return db.transaction(async (tx) => {
    const [record] = await tx.insert(payment).values({
      id: randomUUID(),
      studentId: params.studentId,
      parentId: params.parentId,
      termId: params.termId,
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

    if (record.schoolId) {
      await tx.insert(transactionLedger).values({
        id: randomUUID(),
        schoolId: record.schoolId,
        studentId: record.studentId,
        type: record.feeType?.toLowerCase().includes('registration') ? 'REGISTRATION_FEE' : 'FEE_PAYMENT',
        direction: 'IN',
        amount: record.amount,
        currency: 'NGN',
        reference,
        gateway: 'PAYSTACK',
        status: 'PENDING',
        description: record.description,
        confirmationMethod: 'PAYSTACK_AUTO',
        metadata: { paymentId: record.id, feeType: record.feeType },
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing()
    }

    if (params.installmentId) {
      const linked = await tx.update(paymentInstallment)
        .set({ paymentId: record.id })
        .where(and(
          eq(paymentInstallment.id, params.installmentId),
          eq(paymentInstallment.status, 'processing'),
          eq(paymentInstallment.studentId, params.studentId),
        ))
        .returning({ id: paymentInstallment.id })
      if (!linked.length) throw new Error('This installment is already being processed or is no longer available.')
    }

    return record
  })
}

/**
 * Initializes a transaction with Paystack Checkout API.
 * Amount is converted from Naira to Kobo (multiply by 100).
 */
export async function initializePaystackPayment(params: InitializePaymentParams) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) {
    throw new Error('Online payment service is unavailable because its secret key is not configured.')
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
    throw new Error('NEXT_PUBLIC_SITE_URL must be configured for payment redirects in production.')
  }
  const siteUrl = configuredSiteUrl || 'http://localhost:3000'
  const callbackUrl = params.callbackUrl || `${siteUrl.replace(/\/$/, '')}/payment/return`
  const redirectUrl = params.redirectUrl || callbackUrl
  try {
    if (new URL(redirectUrl).origin !== new URL(siteUrl).origin) {
      throw new Error('Payment callback URL must use the configured application origin.')
    }
  } catch {
    throw new Error('A valid same-origin payment callback URL is required.')
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
      parentId: params.parentId || undefined,
      termId: params.termId || undefined,
      reference,
      installmentId: params.installmentId,
    })
  }
  if (params.schoolId && params.feeType === 'SCHOOL_REGISTRATION') {
    await syncSchoolRegistrationLedger(params.schoolId, reference, 'PENDING')
  }

  let checkoutUrl: string
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
      throw new Error('Payment could not be initialized. Please try again.')
    }

    checkoutUrl = paystackData.data.authorization_url
  } catch (error) {
    if (paymentRecord) {
      await markPaymentFailed(paymentRecord.id)
    }
    if (params.schoolId && params.feeType === 'SCHOOL_REGISTRATION') {
      await syncSchoolRegistrationLedger(params.schoolId, reference, 'FAILED')
    }
    throw error
  }

  if (paymentRecord) await notifyPaymentStatus(paymentRecord.id, 'processing')

  return {
    checkoutUrl,
    authorizationUrl: checkoutUrl,
    reference,
    paymentId: paymentRecord?.id || null,
    amount: params.amount,
    currency,
  }
}

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
    return { success: false, status: 'failed', schoolCode, schoolName, error: 'Payment service is not configured.' }
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    console.warn('Payment verification request failed with status:', res.status)
    return { success: false, status: 'failed', schoolCode, schoolName, error: 'Payment verification could not be completed. Please try again.' }
  }

  const json = await res.json()
  if (!json.status || !json.data) {
    return { success: false, status: 'failed', schoolCode, schoolName, error: 'Payment verification could not be completed.' }
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
      if (metadata?.paymentType === 'SCHOOL_BULK_REGISTRATION') {
        const completedBatch = await completeSchoolRegistrationBatch(reference, 'SUCCESS')
        if (!completedBatch) {
          return { success: false, status: 'failed', schoolCode, schoolName, error: 'The student registration batch could not be verified.' }
        }
      }
    }
    if (schoolRec) {
      await db.update(school).set({ paymentStatus: 'PAID', updatedAt: new Date() }).where(eq(school.id, schoolRec.id))
      await db.update(schoolRegistrationApplication).set({ paymentStatus: 'SUCCESS', updatedAt: new Date() }).where(eq(schoolRegistrationApplication.schoolId, schoolRec.id))
    }
    const registrationSchoolId = schoolRec?.id || appRec?.schoolId
    if (registrationSchoolId) {
      await syncSchoolRegistrationLedger(registrationSchoolId, reference, 'SUCCESS')
    }
  } else if (status === 'failed' || status === 'abandoned') {
    if (paymentRec) {
      await markPaymentFailed(paymentRec.id)
    }
    if (transactionRec) {
      await db.update(transactions)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(and(eq(transactions.id, transactionRec.id), eq(transactions.status, 'pending')))
      const metadata = transactionRec.metadata as Record<string, unknown> | null
      if (metadata?.paymentType === 'SCHOOL_BULK_REGISTRATION') {
        await completeSchoolRegistrationBatch(reference, 'FAILED')
      }
    }
    if (schoolRec) {
      await db.update(school).set({ paymentStatus: 'FAILED', updatedAt: new Date() }).where(and(eq(school.id, schoolRec.id), eq(school.paymentStatus, 'PENDING')))
      await db.update(schoolRegistrationApplication).set({ paymentStatus: 'FAILED', updatedAt: new Date() }).where(and(eq(schoolRegistrationApplication.schoolId, schoolRec.id), eq(schoolRegistrationApplication.paymentStatus, 'PENDING')))
    }
    const registrationSchoolId = schoolRec?.id || appRec?.schoolId
    if (registrationSchoolId) {
      await syncSchoolRegistrationLedger(registrationSchoolId, reference, 'FAILED')
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

export async function completeSchoolRegistrationBatch(reference: string, outcome: 'SUCCESS' | 'FAILED') {
  return db.transaction(async (tx) => {
    const batch = await tx.query.schoolRegistrationBatches.findFirst({
      where: eq(schoolRegistrationBatches.paymentReference, reference),
    })
    if (!batch) return false
    if (batch.status === 'PAID') return outcome === 'SUCCESS'

    if (outcome === 'FAILED') {
      await tx.update(schoolRegistrationBatches)
        .set({ status: 'FAILED', updatedAt: new Date() })
        .where(and(
          eq(schoolRegistrationBatches.id, batch.id),
          eq(schoolRegistrationBatches.paymentReference, reference),
          eq(schoolRegistrationBatches.status, 'PENDING'),
        ))
      return true
    }

    const transactionRecord = await tx.query.transactions.findFirst({
      where: eq(transactions.reference, reference),
    })
    if (!transactionRecord || transactionRecord.status !== 'success' ||
      transactionRecord.currency !== 'NGN' || Number(transactionRecord.amount) !== Number(batch.amount) ||
      calculateSchoolRegistrationTotal(batch.studentCount) !== Number(batch.amount)) {
      return false
    }

    const [claimed] = await tx.update(schoolRegistrationBatches)
      .set({ status: 'PAID', updatedAt: new Date() })
      .where(and(
        eq(schoolRegistrationBatches.id, batch.id),
        eq(schoolRegistrationBatches.paymentReference, reference),
        eq(schoolRegistrationBatches.status, 'PENDING'),
      ))
      .returning({ id: schoolRegistrationBatches.id })
    if (!claimed) {
      const current = await tx.query.schoolRegistrationBatches.findFirst({
        where: eq(schoolRegistrationBatches.id, batch.id),
      })
      return current?.status === 'PAID'
    }

    const studentIds = Array.isArray(batch.studentIds)
      ? batch.studentIds.filter((value): value is string => typeof value === 'string')
      : []
    if (studentIds.length !== batch.studentCount) throw new Error('Registration batch has an invalid student list.')
    const now = new Date()
    const batchStudents = await tx.query.student.findMany({
      where: and(inArray(student.id, studentIds), eq(student.schoolId, batch.schoolId)),
    })
    if (batchStudents.length !== batch.studentCount) throw new Error('A registration batch student is missing from its school.')

    for (const enrolledStudent of batchStudents) {
      const studentReference = `${reference}-ST-${enrolledStudent.id}`
      const [paymentRecord] = await tx.insert(payment).values({
        id: randomUUID(),
        schoolId: batch.schoolId,
        studentId: enrolledStudent.id,
        parentId: enrolledStudent.parentId,
        amount: '2161.25',
        feeType: 'registration',
        paymentMethod: 'PAYSTACK',
        transactionReference: studentReference,
        status: 'success',
        paymentDate: now,
        paidAt: now,
        description: `Student registration fee for ${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing().returning({ id: payment.id })

      if (paymentRecord) {
        await tx.insert(transactionLedger).values({
          id: randomUUID(),
          schoolId: batch.schoolId,
          studentId: enrolledStudent.id,
          userId: enrolledStudent.userId || undefined,
          type: 'REGISTRATION_FEE',
          direction: 'IN',
          amount: '2161.25',
          currency: 'NGN',
          reference: studentReference,
          gateway: 'PAYSTACK',
          status: 'SUCCESS',
          description: `Student registration fee for ${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
          confirmationMethod: 'PAYSTACK_AUTO',
          metadata: { paymentId: paymentRecord.id, batchReference: reference },
          createdAt: now,
          updatedAt: now,
        }).onConflictDoNothing()
      }

      await tx.update(student)
        .set({
          registrationStatus: 'ACTIVE',
          registrationPaid: true,
          lastRegistrationFeePaidAt: now,
          registrationDueDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
          updatedAt: now,
        })
        .where(and(eq(student.id, enrolledStudent.id), eq(student.schoolId, batch.schoolId)))
    }
    return true
  })
}

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
  const idempotencyKey = `paystack_webhook_v2_${reference}_${event}`
  const eventIdentity = {
    event,
    reference,
    transactionId: body.data?.id ?? null,
    status: body.data?.status ?? null,
    amount: body.data?.amount ?? null,
    currency: body.data?.currency?.toUpperCase() ?? null,
  }

  // 1. Check idempotency lock to prevent concurrent double-processing
  const lock = await checkOrAcquireIdempotency(idempotencyKey, 'paystack_webhook', eventIdentity)
  if (lock.payloadMismatch) {
    return { success: false, error: 'Webhook event data conflicts with a previously received event.' }
  }
  if (lock.isDuplicate) {
    if (lock.status === 'COMPLETED') {
      return { success: true, reference, note: 'Event already processed' }
    }
    throw new Error('Webhook event is already being processed.')
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
      return { success: true, event, reference, note: 'Unsupported payment notification ignored' }
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
        const registrationSchoolId = schRecord?.id || appRecord?.schoolId
        if (registrationSchoolId) {
          await syncSchoolRegistrationLedger(registrationSchoolId, reference, 'SUCCESS')
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
        const registrationSchoolId = schRecord?.id || appRecord?.schoolId
        if (registrationSchoolId) {
          await syncSchoolRegistrationLedger(registrationSchoolId, reference, 'FAILED')
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
        if (transactionMetadata?.paymentType === 'SCHOOL_BULK_REGISTRATION') {
          const completedBatch = await completeSchoolRegistrationBatch(reference, 'SUCCESS')
          if (!completedBatch) {
            await recordEvent('REJECTED_BULK_REGISTRATION_STATE')
            await completeIdempotencyKey(idempotencyKey, { success: true, event, reference })
            return { success: true, event, reference, note: 'Student registration batch was not fulfilled' }
          }
        }
      } else if (isFailed) {
        await db.update(transactions).set({ status: 'failed', updatedAt: new Date() }).where(and(eq(transactions.id, trxRecord.id), eq(transactions.status, 'pending')))
        const transactionMetadata = trxRecord.metadata as Record<string, unknown> | null
        if (transactionMetadata?.paymentType === 'SCHOOL_BULK_REGISTRATION') {
          await completeSchoolRegistrationBatch(reference, 'FAILED')
        }
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

export async function markPaymentSuccessful(paymentId: string, paystackRef?: string) {
  const updatedPayment = await db.transaction(async (tx) => {
    const existingPayment = await tx.query.payment.findFirst({
      where: eq(payment.id, paymentId),
    })
    if (!existingPayment) return null

    const now = new Date()
    const updated = await tx.update(payment)
      .set({
        status: 'success',
        paystackReference: paystackRef || existingPayment.paystackReference || undefined,
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
          registrationPaid: true,
          lastRegistrationFeePaidAt: now,
          registrationDueDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
          updatedAt: now,
        })
        .where(eq(student.id, updated[0].studentId))
    }

    if (updated.length > 0) {
      const current = updated[0]
      if (current.schoolId && current.transactionReference) {
        const ledgerUpdate = await tx.update(transactionLedger)
          .set({ status: 'SUCCESS', updatedAt: now })
          .where(eq(transactionLedger.reference, current.transactionReference))
          .returning({ id: transactionLedger.id })
        if (!ledgerUpdate.length) {
          await tx.insert(transactionLedger).values({
            id: randomUUID(),
            schoolId: current.schoolId,
            studentId: current.studentId,
            type: current.feeType?.toLowerCase().includes('registration') ? 'REGISTRATION_FEE' : 'FEE_PAYMENT',
            direction: 'IN',
            amount: current.amount,
            currency: 'NGN',
            reference: current.transactionReference,
            gateway: current.paymentMethod.toUpperCase() === 'PAYSTACK' ? 'PAYSTACK' : 'SCHOOL_ACCOUNT',
            status: 'SUCCESS',
            description: current.description,
            confirmationMethod: current.paymentMethod.toUpperCase() === 'PAYSTACK' ? 'PAYSTACK_AUTO' : 'SCHOOL_ACCOUNT',
            metadata: { paymentId: current.id, feeType: current.feeType },
            createdAt: current.paidAt || now,
            updatedAt: now,
          }).onConflictDoNothing()
        }
      }

        const linkedInstallment = await tx.query.paymentInstallment.findFirst({
          where: eq(paymentInstallment.paymentId, paymentId),
        })
        if (linkedInstallment) {
          if (linkedInstallment.status !== 'paid') {
            await tx.update(paymentInstallment)
              .set({ paidAmount: linkedInstallment.amount, status: 'paid', paidAt: now })
              .where(and(
                eq(paymentInstallment.id, linkedInstallment.id),
                eq(paymentInstallment.paymentId, paymentId),
              ))
          }
        } else if (updated[0].schoolId && updated[0].termId && updated[0].feeType) {
          const scheduledInstallments = await tx.query.paymentInstallment.findMany({
            where: and(
              eq(paymentInstallment.studentId, updated[0].studentId),
              eq(paymentInstallment.schoolId, updated[0].schoolId),
              eq(paymentInstallment.termId, updated[0].termId),
              eq(paymentInstallment.feeType, updated[0].feeType),
              inArray(paymentInstallment.status, ['pending', 'partial', 'overdue']),
            ),
            orderBy: (record, { asc }) => [asc(record.dueDate), asc(record.installmentNumber)],
          })
          const netPaymentAmount = Math.max(
            0,
            Number(updated[0].amount) - (updated[0].paymentMethod.toUpperCase() === 'PAYSTACK' ? 161.25 : 0),
          )
          const allocation = allocatePaymentAcrossInstallments(scheduledInstallments, netPaymentAmount)
          for (const installmentUpdate of allocation.updates) {
            await tx.update(paymentInstallment)
              .set({
                paidAmount: installmentUpdate.paidAmount,
                status: installmentUpdate.status,
                paidAt: installmentUpdate.isPaid ? now : null,
              })
              .where(eq(paymentInstallment.id, installmentUpdate.id))
          }
        }
    }

    return updated[0] || null
  })
  if (updatedPayment) await notifyPaymentConfirmed(updatedPayment.id)
  return updatedPayment
}

export async function markPaymentFailed(paymentId: string) {
  const now = new Date()
  const updatedPayment = await db.transaction(async (tx) => {
    const updated = await tx.update(payment)
        .set({ status: 'failed', updatedAt: now })
        .where(and(eq(payment.id, paymentId), eq(payment.status, 'pending')))
        .returning()
    if (updated.length) {
        if (updated[0].transactionReference) {
          await tx.update(transactionLedger)
            .set({ status: 'FAILED', updatedAt: now })
            .where(eq(transactionLedger.reference, updated[0].transactionReference))
        }
        const linkedInstallment = await tx.query.paymentInstallment.findFirst({
          where: eq(paymentInstallment.paymentId, paymentId),
        })
        if (linkedInstallment && linkedInstallment.status !== 'paid') {
          await tx.update(paymentInstallment)
            .set({ status: Number(linkedInstallment.paidAmount || 0) > 0 ? 'partial' : 'pending' })
            .where(and(
              eq(paymentInstallment.id, linkedInstallment.id),
              eq(paymentInstallment.paymentId, paymentId),
            ))
        }
    }
    return updated[0] || null
  })
  if (updatedPayment) await notifyPaymentStatus(updatedPayment.id, 'failed')
  return updatedPayment
}

export async function reconcilePayment(paymentId: string, adminUserId: string) {
  const now = new Date()
  const existing = await db.query.payment.findFirst({ where: eq(payment.id, paymentId) })
  if (!existing) return null
  if (existing.paymentMethod.toUpperCase() === 'PAYSTACK') {
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
