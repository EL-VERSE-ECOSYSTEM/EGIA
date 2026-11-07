import test from 'node:test'
import assert from 'node:assert/strict'
import { initializePaystackPayment } from '../lib/payments/service.ts'

test('initializePaystackPayment - throws explicit error when PAYSTACK_SECRET_KEY is missing', async () => {
  const originalKey = process.env.PAYSTACK_SECRET_KEY
  delete process.env.PAYSTACK_SECRET_KEY

  try {
    let thrownError: Error | null = null
    try {
      await initializePaystackPayment({
        amount: 30161.25,
        currency: 'NGN',
        customerEmail: 'test@school.edu',
        customerName: 'Test School',
        feeType: 'SCHOOL_REGISTRATION',
        description: 'Test payment',
      })
    } catch (err: any) {
      thrownError = err
    }
    assert.ok(thrownError)
    assert.equal(thrownError.message, 'Paystack payment service is unavailable because its secret key is not configured.')
  } finally {
    if (originalKey) {
      process.env.PAYSTACK_SECRET_KEY = originalKey
    }
  }
})

test('initializePaystackPayment - throws explicit error when Paystack API fetch fails', async () => {
  const originalKey = process.env.PAYSTACK_SECRET_KEY
  process.env.PAYSTACK_SECRET_KEY = 'dummy_secret_key_for_test'

  const originalFetch = global.fetch
  global.fetch = async () => {
    return {
      ok: false,
      status: 400,
      json: async () => ({ status: false, message: 'Invalid API authorization key or params.' }),
    } as any
  }

  try {
    let thrownError: Error | null = null
    try {
      await initializePaystackPayment({
        amount: 30161.25,
        currency: 'NGN',
        customerEmail: 'test@school.edu',
        customerName: 'Test School',
        feeType: 'SCHOOL_REGISTRATION',
        description: 'Test payment',
      })
    } catch (err: any) {
      thrownError = err
    }
    assert.ok(thrownError)
    assert.equal(thrownError.message, 'Invalid API authorization key or params.')
  } finally {
    global.fetch = originalFetch
    if (originalKey) {
      process.env.PAYSTACK_SECRET_KEY = originalKey
    } else {
      delete process.env.PAYSTACK_SECRET_KEY
    }
  }
})

test('initializePaystackPayment - uses authorization URL returned by Paystack API response', async () => {
  const originalKey = process.env.PAYSTACK_SECRET_KEY
  process.env.PAYSTACK_SECRET_KEY = 'dummy_secret_key_for_test'

  const mockCheckoutUrl = 'https://checkout.paystack.com/pay/test_token_123'
  const originalFetch = global.fetch
  global.fetch = async () => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        status: true,
        message: 'Authorization URL created',
        data: {
          authorization_url: mockCheckoutUrl,
          access_code: 'test_token_123',
          reference: 'mock_ref_456',
        },
      }),
    } as any
  }

  try {
    const result = await initializePaystackPayment({
      amount: 30161.25,
      currency: 'NGN',
      customerEmail: 'test@school.edu',
      customerName: 'Test School',
      feeType: 'SCHOOL_REGISTRATION',
      description: 'Test payment',
    })

    assert.equal(result.checkoutUrl, mockCheckoutUrl)
    assert.equal(result.authorizationUrl, mockCheckoutUrl)
    assert.equal(result.amount, 30161.25)
  } finally {
    global.fetch = originalFetch
    if (originalKey) {
      process.env.PAYSTACK_SECRET_KEY = originalKey
    } else {
      delete process.env.PAYSTACK_SECRET_KEY
    }
  }
})
