import { createHmac, timingSafeEqual } from 'node:crypto'

export interface KorapayWebhookBody {
  event?: string | { type?: string }
  data?: {
    reference?: string
    amount?: number | string
    currency?: string
    status?: string
  }
}

export type KorapayWebhookValidation =
  | {
      success: true
      body?: KorapayWebhookBody
      event?: string
      reference?: string
      note?: string
    }
  | { success: false; error: string }

export function validKorapaySignature(
  rawBody: string,
  signature: string | null,
  secret = process.env.KORAPAY_SECRET_KEY,
): boolean {
  if (!secret || !signature) return false

  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    const supplied = Buffer.from(signature.trim().toLowerCase(), 'utf8')
    const calculated = Buffer.from(expected, 'utf8')
    return supplied.length === calculated.length && timingSafeEqual(supplied, calculated)
  } catch {
    return false
  }
}

export function validateKorapayWebhook(
  rawBody: string,
  signature: string | null,
  secret = process.env.KORAPAY_SECRET_KEY,
): KorapayWebhookValidation {
  if (!secret) {
    return { success: false, error: 'Korapay webhook secret key is not configured' }
  }
  if (!validKorapaySignature(rawBody, signature, secret)) {
    return { success: false, error: 'Invalid or missing webhook signature' }
  }

  let body: KorapayWebhookBody
  try {
    body = JSON.parse(rawBody)
  } catch {
    return { success: false, error: 'Invalid JSON payload' }
  }

  const event = typeof body.event === 'string' ? body.event : body.event?.type
  const reference = body.data?.reference
  if (!reference || !event) {
    return {
      success: true,
      note: 'Webhook payload missing reference or event',
    }
  }

  return { success: true, body, event, reference }
}

export function korapayAmountMatches(actual: number | string | undefined, expected: number): boolean {
  if (actual === undefined || actual === null || actual === '') return false
  const actualAmount = Number(actual)
  return Number.isFinite(actualAmount) && Math.round(actualAmount * 100) === Math.round(expected * 100)
}
