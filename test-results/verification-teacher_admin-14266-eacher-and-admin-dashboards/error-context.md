# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: verification/teacher_admin_verify.spec.ts >> verify teacher and admin dashboards
- Location: verification/teacher_admin_verify.spec.ts:3:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/dashboard/teacher", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('verify teacher and admin dashboards', async ({ page }) => {
  4  |   // Check Teacher Dashboard
> 5  |   await page.goto('http://localhost:3000/dashboard/teacher');
     |              ^ Error: page.goto: Test timeout of 30000ms exceeded.
  6  |   await page.waitForTimeout(2000);
  7  |   await page.screenshot({ path: 'verification/teacher_dashboard.png', fullPage: true });
  8  |
  9  |   // Check Admin Dashboard
  10 |   await page.goto('http://localhost:3000/dashboard/admin');
  11 |   await page.waitForTimeout(2000);
  12 |   await page.screenshot({ path: 'verification/admin_dashboard.png', fullPage: true });
  13 |
  14 |   // Check Assessment Creation Page (Teacher)
  15 |   await page.goto('http://localhost:3000/dashboard/teacher/assessments/create');
  16 |   await page.waitForTimeout(2000);
  17 |   await page.screenshot({ path: 'verification/teacher_create_assessment.png', fullPage: true });
  18 | });
  19 |
```