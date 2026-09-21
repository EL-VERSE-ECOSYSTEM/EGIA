import { db } from '@/lib/db'
import { payment, school, transactions, student, paymentWebhookLogs, transactionLedger, schoolRegistrationApplication } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createHmac, timingSafeEqual, randomUUID } from 'crypto'

export interface CreateInvoiceParams {
  schoolId?: string | null
  studentId: string
  parentId?: string | null
  amount: number
  feeType: string
  description?: string
  currency?: string
}

export interface InitializePaymentParams {
  invoiceId?: string
  schoolId?: string | null
  studentId?: string
  parentId?: string | null
  amount: number
  currency?: string
  feeType: string
  description?: string
  customerEmail: string
  customerName?: string
  redirectUrl?: string
  metadata?: Record<string, any>
}

export interface PaymentVerificationParams {
  reference: string
  expectedAmount?: number
  expectedCurrency?: string
  expectedSchoolId?: string
  expectedStudentId?: string
  expectedParentId?: string
  expectedPurpose?: string
}

export interface WebhookProcessResult {
  success: boolean
  event?: string
  reference?: string
  note?: string
  error?: string
}

function validKorapaySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.KORAPAY_SECRET_KEY
  if (!secret || !signature) return false
  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    const supplied = Buffer.from(signature, 'utf8')
    const calculated = Buffer.from(expected, 'utf8')
    return supplied.length === calculated.length && timingSafeEqual(supplied, calculated)
  } catch {
    return false
  }
}

function checkoutUrl(reference: string, redirectUrl?: string): string {
  const base = process.env.KORAPAY_CHECKOUT_LINK || 'https://checkout.korapay.com/pay/BHba4zdsceZDgyW'
  const url = new URL(base)
  url.searchParams.set('reference', reference)

  const siteUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
  const finalRedirect = redirectUrl || (siteUrl ? `${siteUrl.replace(/\/$/, '')}/payment/return?reference=${encodeURIComponent(reference)}` : undefined)
  if (finalRedirect) {
    url.searchParams.set('redirect_url', finalRedirect)
  }

  return url.toString()
}

export async function createInvoice(params: CreateInvoiceParams) {
  const paymentId = randomUUID()
  const reference = `EGIA-INV-${Date.now()}-${randomUUID().slice(0, 8)}`

  const inserted = await db.insert(payment).values({
    id: paymentId,
    schoolId: params.schoolId || null,
    studentId: params.studentId,
    parentId: params.parentId || null,
    amount: params.amount.toFixed(2),
    feeType: params.feeType,
    paymentMethod: 'KORAPAY',
    transactionReference: reference,
    status: 'pending',
    description: params.description || `${params.feeType} invoice`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()

  return inserted[0]
}

export async function initializeKorapayPayment(params: InitializePaymentParams) {
  const secretKey = process.env.KORAPAY_SECRET_KEY
  const siteUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const reference = `EGIA-PAY-${Date.now()}-${randomUUID().slice(0, 8)}`
  const currency = params.currency || 'NGN'

  let paymentRecord: any = null
  if (params.studentId) {
    paymentRecord = (await db.insert(payment).values({
      id: params.invoiceId || randomUUID(),
      schoolId: params.schoolId || null,
      studentId: params.studentId,
      parentId: params.parentId || null,
      amount: params.amount.toFixed(2),
      feeType: params.feeType,
      paymentMethod: 'KORAPAY',
      transactionReference: reference,
      status: 'pending',
      description: params.description || `${params.feeType} payment`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning())[0]
  }

  let checkout = checkoutUrl(reference, params.redirectUrl)

  if (secretKey) {
    try {
      const payload = {
        amount: params.amount,
        currency,
        reference,
        narration: params.description || `${params.feeType} payment`,
        notification_url: `${siteUrl.replace(/\/$/, '')}/api/webhooks/korapay`,
        redirect_url: params.redirectUrl || `${siteUrl.replace(/\/$/, '')}/payment/return?reference=${encodeURIComponent(reference)}`,
        customer: {
          email: params.customerEmail,
          name: params.customerName || 'Customer',
        },
        metadata: {
          schoolId: params.schoolId,
          studentId: params.studentId,
          parentId: params.parentId,
          feeType: params.feeType,
          ...params.metadata,
        },
      }

      const res = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const koraData = await res.json()
        if (koraData.status && koraData.data?.checkout_url) {
          checkout = koraData.data.checkout_url
        }
      }
    } catch (err) {
      console.warn('Failed to initialize Korapay payment via gateway endpoint:', err)
    }
  }

  return {
    checkoutUrl: checkout,
    reference,
    paymentId: paymentRecord?.id || null,
    amount: params.amount,
    currency,
  }
}

export async function verifyKorapayPayment(params: PaymentVerificationParams) {
  const { reference, expectedAmount, expectedCurrency = 'NGN' } = params
  const secretKey = process.env.KORAPAY_SECRET_KEY

  const paymentRec = await db.query.payment.findFirst({
    where: eq(payment.transactionReference, reference)
  })

  const schoolRec = await db.query.school.findFirst({
    where: eq(school.paymentReference, reference)
  })

  const schoolCode = schoolRec?.code || undefined
  const schoolName = schoolRec?.name || undefined

  if (!secretKey) {
    if (process.env.NODE_ENV === 'production') {
      return { success: false, status: 'failed', schoolCode, schoolName, error: 'Korapay secret key is unconfigured in production environment.' }
    }
    if (paymentRec) {
      await markPaymentSuccessful(paymentRec.id)
    } else if (schoolRec) {
      await db.update(school).set({ paymentStatus: 'PAID', updatedAt: new Date() }).where(eq(school.id, schoolRec.id))
      await db.update(schoolRegistrationApplication).set({ paymentStatus: 'SUCCESS', updatedAt: new Date() }).where(eq(schoolRegistrationApplication.schoolId, schoolRec.id))
    }

    return {
      success: true,
      status: 'success',
      payment: paymentRec || null,
      school: schoolRec || null,
      schoolCode,
      schoolName,
      data: { reference, status: 'success', amount: paymentRec ? Number(paymentRec.amount) : 30161.25, currency: expectedCurrency }
    }
  }

  const res = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })

  if (!res.ok) {
    const errText = await res.text()
    return { success: false, status: 'failed', schoolCode, schoolName, error: `Verification request failed (${res.status}): ${errText}` }
  }

  const json = await res.json()
  if (!json.status || !json.data) {
    return { success: false, status: 'failed', schoolCode, schoolName, error: json.message || 'Invalid verification response from Korapay' }
  }

  const data = json.data
  const status = (data.status || '').toLowerCase()

  if (status === 'success') {
    if (expectedAmount !== undefined && Number(data.amount) < expectedAmount) {
      return { success: false, status: 'failed', schoolCode, schoolName, error: 'Verified payment amount is less than required total.' }
    }

    if (paymentRec) {
      await markPaymentSuccessful(paymentRec.id, data.korapay_reference || data.reference)
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
      amount: data.amount,
      currency: data.currency,
      paidAt: data.paid_at,
    }
  }
}

export async function processKorapayWebhook(rawBody: string, signature: string | null): Promise<WebhookProcessResult> {
  if (process.env.KORAPAY_SECRET_KEY) {
    if (!validKorapaySignature(rawBody, signature)) {
      return { success: false, error: 'Invalid or missing webhook signature' }
    }
  }

  let body: { event?: string | { type?: string }; data?: { reference?: string; amount?: number | string; status?: string } }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return { success: false, error: 'Invalid JSON payload' }
  }

  const event = typeof body.event === 'string' ? body.event : body.event?.type
  const reference = body.data?.reference
  if (!reference || !event) {
    return { success: true, note: 'Webhook payload missing reference or event' }
  }

  const existingLog = await db.query.paymentWebhookLogs.findFirst({
    where: and(
      eq(paymentWebhookLogs.reference, reference),
      eq(paymentWebhookLogs.eventType, event)
    )
  })

  if (existingLog) {
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

  const isSuccess = event === 'charge.success' || event === 'transfer.success' || body.data?.status === 'success'
  const isFailed = event === 'charge.failed' || event === 'transfer.failed' || body.data?.status === 'failed'

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
    return { success: true, event, reference, note: 'School application payment status updated' }
  }

  // 2. Transactions Table Check
  const trxRecord = await db.query.transactions.findFirst({ where: eq(transactions.reference, reference) })
  if (trxRecord) {
    if (isSuccess) {
      if (body.data?.amount !== undefined && Number(body.data.amount) !== Number(trxRecord.amount)) {
        return { success: false, error: 'Payment amount mismatch' }
      }
      await db.update(transactions).set({ status: 'success', updatedAt: new Date() }).where(eq(transactions.id, trxRecord.id))
    } else if (isFailed) {
      await db.update(transactions).set({ status: 'failed', updatedAt: new Date() }).where(eq(transactions.id, trxRecord.id))
    }
    return { success: true, event, reference, note: 'Transaction status updated' }
  }

  // 3. Student Payment Table Check
  const paymentRecord = await db.query.payment.findFirst({ where: eq(payment.transactionReference, reference) })
  if (paymentRecord) {
    if (isSuccess) {
      if (body.data?.amount !== undefined && Number(body.data.amount) < Number(paymentRecord.amount)) {
        return { success: false, error: 'Payment amount mismatch' }
      }
      await markPaymentSuccessful(paymentRecord.id)
    } else if (isFailed) {
      await markPaymentFailed(paymentRecord.id)
    }
    return { success: true, event, reference, note: 'Student payment status updated' }
  }

  return { success: true, event, reference, note: 'No matching transaction record found' }
}

export async function markPaymentSuccessful(paymentId: string, korapayRef?: string) {
  const now = new Date()
  const updated = await db.update(payment)
    .set({
      status: 'success',
      korapayReference: korapayRef || undefined,
      paidAt: now,
      paymentDate: now,
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
