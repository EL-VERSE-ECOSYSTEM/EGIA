import { test, expect } from '@playwright/test'

const baseUrl = 'http://localhost:3000'

test.describe('Paystack Payment Gateway Integration', () => {
  test('initialize payment endpoint requires an authenticated user', async ({ request }) => {
    const res = await request.post(`${baseUrl}/api/payments/initialize`, {
      data: {
        amount: 5000,
        studentId: 'test-student',
        feeType: 'Tuition',
      },
    })

    const body = await res.json()
    expect(res.status()).toBe(401)
    expect(body.error).toContain('Sign in')
  })

  test('payment return page displays the generic payment verification state', async ({ page }) => {
    await page.goto(`${baseUrl}/payment/return?reference=TRX-TEST-12345`)
    await expect(page.locator('h1')).toContainText(/Payment Verification/i)
  })
})
