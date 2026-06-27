import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('EL GOODNEWS - Comprehensive Feature Verification', () => {

  test('Promotion Engine Interface Load', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/admin/users/students/promotions`);
    await expect(page.getByText('Class Promotion')).toBeVisible();
  });

  test('Teacher Class Visibility', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/teacher/my-classes/class-123`);
    await expect(page.getByText('Class Roster')).toBeVisible();
  });

  test('Parent Installment Plan Interface', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/parent/payments/installments`);
    await expect(page.getByText('Installment Plans')).toBeVisible();
  });

  test('Unified Messaging Hub', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/admin/communication/messages`);
    await expect(page.getByText('Messages.')).toBeVisible();
  });
});
