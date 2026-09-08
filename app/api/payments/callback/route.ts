import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

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
    const record = await db.query.transactions.findFirst({
      where: eq(transactions.reference, reference),
    })

    if (record && record.status === 'success') {
      return NextResponse.redirect(returnUrl)
    }

    const secretKey = process.env.KORAPAY_SECRET_KEY
    if (!secretKey) {
      console.error('Korapay secret key not configured in callback handler')
      return NextResponse.redirect(returnUrl)
    }

    const response = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (response.ok) {
      const gatewayRes = await response.json()
      const charge = gatewayRes.data
      if (charge && charge.reference === reference) {
        const gatewayStatus = String(charge.status || '').toLowerCase()
        if (gatewayStatus === 'success') {
          if (record) {
            await db.update(transactions)
              .set({ status: 'success', updatedAt: new Date() })
              .where(eq(transactions.id, record.id))
          }
        } else if (gatewayStatus === 'failed') {
          if (record) {
            await db.update(transactions)
              .set({ status: 'failed', updatedAt: new Date() })
              .where(eq(transactions.id, record.id))
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in Korapay payment callback:', error)
  }

  return NextResponse.redirect(returnUrl)
}
