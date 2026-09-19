import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

const ALLOWED_CURRENCIES = ['NGN']

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 })
    }

    const body = await req.json()
    const { amount, customerEmail, customerName, description, currency = 'NGN', metadata } = body

    if (!ALLOWED_CURRENCIES.includes(currency.toUpperCase())) {
      return NextResponse.json({ error: `Invalid currency. Allowed currencies: ${ALLOWED_CURRENCIES.join(', ')}` }, { status: 400 })
    }

    const numericAmount = Number(amount)
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Valid positive payment amount is required' }, { status: 400 })
    }

    const targetEmail = customerEmail || user.email
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      return NextResponse.json({ error: 'Valid customer email is required' }, { status: 400 })
    }

    const secretKey = process.env.KORAPAY_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'Korapay secret key is not configured' }, { status: 500 })
    }

    const gatewayFee = 161.25
    const totalAmount = numericAmount + gatewayFee

    const reference = `TRX-${Date.now()}-${randomUUID().slice(0, 8)}`
    const siteUrl = process.env.NEXT_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const notificationUrl = `${siteUrl.replace(/\/$/, '')}/api/webhooks/korapay`
    const redirectUrl = `${siteUrl.replace(/\/$/, '')}/api/payments/callback`

    const payload = {
      amount: totalAmount,
      currency: currency.toUpperCase(),
      reference,
      narration: description ? `${description} (includes NGN 161.25 gateway fee)` : 'Payment transaction (includes NGN 161.25 gateway fee)',
      notification_url: notificationUrl,
      redirect_url: redirectUrl,
      customer: {
        email: targetEmail,
        name: customerName || (user.user_metadata?.full_name || targetEmail.split('@')[0]),
      },
      metadata: {
        ...metadata,
        userId: user.id,
      },
    }

    // Pre-insert transaction in pending state before gateway call
    const transactionId = randomUUID()
    await db.insert(transactions).values({
      id: transactionId,
      reference,
      amount: totalAmount.toFixed(2),
      currency: currency.toUpperCase(),
      status: 'pending',
      customerEmail: targetEmail,
      customerName: customerName || user.user_metadata?.full_name || null,
      description: description || null,
      checkoutUrl: null,
      metadata: payload.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

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

    // Update checkout URL for pending transaction
    await db
      .update(transactions)
      .set({ checkoutUrl, updatedAt: new Date() })
      .where(eq(transactions.id, transactionId))

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
