import assert from 'node:assert/strict'
import test from 'node:test'
import { getPaymentMethodLabel } from '../lib/payments/display'

test('payment method labels hide processor names but preserve manual methods', () => {
  assert.equal(getPaymentMethodLabel('PAYSTACK'), 'Online Payment')
  assert.equal(getPaymentMethodLabel('Paystack Checkout'), 'Online Payment')
  assert.equal(getPaymentMethodLabel('Bank Transfer'), 'Bank Transfer')
  assert.equal(getPaymentMethodLabel(null), 'Online Payment')
})
