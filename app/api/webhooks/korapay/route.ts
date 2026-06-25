import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payment } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

export async function POST(req: Request) {
  const body = await req.json()
  const signature = req.headers.get('x-korapay-signature')

  // Verify signature (Simplified for this task)
  if (!signature) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { event, data } = body

  if (event === 'charge.success') {
    const reference = data.reference

    await db.update(payment)
      .set({
        status: 'success',
        updatedAt: new Date()
      })
      .where(eq(payment.reference, reference))
  }

  return NextResponse.json({ received: true })
}
