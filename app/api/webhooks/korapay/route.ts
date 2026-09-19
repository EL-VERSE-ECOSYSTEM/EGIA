import { createHmac, timingSafeEqual, randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payment, student, transactions, school, paymentWebhookLogs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

function validSignature(rawBody: string, signature: string | null): boolean {
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

export async function POST(req: Request) {
  let rawBody = ''
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 })
  }

  let body: { event?: string | { type?: string }; data?: { reference?: string; amount?: number | string; status?: string } }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const signature = req.headers.get('x-korapay-signature') || req.headers.get('x-korapay-signature-header')
  if (process.env.KORAPAY_SECRET_KEY) {
    if (!validSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid or missing webhook signature' }, { status: 401 })
    }
  }

  const event = typeof body.event === 'string' ? body.event : body.event?.type
  const reference = body.data?.reference
  if (!reference || !event) return NextResponse.json({ received: true })

  // Idempotency check using paymentWebhookLogs
  const existingLog = await db.query.paymentWebhookLogs.findFirst({
    where: and(
      eq(paymentWebhookLogs.reference, reference),
      eq(paymentWebhookLogs.eventType, event)
    )
  })

  if (existingLog) {
    return NextResponse.json({ received: true, note: 'Event already processed' })
  }

  // Record webhook log
  await db.insert(paymentWebhookLogs).values({
    id: randomUUID(),
    reference,
    eventType: event,
    payload: body as any,
    status: 'PROCESSED',
    createdAt: new Date(),
  })

  // 1. Check school registration subscription table first
  const schRecord = await db.query.school.findFirst({ where: eq(school.paymentReference, reference) })
  if (schRecord) {
    if (event === 'charge.success' || event === 'transfer.success' || body.data?.status === 'success') {
      await db.update(school)
        .set({ paymentStatus: 'PAID', updatedAt: new Date() })
        .where(eq(school.id, schRecord.id))
    } else if (event === 'charge.failed' || event === 'transfer.failed' || body.data?.status === 'failed') {
      await db.update(school)
        .set({ paymentStatus: 'FAILED', updatedAt: new Date() })
        .where(eq(school.id, schRecord.id))
    }
    return NextResponse.json({ received: true, type: 'SCHOOL_REGISTRATION' })
  }

  // 2. Check general transactions table
  const trxRecord = await db.query.transactions.findFirst({ where: eq(transactions.reference, reference) })
  if (trxRecord) {
    if (event === 'charge.success' || event === 'transfer.success') {
      if (body.data?.amount !== undefined && Number(body.data.amount) !== Number(trxRecord.amount)) {
        return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 409 })
      }
      await db.update(transactions)
        .set({ status: 'success', updatedAt: new Date() })
        .where(eq(transactions.id, trxRecord.id))
    } else if (event === 'charge.failed' || event === 'transfer.failed') {
      await db.update(transactions)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(transactions.id, trxRecord.id))
    }
    return NextResponse.json({ received: true })
  }

  // 3. Check student payment table
  const record = await db.query.payment.findFirst({ where: eq(payment.transactionReference, reference) })
  if (!record) return NextResponse.json({ received: true })

  if (event === 'charge.success' || event === 'transfer.success') {
    if (body.data?.amount !== undefined && Number(body.data.amount) !== Number(record.amount)) {
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 409 })
    }
    await db.update(payment).set({ status: 'success', paidAt: new Date(), paymentDate: new Date(), updatedAt: new Date() })
      .where(eq(payment.id, record.id))
    if (record.feeType === 'registration') {
      await db.update(student).set({ registrationStatus: 'ACTIVE', updatedAt: new Date() }).where(eq(student.id, record.studentId))
    }
  } else if (event === 'charge.failed' || event === 'transfer.failed') {
    await db.update(payment).set({ status: 'failed', updatedAt: new Date() }).where(eq(payment.id, record.id))
  }
  return NextResponse.json({ received: true })
}
