import { NextRequest, NextResponse } from 'next/server'
import { verifyKorapayPayment } from '@/lib/payments/service'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const reference = searchParams.get('reference') || searchParams.get('payment_reference') || ''
  const siteUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const returnUrl = new URL('/payment/return', siteUrl)

  if (!reference) {
    returnUrl.searchParams.set('error', 'missing_reference')
    return NextResponse.redirect(returnUrl)
  }

  returnUrl.searchParams.set('reference', reference)

  try {
    // Invoke verification to sync payment status for client redirect while keeping webhook authoritative
    await verifyKorapayPayment({ reference })
  } catch (error) {
    console.error('Error in Korapay payment callback:', error)
  }

  return NextResponse.redirect(returnUrl)
}
