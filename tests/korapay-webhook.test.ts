import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import {
  korapayAmountMatches,
  validKorapaySignature,
  validateKorapayWebhook,
} from '../lib/payments/korapay-security.ts'

test('validKorapaySignature - verifies valid HMAC SHA256 signatures correctly', () => {
  const secret = 'test_secret_key_12345'
  const payload = JSON.stringify({
    event: 'charge.success',
    data: { reference: 'TEST-REF-001', amount: 5000, status: 'success' }
  })

  const validSignature = createHmac('sha256', secret).update(payload).digest('hex')

  assert.equal(validKorapaySignature(payload, validSignature, secret), true)
  assert.equal(validKorapaySignature(payload, 'invalid_signature_hex', secret), false)
  assert.equal(validKorapaySignature(payload, null, secret), false)
})

test('validateKorapayWebhook - rejects invalid signatures', () => {
  const secret = 'test_secret_key_12345'
  const payload = JSON.stringify({
    event: 'charge.success',
    data: { reference: 'TEST-REF-002', amount: 1000, status: 'success' }
  })

  const result = validateKorapayWebhook(payload, 'bad_signature', secret)
  assert.equal(result.success, false)
  if (!result.success) assert.equal(result.error, 'Invalid or missing webhook signature')
})

test('validateKorapayWebhook - rejects requests when the webhook secret is missing', () => {
  const payloadNoRef = JSON.stringify({ event: 'charge.success', data: {} })
  const result = validateKorapayWebhook(payloadNoRef, null, '')
  assert.equal(result.success, false)
  if (!result.success) {
    assert.equal(result.error, 'Korapay webhook secret key is not configured')
  }
})

test('validateKorapayWebhook - reports validly signed payloads without event data', () => {
  const secret = 'test_secret_key_12345'
  const payload = JSON.stringify({ event: 'charge.success', data: {} })
  const signature = createHmac('sha256', secret).update(payload).digest('hex')

  const result = validateKorapayWebhook(payload, signature, secret)
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.note, 'Webhook payload missing reference or event')
  }
})

test('validateKorapayWebhook - rejects malformed JSON even with a valid signature', () => {
  const secret = 'test_secret_key_12345'
  const payload = '{invalid'
  const signature = createHmac('sha256', secret).update(payload).digest('hex')

  const result = validateKorapayWebhook(payload, signature, secret)
  assert.equal(result.success, false)
  if (!result.success) assert.equal(result.error, 'Invalid JSON payload')
})

test('idempotent status transition helper logic - prevents duplicate date extensions', () => {
  let registrationDueDate: Date | null = new Date('2026-05-01T00:00:00Z')
  let lastPaidAt: Date | null = new Date('2026-01-01T00:00:00Z')

  function processPaymentSuccess(isAlreadySuccess: boolean, now: Date) {
    if (!isAlreadySuccess) {
      lastPaidAt = now
      registrationDueDate = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000)
    }
  }

  const initialPayTime = new Date('2026-02-01T10:00:00Z')
  processPaymentSuccess(false, initialPayTime)

  const firstDueDate = registrationDueDate?.toISOString()
  assert.equal(lastPaidAt?.toISOString(), initialPayTime.toISOString())

  // Re-verifying 10 days later should NOT update registrationDueDate
  const reverifyTime = new Date('2026-02-11T10:00:00Z')
  processPaymentSuccess(true, reverifyTime)

  assert.equal(registrationDueDate?.toISOString(), firstDueDate)
  assert.equal(lastPaidAt?.toISOString(), initialPayTime.toISOString())
})

test('korapayAmountMatches - requires the exact expected amount to the cent', () => {
  assert.equal(korapayAmountMatches(5161.25, 5161.25), true)
  assert.equal(korapayAmountMatches('5161.25', 5161.25), true)
  assert.equal(korapayAmountMatches(5162, 5161.25), false)
  assert.equal(korapayAmountMatches(5160, 5161.25), false)
  assert.equal(korapayAmountMatches(undefined, 5161.25), false)
  assert.equal(korapayAmountMatches('invalid', 5161.25), false)
})
