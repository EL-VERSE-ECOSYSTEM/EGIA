import { test, expect } from '@playwright/test';

test('verify CSV and manual typing assessment creation portals', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard/teacher/assessments/create');
  await page.waitForTimeout(1000);

  const createBody = await page.textContent('body');
  expect(createBody).toContain('CSV Template Import');
  expect(createBody).toContain('Manual Entry / Typing');

  // Verify CSV import portal
  await page.goto('http://localhost:3000/dashboard/teacher/assessments/create/csv');
  await page.waitForTimeout(1000);
  const csvBody = await page.textContent('body');
  expect(csvBody).toContain('Bulk CSV Import');

  // Verify Manual typing portal
  await page.goto('http://localhost:3000/dashboard/teacher/assessments/create/text');
  await page.waitForTimeout(1000);
  const textBody = await page.textContent('body');
  expect(textBody).toContain('Manual Question Entry');
});
