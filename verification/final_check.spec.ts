import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('EL GOODNEWS - Final Integrated Verification', () => {

  test('Dashboard Redirect Logic', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard-redirect`);
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test('Institutional Landing Visibility', async ({ page }) => {
    await page.goto(BASE_URL);
    // Use getByRole for the footer logo or similar unique element
    await expect(page.getByText('built by ELCODERS by E.V.E').first()).toBeVisible();
  });

  test('Public Admissions Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admissions`);
    await expect(page.getByText('2026/2027 Academic Session')).toBeVisible();
  });

  test('Support Ticket Interface Access', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/student/communication/support`);
    // Should redirect to signin if not auth
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });
});
