import { NextResponse } from 'next/server'
import { initializePaystackPayment } from '@/lib/payments/service'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      amount,
      customerEmail,
      customerName,
      currency = 'NGN',
      reference,
      studentId,
      feeType,
      description,
      schoolId,
      callbackUrl,
    } = body

    if (!amount || !customerEmail) {
      return NextResponse.json({ error: 'Missing required payment details (amount, customerEmail)' }, { status: 400 })
    }

    const result = await initializePaystackPayment({
      amount: Number(amount),
      customerEmail,
      customerName,
      currency,
      reference,
      studentId,
      feeType,
      description,
      schoolId,
      callbackUrl,
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      authorizationUrl: result.checkoutUrl,
      reference: result.reference,
      paymentId: result.paymentId,
      amount: result.amount,
      currency: result.currency,
    })
  } catch (error: any) {
    console.error('Paystack initialization API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment with Paystack' },
      { status: 500 }
    )
  }
}
