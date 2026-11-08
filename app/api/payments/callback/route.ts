import { NextResponse } from 'next/server'
import { verifyPaystackPayment } from '@/lib/payments/service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference') || searchParams.get('trxref')

  if (!reference) {
    return NextResponse.json({ error: 'Missing payment reference' }, { status: 400 })
  }

  try {
    const result = await verifyPaystackPayment({ reference })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in Paystack payment callback:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
