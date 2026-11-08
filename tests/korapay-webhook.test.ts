import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import {
  paystackAmountMatches,
  validPaystackSignature,
  validatePaystackWebhook,
} from '../lib/payments/paystack-security.ts'

test('validPaystackSignature - verifies valid HMAC SHA512 signatures correctly', () => {
  const secret = 'sk_test_mock_paystack_secret_key'
  const payload = JSON.stringify({
    event: 'charge.success',
    data: { reference: 'ref_123', amount: 3016125, currency: 'NGN', status: 'success' },
  })

  const validSignature = createHmac('sha512', secret).update(payload).digest('hex')

  assert.equal(validPaystackSignature(payload, validSignature, secret), true)
  assert.equal(validPaystackSignature(payload, 'invalid_signature_hex', secret), false)
  assert.equal(validPaystackSignature(payload, null, secret), false)
})

test('validatePaystackWebhook - rejects invalid signatures', () => {
  const secret = 'sk_test_mock_paystack_secret_key'
  const payload = JSON.stringify({
    event: 'charge.success',
    data: { reference: 'ref_123' },
  })

  const result = validatePaystackWebhook(payload, 'bad_signature', secret)
  assert.equal(result.success, false)
  if (!result.success) {
    assert.equal(result.error, 'Invalid or missing webhook signature')
  }
})

test('validatePaystackWebhook - rejects requests when the webhook secret is missing', () => {
  const payloadNoRef = JSON.stringify({ event: 'charge.success' })
  const result = validatePaystackWebhook(payloadNoRef, null, '')
  assert.equal(result.success, false)
  if (!result.success) {
    assert.equal(result.error, 'Paystack webhook secret key is not configured')
  }
})

test('validatePaystackWebhook - reports validly signed payloads without event data', () => {
  const secret = 'sk_test_mock_paystack_secret_key'
  const payload = JSON.stringify({ some_other: 'data' })
  const signature = createHmac('sha512', secret).update(payload).digest('hex')

  const result = validatePaystackWebhook(payload, signature, secret)
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.note, 'Webhook payload missing reference or event')
  }
})

test('validatePaystackWebhook - rejects malformed JSON even with a valid signature', () => {
  const secret = 'sk_test_mock_paystack_secret_key'
  const payload = '{ malformed json'
  const signature = createHmac('sha512', secret).update(payload).digest('hex')

  const result = validatePaystackWebhook(payload, signature, secret)
  assert.equal(result.success, false)
  if (!result.success) {
    assert.equal(result.error, 'Invalid JSON payload')
  }
})

test('validatePaystackWebhook - extracts event and reference on valid payload', () => {
  const secret = 'sk_test_mock_paystack_secret_key'
  const payload = JSON.stringify({
    event: 'charge.success',
    data: {
      reference: 'PAY-123456',
      amount: 216125,
      status: 'success',
    },
  })
  const signature = createHmac('sha512', secret).update(payload).digest('hex')

  const result = validatePaystackWebhook(payload, signature, secret)
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.event, 'charge.success')
    assert.equal(result.reference, 'PAY-123456')
    assert.equal(result.body?.data?.amount, 216125)
  }
})

test('paystackAmountMatches - requires exact kobo conversion from naira to the cent', () => {
  // ₦5,161.25 is 516125 kobo
  assert.equal(paystackAmountMatches(516125, 5161.25), true)
  assert.equal(paystackAmountMatches('516125', 5161.25), true)
  assert.equal(paystackAmountMatches(516100, 5161.25), false)
  assert.equal(paystackAmountMatches(516200, 5161.25), false)
  assert.equal(paystackAmountMatches(undefined, 5161.25), false)
  assert.equal(paystackAmountMatches('invalid', 5161.25), false)
})
