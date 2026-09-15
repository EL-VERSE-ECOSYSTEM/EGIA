import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { transactions, school, payment, student } from '@/lib/db/schema'
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
    // 1. Check school registration reference
    const schRecord = await db.query.school.findFirst({
      where: eq(school.paymentReference, reference),
    })

    if (schRecord) {
      if (schRecord.paymentStatus === 'PAID') {
        return NextResponse.redirect(returnUrl)
      }
    }

    // 2. Check general transactions reference
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
          if (schRecord) {
            await db.update(school)
              .set({ paymentStatus: 'PAID', updatedAt: new Date() })
              .where(eq(school.id, schRecord.id))
          }
          if (record) {
            await db.update(transactions)
              .set({ status: 'success', updatedAt: new Date() })
              .where(eq(transactions.id, record.id))
          }
          // Also check student payment
          const pRecord = await db.query.payment.findFirst({ where: eq(payment.transactionReference, reference) })
          if (pRecord) {
            await db.update(payment).set({ status: 'success', paidAt: new Date(), paymentDate: new Date(), updatedAt: new Date() }).where(eq(payment.id, pRecord.id))
            if (pRecord.feeType === 'registration') {
              await db.update(student).set({ registrationStatus: 'ACTIVE', updatedAt: new Date() }).where(eq(student.id, pRecord.studentId))
            }
          }
        } else if (gatewayStatus === 'failed') {
          if (schRecord) {
            await db.update(school)
              .set({ paymentStatus: 'FAILED', updatedAt: new Date() })
              .where(eq(school.id, schRecord.id))
          }
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
