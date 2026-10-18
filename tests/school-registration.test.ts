import test from 'node:test'
import assert from 'node:assert/strict'
import { initializeKorapayPayment } from '../lib/payments/service.ts'

test('initializeKorapayPayment - throws explicit error when KORAPAY_SECRET_KEY is missing', async () => {
  const originalKey = process.env.KORAPAY_SECRET_KEY
  delete process.env.KORAPAY_SECRET_KEY

  try {
    const customRef = `TEST-REF-${Date.now()}`
    await assert.rejects(
      async () => {
        await initializeKorapayPayment({
          reference: customRef,
          amount: 30161.25,
          currency: 'NGN',
          feeType: 'SCHOOL_REGISTRATION',
          description: 'Test subscription',
          customerEmail: 'test@school.com',
          customerName: 'Test School',
        })
      },
      (err: any) => {
        assert.equal(err.message, 'Korapay payment service is unavailable because its secret key is not configured.')
        return true
      }
    )
  } finally {
    if (originalKey !== undefined) {
      process.env.KORAPAY_SECRET_KEY = originalKey
    }
  }
})

test('initializeKorapayPayment - throws explicit error when Korapay API fetch fails', async () => {
  const originalKey = process.env.KORAPAY_SECRET_KEY
  process.env.KORAPAY_SECRET_KEY = 'dummy_secret_key_for_test'

  // Global fetch override to simulate network error
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => {
    throw new Error('Network timeout / API unreachable')
  }) as typeof fetch

  try {
    const customRef = `TEST-REF-FAIL-${Date.now()}`
    await assert.rejects(
      async () => {
        await initializeKorapayPayment({
          reference: customRef,
          amount: 30161.25,
          currency: 'NGN',
          feeType: 'SCHOOL_REGISTRATION',
          description: 'Test subscription',
          customerEmail: 'test@school.com',
          customerName: 'Test School',
        })
      },
      (err: any) => {
        assert.equal(err.message, 'Network timeout / API unreachable')
        return true
      }
    )
  } finally {
    globalThis.fetch = originalFetch
    if (originalKey !== undefined) {
      process.env.KORAPAY_SECRET_KEY = originalKey
    } else {
      delete process.env.KORAPAY_SECRET_KEY
    }
  }
})

test('initializeKorapayPayment - uses checkout URL returned by Korapay API response', async () => {
  const originalKey = process.env.KORAPAY_SECRET_KEY
  process.env.KORAPAY_SECRET_KEY = 'dummy_secret_key_for_test'

  const mockCheckoutUrl = 'https://checkout.korapay.com/pay/test_token_123'
  const customRef = `SCH-PAY-SUCCESS-${Date.now()}`

  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () => {
    return {
      ok: true,
      json: async () => ({
        status: true,
        data: { checkout_url: mockCheckoutUrl, reference: customRef }
      })
    } as any
  }) as typeof fetch

  try {
    const result = await initializeKorapayPayment({
      reference: customRef,
      amount: 30161.25,
      currency: 'NGN',
      feeType: 'SCHOOL_REGISTRATION',
      description: 'Test subscription',
      customerEmail: 'test@school.com',
      customerName: 'Test School',
    })

    assert.equal(result.reference, customRef)
    assert.equal(result.checkoutUrl, mockCheckoutUrl)
  } finally {
    globalThis.fetch = originalFetch
    if (originalKey !== undefined) {
      process.env.KORAPAY_SECRET_KEY = originalKey
    } else {
      delete process.env.KORAPAY_SECRET_KEY
    }
  }
})
