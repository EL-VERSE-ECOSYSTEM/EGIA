import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('EL GOODNEWS - Final Integrated Verification', () => {
  // Use a standard browser user agent to avoid triggering the automated testing bypass rules,
  // thereby verifying the actual middleware redirection behavior correctly.
  test.use({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });

  test('Dashboard Redirect Logic', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard-redirect`);
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test('Institutional Landing Visibility', async ({ page }) => {
    await page.goto(BASE_URL);
    // Use getByRole for the footer logo or similar unique element
    await expect(page.getByText('EL CODERS BY EL VERSE ECOSYSTEM').first()).toBeVisible();
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
