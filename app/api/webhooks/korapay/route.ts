import { createHmac, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payment, student } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

function validSignature(data: unknown, signature: string | null) {
  const secret = process.env.KORAPAY_SECRET_KEY
  if (!secret || !signature) return false
  const expected = createHmac('sha256', secret).update(JSON.stringify(data)).digest('hex')
  const supplied = Buffer.from(signature, 'utf8')
  const calculated = Buffer.from(expected, 'utf8')
  return supplied.length === calculated.length && timingSafeEqual(supplied, calculated)
}

export async function POST(req: Request) {
  let body: { event?: string | { type?: string }; data?: { reference?: string; amount?: number | string } }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!validSignature(body.data, req.headers.get('x-korapay-signature'))) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  const event = typeof body.event === 'string' ? body.event : body.event?.type
  const reference = body.data?.reference
  if (!reference) return NextResponse.json({ received: true })

  const record = await db.query.payment.findFirst({ where: eq(payment.transactionReference, reference) })
  if (!record) return NextResponse.json({ received: true }) // Never create a payment from a gateway callback.

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
