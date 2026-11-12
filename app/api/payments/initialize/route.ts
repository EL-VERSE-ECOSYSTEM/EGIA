import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { initializePaystackPayment } from '@/app/actions/payments'

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin')
    if (origin && new URL(origin).origin !== new URL(req.url).origin) {
      return NextResponse.json({ error: 'Cross-origin payment initialization is not allowed.' }, { status: 403 })
    }
    const session = await auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Sign in before starting a payment.' }, { status: 401 })
    const body = await req.json()
    const { amount, studentId, feeType } = body ?? {}

    if (typeof studentId !== 'string' || !studentId || typeof feeType !== 'string' || !feeType ||
      typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Choose a student and an active school fee.' }, { status: 400 })
    }

    const result = await initializePaystackPayment({
      amount,
      studentId,
      feeType,
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      authorizationUrl: result.checkoutUrl,
      reference: result.reference,
      paymentId: result.paymentId,
      amount: result.totalAmount,
      currency: 'NGN',
    })
  } catch (error: unknown) {
    console.error('Paystack initialization API error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Payment could not be initialized. Check the selected student and school fee, then try again.' },
      { status: 400 }
    )
  }
}
