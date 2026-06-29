import { test, expect } from '@playwright/test';

test('Verify Admin Login Page and Redirect', async ({ page }) => {
  await page.goto('http://localhost:3000/admin-login');

  await expect(page.locator('text=EGIA Administrator Portal')).toBeVisible();

  await page.fill('input[id="email"]', 'admin@egia.com');
  await page.fill('input[id="password"]', 'WRONG_PASSWORD');
  await page.click('button:has-text("AUTHORIZE")');

  await expect(page.locator('text=Invalid login credentials')).toBeVisible();
});
