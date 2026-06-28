import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('EL GOODNEWS - Final Requirement Verification', () => {

  test('Academic Session 2026/2027 in Admissions', async ({ page }) => {
    await page.goto(`${BASE_URL}/admissions`);
    await expect(page.getByText('2026/2027')).toBeVisible();
  });

  test('Teacher Enrollment with Documents', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/admin/users/teachers/add`);
    await expect(page.getByText('Institutional Staff Enrollment')).toBeVisible();
    await expect(page.getByText('Application Letter URL')).toBeVisible();
    await expect(page.getByText('Curriculum Vitae (CV) URL')).toBeVisible();
  });

  test('Fees Structure with Departments', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/admin/finance/fees/structure`);
    await expect(page.getByText('Financial Architecture')).toBeVisible();
    await expect(page.getByText('Department (Optional)')).toBeVisible();
  });

  test('Messaging Interface Stability', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/admin/communication/messages`);
    await expect(page.getByText('Messages.')).toBeVisible();
  });
});
