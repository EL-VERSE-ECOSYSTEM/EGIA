import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payment } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  const rawBody = await req.text()
  const body = JSON.parse(rawBody)
  const { event, data } = body

  if (event === 'charge.success' && data?.reference) {
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
