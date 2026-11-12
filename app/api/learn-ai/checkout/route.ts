import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sqlClient } from '@/lib/db'
import { hasActiveCbtSession, isCrossOriginLearnAiRequest, LEARN_AI_PACKAGES, LEARN_AI_ROLES, type LearnAiPackageId } from '@/lib/learn-ai'
import { isSystemFeatureEnabled } from '@/lib/resilience/feature-flags'

const MAX_PURCHASE_REQUEST_BYTES = 4_000

async function readBoundedBody(request: Request): Promise<string | null> {
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_PURCHASE_REQUEST_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}

export async function POST(request: Request) {
  if (isCrossOriginLearnAiRequest(request)) {
    return NextResponse.json({ error: 'Cross-origin purchases are not allowed.' }, { status: 403 })
  }
  const session = await auth.getSession()
  if (!session?.user) return NextResponse.json({ error: 'Sign in to buy Learn AI tokens.' }, { status: 401 })
  if (!LEARN_AI_ROLES.has(session.user.role.toUpperCase())) {
    return NextResponse.json({ error: 'Your role cannot buy Learn AI tokens.' }, { status: 403 })
  }
  try {
    if (await hasActiveCbtSession(session.user.id)) {
      return NextResponse.json({ error: 'Learn AI is unavailable during an active CBT exam or assessment.' }, { status: 403 })
    }
    if (await isSystemFeatureEnabled('disable_ai', session.user.schoolId)) {
      return NextResponse.json({ error: 'Learn AI purchases are temporarily disabled.' }, { status: 503 })
    }
  } catch {
    return NextResponse.json({ error: 'Learn AI purchases are temporarily unavailable.' }, { status: 503 })
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return NextResponse.json({ error: 'Token purchases are not configured.' }, { status: 503 })

  let packageId: LearnAiPackageId
  try {
    if (Number(request.headers.get('content-length') || 0) > MAX_PURCHASE_REQUEST_BYTES) {
      return NextResponse.json({ error: 'Purchase request is too large.' }, { status: 413 })
    }
    const rawBody = await readBoundedBody(request)
    if (rawBody === null) return NextResponse.json({ error: 'Purchase request is too large.' }, { status: 413 })
    const body = JSON.parse(rawBody) as { packageId?: string }
    if (typeof body.packageId !== 'string' || !Object.hasOwn(LEARN_AI_PACKAGES, body.packageId)) {
      return NextResponse.json({ error: 'Choose a valid token package.' }, { status: 400 })
    }
    packageId = body.packageId as LearnAiPackageId
  } catch {
    return NextResponse.json({ error: 'Invalid purchase request.' }, { status: 400 })
  }

  if (!session.user.email) return NextResponse.json({ error: 'Your account needs an email to make a purchase.' }, { status: 400 })

  const selectedPackage = LEARN_AI_PACKAGES[packageId]
  const purchaseId = randomUUID()
  const reference = `learnai-${randomUUID().replaceAll('-', '')}`
  const amountKobo = selectedPackage.priceNgn * 100
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_SITE_URL
  if (process.env.NODE_ENV === 'production' && !configuredSiteUrl) {
    return NextResponse.json({ error: 'Payment checkout is temporarily unavailable.' }, { status: 503 })
  }
  let siteUrl: string
  try {
    const parsedSiteUrl = new URL(configuredSiteUrl || new URL(request.url).origin)
    if (parsedSiteUrl.username || parsedSiteUrl.password || (process.env.NODE_ENV === 'production' && parsedSiteUrl.protocol !== 'https:')) {
      throw new Error('Invalid configured application origin')
    }
    siteUrl = parsedSiteUrl.origin
  } catch {
    return NextResponse.json({ error: 'Payment checkout is temporarily unavailable.' }, { status: 503 })
  }

  try {
    await sqlClient`
      insert into public.learn_ai_purchases
        (id, user_id, school_id, package_id, tokens, amount_kobo, reference)
      values
        (${purchaseId}, ${session.user.id}, ${session.user.schoolId || null}, ${packageId},
         ${selectedPackage.tokens}, ${amountKobo}, ${reference})
    `

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: session.user.email,
        amount: amountKobo,
        currency: 'NGN',
        reference,
        callback_url: `${siteUrl}/api/learn-ai/verify?reference=${encodeURIComponent(reference)}`,
        metadata: {
          type: 'LEARN_AI_TOKENS',
          purchase_id: purchaseId,
          package_id: packageId,
          user_id: session.user.id,
        },
      }),
      signal: AbortSignal.timeout(15000),
    })
    const result = await response.json() as { status?: boolean; message?: string; data?: { authorization_url?: string } }
    if (!response.ok || !result.status || !result.data?.authorization_url) {
      throw new Error('Paystack did not return a checkout URL.')
    }
    return NextResponse.json({
      checkoutUrl: result.data.authorization_url,
      tokens: selectedPackage.tokens,
      priceNgn: selectedPackage.priceNgn,
      validDays: 30,
    })
  } catch {
    await sqlClient`
      update public.learn_ai_purchases set status = 'failed'
      where id = ${purchaseId} and status = 'pending'
    `.catch(() => undefined)
    return NextResponse.json({ error: 'Could not start token checkout. Please try again.' }, { status: 502 })
  }
}
