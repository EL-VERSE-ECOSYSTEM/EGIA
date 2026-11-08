import { NextResponse } from 'next/server'
import { processPaystackWebhook } from '@/lib/payments/service'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing Paystack signature header' }, { status: 400 })
    }

    const result = await processPaystackWebhook(rawBody, signature)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ received: true, ...result }, { status: 200 })
  } catch (error: any) {
    console.error('Paystack webhook error:', error)
    return NextResponse.json({ error: 'Internal server error processing Paystack webhook' }, { status: 500 })
  }
}
