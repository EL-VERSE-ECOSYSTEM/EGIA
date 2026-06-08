import { test, expect } from '@playwright/test';

test('verify teacher and admin dashboards', async ({ page }) => {
  // Check Teacher Dashboard
  await page.goto('http://localhost:3000/dashboard/teacher');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verification/teacher_dashboard.png', fullPage: true });

  // Check Admin Dashboard
  await page.goto('http://localhost:3000/dashboard/admin');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verification/admin_dashboard.png', fullPage: true });

  // Check Assessment Creation Page (Teacher)
  await page.goto('http://localhost:3000/dashboard/teacher/assessments/create');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verification/teacher_create_assessment.png', fullPage: true });
});
