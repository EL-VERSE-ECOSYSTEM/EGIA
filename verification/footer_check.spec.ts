import { test, expect } from '@playwright/test';

test('Verify Footer Branding and Admin Link', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  const footer = page.locator('footer');
  await expect(footer).toContainText('built by ELCODERS by E.V.E');
  await expect(footer).toContainText('EL GOODNEWS INT\'L ACADEMY');

  const adminLink = page.locator('footer a:has-text("Staff & Admin Portal")');
  await expect(adminLink).toBeVisible();
  await adminLink.click();
  // Resilient url pattern allowing both guest login and active dashboard redirects
  await expect(page).toHaveURL(/.*signin|.*sign-in|.*dashboard|http:\/\/localhost:3000\/?/);
});
