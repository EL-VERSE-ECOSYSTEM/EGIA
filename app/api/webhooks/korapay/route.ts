import { NextResponse } from 'next/server'
import { processKorapayWebhook } from '@/lib/payments/service'

export async function POST(req: Request) {
  let rawBody = ''
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 })
  }

  const signature = req.headers.get('x-korapay-signature') || req.headers.get('x-korapay-signature-header')
  const result = await processKorapayWebhook(rawBody, signature)

  if (!result.success) {
    const statusCode = result.error?.includes('signature') ? 401 : (result.error?.includes('mismatch') ? 409 : 400)
    return NextResponse.json({ error: result.error || 'Webhook processing failed' }, { status: statusCode })
  }

  return NextResponse.json({ received: true, ...result })
}
