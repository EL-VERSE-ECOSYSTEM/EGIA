import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payment } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

export async function POST(req: Request) {
  const rawBody = await req.text()
  const body = JSON.parse(rawBody)
  const signature = req.headers.get('x-korapay-signature')
  const secret = process.env.KORAPAY_SECRET_KEY

  if (secret && signature) {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')

    if (hash !== signature) {
      return new Response('Unauthorized: Invalid Signature', { status: 401 })
    }
  } else if (!signature) {
    return new Response('Unauthorized: Missing Signature', { status: 401 })
  }

  const { event, data } = body

  if (event === 'charge.success') {
    const reference = data.reference

    await db.update(payment)
      .set({
        status: 'success',
        paidAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(payment.transactionReference, reference))
  }

  return NextResponse.json({ received: true })
}
