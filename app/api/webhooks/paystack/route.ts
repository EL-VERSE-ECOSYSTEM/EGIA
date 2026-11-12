import { NextResponse } from 'next/server'
import { processPaystackWebhook } from '@/lib/payments/service'

const MAX_WEBHOOK_BYTES = 1_000_000

async function readBoundedBody(request: Request): Promise<string | null> {
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    totalBytes += value.byteLength
    if (totalBytes > MAX_WEBHOOK_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const body = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(body)
}

export async function POST(req: Request) {
  try {
    const contentLength = Number(req.headers.get('content-length') || 0)
    if (contentLength > MAX_WEBHOOK_BYTES) {
      return NextResponse.json({ error: 'Webhook payload is too large' }, { status: 413 })
    }
    const rawBody = await readBoundedBody(req)
    if (rawBody === null) {
      return NextResponse.json({ error: 'Webhook payload is too large' }, { status: 413 })
    }
    const signature = req.headers.get('x-paystack-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing Paystack signature header' }, { status: 400 })
    }

    const result = await processPaystackWebhook(rawBody, signature)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ received: true, ...result }, { status: 200 })
  } catch (error: any) {
    console.error('Paystack webhook error:', error)
    return NextResponse.json({ error: 'Internal server error processing Paystack webhook' }, { status: 500 })
  }
}
