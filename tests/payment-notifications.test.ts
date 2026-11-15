import test from 'node:test'
import assert from 'node:assert/strict'
import { getPaymentStatusNotificationCopy } from '../lib/payments/notifications'

test('payment status notifications cover pending, processing, success, and failed states', () => {
  const statuses = ['pending', 'processing', 'success', 'failed'] as const
  for (const status of statuses) {
    const copy = getPaymentStatusNotificationCopy(status, 1500, 'Amina Learner', 'Tuition')
    assert.ok(copy.title)
    assert.ok(copy.type)
    assert.match(copy.message, /Amina Learner/)
    assert.match(copy.message, /Tuition/)
    assert.match(copy.message, /1,500\.00/)
  }

  assert.equal(getPaymentStatusNotificationCopy('success', 1500, 'Amina Learner', 'Tuition').type, 'payment_confirmation')
  assert.equal(getPaymentStatusNotificationCopy('failed', 1500, 'Amina Learner', 'Tuition').type, 'payment_failed')
})
