import assert from 'node:assert/strict'
import test from 'node:test'
import { hashPayload, matchesIdempotencyRequest } from '../lib/idempotency.ts'

test('idempotency requests must match the stored operation and payload', () => {
  const payloadHash = hashPayload({
    amount: 12500,
    currency: 'NGN',
    event: 'charge.success',
    reference: 'payment-123',
  })
  const differentPayloadHash = hashPayload({
    amount: 15000,
    currency: 'NGN',
    event: 'charge.success',
    reference: 'payment-123',
  })

  assert.equal(matchesIdempotencyRequest({
    operation: 'paystack_webhook',
    requestHash: payloadHash,
  }, 'paystack_webhook', payloadHash), true)
  assert.equal(matchesIdempotencyRequest({
    operation: 'paystack_webhook',
    requestHash: payloadHash,
  }, 'paystack_webhook', differentPayloadHash), false)
  assert.equal(matchesIdempotencyRequest({
    operation: 'paystack_webhook',
    requestHash: null,
  }, 'paystack_webhook', payloadHash), true)
})

test('idempotency payload hashes preserve falsey values', () => {
  assert.notEqual(hashPayload(false), hashPayload(undefined))
})
