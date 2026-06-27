# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: verification/comprehensive_features.spec.ts >> EL GOODNEWS - Comprehensive Feature Verification >> Teacher Class Visibility
- Location: verification/comprehensive_features.spec.ts:12:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Class Roster')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Class Roster')

```

```yaml
- img
- heading "This page couldn’t load" [level=1]
- paragraph: A server error occurred. Reload to try again.
- button "Reload"
- paragraph: ERROR 893746573
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | const BASE_URL = 'http://localhost:3000';
  4  |
  5  | test.describe('EL GOODNEWS - Comprehensive Feature Verification', () => {
  6  |
  7  |   test('Promotion Engine Interface Load', async ({ page }) => {
  8  |     await page.goto(`${BASE_URL}/dashboard/admin/users/students/promotions`);
  9  |     await expect(page.getByText('Class Promotion')).toBeVisible();
  10 |   });
  11 |
  12 |   test('Teacher Class Visibility', async ({ page }) => {
  13 |     await page.goto(`${BASE_URL}/dashboard/teacher/my-classes/class-123`);
> 14 |     await expect(page.getByText('Class Roster')).toBeVisible();
     |                                                  ^ Error: expect(locator).toBeVisible() failed
  15 |   });
  16 |
  17 |   test('Parent Installment Plan Interface', async ({ page }) => {
  18 |     await page.goto(`${BASE_URL}/dashboard/parent/payments/installments`);
  19 |     await expect(page.getByText('Installment Plans')).toBeVisible();
  20 |   });
  21 |
  22 |   test('Unified Messaging Hub', async ({ page }) => {
  23 |     await page.goto(`${BASE_URL}/dashboard/admin/communication/messages`);
  24 |     await expect(page.getByText('Messages.')).toBeVisible();
  25 |   });
  26 | });
  27 |
```