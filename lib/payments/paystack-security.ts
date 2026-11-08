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
    metadata?: Record<string, any>
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
  if (!secret) {
    return { success: false, error: 'Paystack webhook secret key is not configured' }
  }
  if (!validPaystackSignature(rawBody, signature, secret)) {
    return { success: false, error: 'Invalid or missing webhook signature' }
  }

  let body: PaystackWebhookBody
  try {
    body = JSON.parse(rawBody)
  } catch {
    return { success: false, error: 'Invalid JSON payload' }
  }

  const event = body.event
  const reference = body.data?.reference
  if (!reference || !event) {
    return {
      success: true,
      note: 'Webhook payload missing reference or event',
    }
  }

  return { success: true, body, event, reference }
}

/**
 * Checks if Paystack amount in kobo matches expected amount in Naira.
 * Paystack amounts are sent in kobo (e.g. 100000 = ₦1,000.00).
 */
export function paystackAmountMatches(actualKobo: number | string | undefined, expectedNaira: number): boolean {
  if (actualKobo === undefined || actualKobo === null || actualKobo === '') return false
  const actualKoboNum = Number(actualKobo)
  if (!Number.isFinite(actualKoboNum)) return false
  const expectedKobo = Math.round(expectedNaira * 100)
  return Math.round(actualKoboNum) === expectedKobo
}

// Backward-compatibility aliases for Korapay naming where external scripts may call them
export const validKorapaySignature = validPaystackSignature
export const validateKorapayWebhook = validatePaystackWebhook
export const korapayAmountMatches = (actual: number | string | undefined, expected: number) => {
  // Support both kobo-level match and direct decimal equality
  if (actual === undefined || actual === null || actual === '') return false
  const num = Number(actual)
  if (!Number.isFinite(num)) return false
  if (Math.round(num * 100) === Math.round(expected * 100)) return true
  return paystackAmountMatches(actual, expected)
}
