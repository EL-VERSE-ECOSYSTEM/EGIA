import { test, expect } from '@playwright/test'

const baseUrl = 'http://localhost:3000'

test.describe('Korapay Payment Gateway Integration', () => {
  test('initialize payment endpoint creates pending transaction', async ({ request }) => {
    const res = await request.post(`${baseUrl}/api/payments/initialize`, {
      data: {
        amount: 5000,
        customerEmail: 'test.parent@example.com',
        customerName: 'Test Parent',
        description: 'Term 1 Tuition Fee',
        currency: 'NGN',
        metadata: { feeType: 'Tuition' },
      },
    })

    const body = await res.json()
    console.log('Initialize response status:', res.status(), 'body:', body)
    expect(res.status()).toBe(200)
    expect(body.success).toBe(true)
    expect(body.reference).toMatch(/^TRX-/)
    expect(body.checkoutUrl).toContain('https://checkout.korapay.com/')
  })

  test('payment callback redirects to /payment/return with reference', async ({ page }) => {
    await page.goto(`${baseUrl}/api/payments/callback?reference=TRX-TEST-12345`)
    await expect(page).toHaveURL(/\/payment\/return\?reference=TRX-TEST-12345/)
  })

  test('payment return page displays Korapay verification state', async ({ page }) => {
    await page.goto(`${baseUrl}/payment/return?reference=TRX-TEST-12345`)
    await expect(page.locator('h1')).toContainText(/Korapay payment verification/i)
  })
})
