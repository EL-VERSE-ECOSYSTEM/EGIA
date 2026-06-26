# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: verification/comprehensive_features.spec.ts >> EL GOODNEWS - Comprehensive Feature Verification >> Admin Signup Default Security
- Location: verification/comprehensive_features.spec.ts:40:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/auth/signin", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test.describe('EL GOODNEWS - Comprehensive Feature Verification', () => {
  4  |
  5  |   test('Promotion Engine Interface Load', async ({ page }) => {
  6  |     // We'll use a mock login or direct navigation if possible for verification
  7  |     await page.goto('/dashboard/admin/users/students/promotions');
  8  |     await expect(page.getByText('Class Promotion')).toBeVisible();
  9  |     await expect(page.getByText('Promotion Control')).toBeVisible();
  10 |     await expect(page.getByText('PROMOTION CRITERIA NOTICE')).toBeVisible();
  11 |   });
  12 |
  13 |   test('Teacher Class Visibility & Student Profile', async ({ page }) => {
  14 |     await page.goto('/dashboard/teacher/my-classes/class-123'); // Mock class ID
  15 |     await expect(page.getByText('Class Roster')).toBeVisible();
  16 |     await expect(page.getByText('Academic Status')).toBeVisible();
  17 |
  18 |     // Check student profile visibility
  19 |     await page.goto('/dashboard/teacher/my-classes/student/student-456');
  20 |     await expect(page.getByText('Guardian Contact')).toBeVisible();
  21 |     await expect(page.getByText('Academic Performance')).toBeVisible();
  22 |     await expect(page.getByText('Term Assessment History')).toBeVisible();
  23 |   });
  24 |
  25 |   test('Parent Installment Plan Interface', async ({ page }) => {
  26 |     await page.goto('/dashboard/parent/payments/installments');
  27 |     await expect(page.getByText('Installment Plans')).toBeVisible();
  28 |     await expect(page.getByText('Next Due Date')).toBeVisible();
  29 |   });
  30 |
  31 |   test('Unified Messaging Hub Across Roles', async ({ page }) => {
  32 |     const roles = ['admin', 'teacher', 'parent', 'student'];
  33 |     for (const role of roles) {
  34 |       await page.goto(`/dashboard/${role}/communication/messages`);
  35 |       await expect(page.getByText('Messages.')).toBeVisible();
  36 |       await expect(page.getByPlaceholder('Search conversations...')).toBeVisible();
  37 |     }
  38 |   });
  39 |
  40 |   test('Admin Signup Default Security', async ({ page }) => {
> 41 |     await page.goto('/auth/signin');
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  42 |     await page.fill('input[type="email"]', 'admin@elgoodnews.edu.ng');
  43 |     await page.fill('input[type="password"]', 'GOODNEWS123@');
  44 |     // We expect it to at least attempt login with these credentials
  45 |     // Note: Actual DB might not have the user yet in CI
  46 |   });
  47 | });
  48 |
```