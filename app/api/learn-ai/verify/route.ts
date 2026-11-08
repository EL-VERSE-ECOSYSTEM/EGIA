import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sqlClient } from '@/lib/db'
import { completeLearnAiPurchase } from '@/lib/learn-ai'

export async function GET(request: Request) {
  const session = await auth.getSession()
  const url = new URL(request.url)
  const reference = url.searchParams.get('reference') || ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_SITE_URL || url.origin

  if (!session?.user || !reference) {
    return NextResponse.redirect(new URL('/auth/signin', siteUrl))
  }

  try {
    const [purchase] = await sqlClient`
      select user_id, amount_kobo, status from public.learn_ai_purchases
      where reference = ${reference} limit 1
    `
    if (!purchase || purchase.user_id !== session.user.id) {
      return NextResponse.redirect(new URL('/dashboard-redirect?learn_ai=failed', siteUrl))
    }
    if (purchase.status === 'paid') {
      return NextResponse.redirect(new URL('/dashboard-redirect?learn_ai=success', siteUrl))
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) throw new Error('Payment verification is unavailable.')
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
      signal: AbortSignal.timeout(15000),
    })
    const result = await response.json() as {
      status?: boolean
      data?: { status?: string; amount?: number; currency?: string; reference?: string }
    }
    const verified = result.data
    const valid = response.ok && result.status && verified?.status === 'success' &&
      verified.reference === reference && verified.amount === purchase.amount_kobo &&
      verified.currency === 'NGN'
    const completed = valid && verified?.amount !== undefined
      ? await completeLearnAiPurchase(reference, verified.amount)
      : false
    return NextResponse.redirect(new URL(`/dashboard-redirect?learn_ai=${completed ? 'success' : 'failed'}`, siteUrl))
  } catch {
    return NextResponse.redirect(new URL('/dashboard-redirect?learn_ai=pending', siteUrl))
  }
}