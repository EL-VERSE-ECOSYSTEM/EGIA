import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payment, paymentInstallment } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { crypto } from 'crypto'

export async function POST(req: Request) {
  const body = await req.json()
  const signature = req.headers.get('x-korapay-signature')

  // In production, verify the signature with KORAPAY_SECRET_KEY
  // For now, we process based on the event type
  const { event, data } = body

  console.log('Korapay Webhook Received:', event, data.reference)

  try {
    if (event === 'charge.success') {
      const reference = data.reference
      const amount = data.amount

      // 1. Update main payment record
      const updatedPayment = await db.update(payment)
        .set({
          status: 'success',
          paidAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(payment.transactionReference, reference))
        .returning()

      if (updatedPayment[0]) {
        // 2. If it was an installment payment, update the installment status
        // We look for the next pending installment for this payment
        const nextInstallment = await db.query.paymentInstallment.findFirst({
          where: eq(paymentInstallment.paymentId, updatedPayment[0].id),
          orderBy: (pi, { asc }) => [asc(pi.installmentNumber)]
        })

        if (nextInstallment) {
           await db.update(paymentInstallment)
             .set({ status: 'paid', updatedAt: new Date() })
             .where(eq(paymentInstallment.id, nextInstallment.id))
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
