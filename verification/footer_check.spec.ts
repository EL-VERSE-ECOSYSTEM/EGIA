import { test, expect } from '@playwright/test';

test('Verify Footer Branding and Admin Link', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  const footer = page.locator('footer');
  await expect(footer).toContainText('built by ELCODERS by E.V.E');
  await expect(footer).toContainText('EL GOODNEWS INT\'L ACADEMY');

  const adminLink = page.locator('footer a:has-text("Staff & Admin Portal")');
  await expect(adminLink).toBeVisible();
  await adminLink.click();
  // It redirects to /auth/signin or /sign-in depending on final build config
  await expect(page).toHaveURL(/.*signin|.*sign-in/);
});
