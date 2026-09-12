import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { amount, customerEmail, customerName, description, currency = 'NGN', metadata } = body

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 })
    }
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return NextResponse.json({ error: 'Valid customer email is required' }, { status: 400 })
    }

    const secretKey = process.env.KORAPAY_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'Korapay secret key is not configured' }, { status: 500 })
    }

    const gatewayFee = 161.25
    const totalAmount = Number(amount) + gatewayFee

    const reference = `TRX-${Date.now()}-${randomUUID().slice(0, 8)}`
    const siteUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const notificationUrl = `${siteUrl.replace(/\/$/, '')}/api/webhooks/korapay`
    const redirectUrl = `${siteUrl.replace(/\/$/, '')}/api/payments/callback`

    const payload = {
      amount: totalAmount,
      currency,
      reference,
      narration: description ? `${description} (includes NGN 161.25 gateway fee)` : 'Payment transaction (includes NGN 161.25 gateway fee)',
      notification_url: notificationUrl,
      redirect_url: redirectUrl,
      customer: {
        email: customerEmail,
        name: customerName || customerEmail.split('@')[0],
      },
      metadata,
    }

    const response = await fetch('https://api.korapay.com/merchant/api/v1/charges/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const korapayRes = await response.json()

    if (!response.ok || !korapayRes.status || !korapayRes.data?.checkout_url) {
      console.error('Korapay initialize charge failed:', korapayRes)
      return NextResponse.json(
        { error: korapayRes.message || 'Failed to initialize payment with Korapay' },
        { status: response.status >= 400 && response.status < 500 ? response.status : 500 }
      )
    }

    const checkoutUrl = korapayRes.data.checkout_url

    await db.insert(transactions).values({
      id: randomUUID(),
      reference,
      amount: totalAmount.toFixed(2),
      currency,
      status: 'pending',
      customerEmail,
      customerName: customerName || null,
      description: description || null,
      checkoutUrl,
      metadata: metadata || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      reference,
      checkoutUrl,
    })
  } catch (error) {
    console.error('Error initializing payment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error initializing payment' },
      { status: 500 }
    )
  }
}
