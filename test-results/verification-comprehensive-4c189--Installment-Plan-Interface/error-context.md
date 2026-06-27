# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: verification/comprehensive_features.spec.ts >> EL GOODNEWS - Comprehensive Feature Verification >> Parent Installment Plan Interface
- Location: verification/comprehensive_features.spec.ts:17:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Installment Plans')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Installment Plans')

```

```yaml
- complementary:
  - heading "EL GOODNEWS" [level=2]
  - paragraph: ACADEMY
  - navigation:
    - link "Dashboard":
      - /url: /dashboard/parent/overview
    - link "My Children":
      - /url: /dashboard/parent/children/list
    - link "Payments":
      - /url: /dashboard/parent/payments/history
    - link "Communication":
      - /url: /dashboard/parent/communication
    - link "Settings":
      - /url: /dashboard/parent/settings/profile
  - text: P
  - paragraph: parent User
  - paragraph: EL GOODNEWS
  - button "SIGN OUT"
- banner:
  - heading "Dashboard / parent" [level=1]
  - button
  - paragraph: Admin Account
  - paragraph: School Board
- main:
  - heading "Installments" [level=1]
  - paragraph: Welcome to the Installments page. This is a placeholder for the parent dashboard.
  - text: Content for Installments will be implemented here.
- alert
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
  14 |     await expect(page.getByText('Class Roster')).toBeVisible();
  15 |   });
  16 |
  17 |   test('Parent Installment Plan Interface', async ({ page }) => {
  18 |     await page.goto(`${BASE_URL}/dashboard/parent/payments/installments`);
> 19 |     await expect(page.getByText('Installment Plans')).toBeVisible();
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  20 |   });
  21 |
  22 |   test('Unified Messaging Hub', async ({ page }) => {
  23 |     await page.goto(`${BASE_URL}/dashboard/admin/communication/messages`);
  24 |     await expect(page.getByText('Messages.')).toBeVisible();
  25 |   });
  26 | });
  27 |
```