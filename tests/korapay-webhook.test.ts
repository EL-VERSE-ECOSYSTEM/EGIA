import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { validKorapaySignature, processKorapayWebhook } from '../lib/payments/service'

test('validKorapaySignature - verifies valid HMAC SHA256 signatures correctly', () => {
  const secret = 'test_secret_key_12345'
  process.env.KORAPAY_SECRET_KEY = secret

  const payload = JSON.stringify({
    event: 'charge.success',
    data: { reference: 'TEST-REF-001', amount: 5000, status: 'success' }
  })

  const validSignature = createHmac('sha256', secret).update(payload).digest('hex')

  assert.equal(validKorapaySignature(payload, validSignature), true)
  assert.equal(validKorapaySignature(payload, 'invalid_signature_hex'), false)
  assert.equal(validKorapaySignature(payload, null), false)
})

test('processKorapayWebhook - rejects invalid signature when secret key is set', async () => {
  const secret = 'test_secret_key_12345'
  process.env.KORAPAY_SECRET_KEY = secret

  const payload = JSON.stringify({
    event: 'charge.success',
    data: { reference: 'TEST-REF-002', amount: 1000, status: 'success' }
  })

  const result = await processKorapayWebhook(payload, 'bad_signature')
  assert.equal(result.success, false)
  assert.equal(result.error, 'Invalid or missing webhook signature')
})

test('processKorapayWebhook - handles missing reference or event gracefully', async () => {
  delete process.env.KORAPAY_SECRET_KEY

  const payloadNoRef = JSON.stringify({ event: 'charge.success', data: {} })
  const resNoRef = await processKorapayWebhook(payloadNoRef, null)
  assert.equal(resNoRef.success, true)
  assert.equal(resNoRef.note, 'Webhook payload missing reference or event')
})
