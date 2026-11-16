import { createHmac, timingSafeEqual } from 'node:crypto'

export interface PaystackWebhookBody {
  event?: string
  data?: {
    id?: number
    domain?: string
    status?: string
    reference?: string
    amount?: number // in kobo
    message?: string | null
    gateway_response?: string
    paid_at?: string
    created_at?: string
    channel?: string
    currency?: string
    ip_address?: string
    metadata?: Record<string, unknown>
    customer?: {
      id?: number
      first_name?: string
      last_name?: string
      email?: string
      customer_code?: string
      phone?: string | null
    }
  }
}

export type PaystackWebhookValidation =
  | {
      success: true
      body?: PaystackWebhookBody
      event?: string
      reference?: string
      note?: string
    }
  | { success: false; error: string }

export function validPaystackSignature(
  rawBody: string,
  signature: string | null,
  secret = process.env.PAYSTACK_SECRET_KEY,
): boolean {
  if (!secret || !signature) return false

  try {
    const expected = createHmac('sha512', secret).update(rawBody).digest('hex')
    const supplied = Buffer.from(signature.trim().toLowerCase(), 'utf8')
    const calculated = Buffer.from(expected, 'utf8')
    return supplied.length === calculated.length && timingSafeEqual(supplied, calculated)
  } catch {
    return false
  }
}

export function validatePaystackWebhook(
  rawBody: string,
  signature: string | null,
  secret = process.env.PAYSTACK_SECRET_KEY,
): PaystackWebhookValidation {
  if (Buffer.byteLength(rawBody, 'utf8') > 1_000_000) {
    return { success: false, error: 'Webhook payload is too large' }
  }
  if (!secret) {
    return { success: false, error: 'Payment notification secret is not configured' }
  }
  if (!validPaystackSignature(rawBody, signature, secret)) {
    return { success: false, error: 'Invalid or missing webhook signature' }
  }

  let parsedBody: unknown
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    return { success: false, error: 'Invalid JSON payload' }
  }

  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    return { success: false, error: 'Invalid webhook payload' }
  }

  const body = parsedBody as PaystackWebhookBody
  const event = body.event
  const reference = body.data?.reference
  if (!reference || !event) {
    return {
      success: true,
      note: 'Webhook payload missing reference or event',
    }
  }
  if (typeof event !== 'string' || event.length > 100 || !/^[a-zA-Z0-9._-]+$/.test(event)) {
    return { success: false, error: 'Invalid payment event' }
  }
  if (typeof reference !== 'string' || reference.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(reference)) {
    return { success: false, error: 'Invalid payment reference' }
  }

  return { success: true, body, event, reference }
}

/**
 * Checks if Paystack amount in kobo matches expected amount in Naira.
 * Paystack amounts are sent in kobo (e.g. 100000 = ₦1,000.00).
 */
export function paystackAmountMatches(actualKobo: number | string | undefined, expectedNaira: number): boolean {
  if (actualKobo === undefined || actualKobo === null || actualKobo === '') return false
  if (typeof actualKobo === 'string' && !/^\d+$/.test(actualKobo.trim())) return false
  const actualKoboNum = Number(actualKobo)
  if (!Number.isSafeInteger(actualKoboNum) || !Number.isFinite(expectedNaira) || expectedNaira <= 0) return false
  const expectedKobo = Math.round(expectedNaira * 100)
  return Number.isSafeInteger(expectedKobo) && expectedKobo > 0 && actualKoboNum === expectedKobo
}
