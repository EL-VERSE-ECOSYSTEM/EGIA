import { test, expect } from '@playwright/test';
const fs = require('fs');

test.use({ userAgent: 'Mozilla/5.0 Playwright HeadlessChrome' });

test('verify AI PDF parsing simulation', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard/teacher/assessments/create/pdf');
  await page.waitForTimeout(2000);

  // Take screenshot of empty state
  await page.screenshot({ path: 'verification/ai_pdf_empty.png', fullPage: true });

  // Create a dummy file
  fs.writeFileSync('dummy.pdf', 'fake pdf content');

  // Find the file input and set it
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles('dummy.pdf');

  // Wait for results - using a longer timeout and checking for the text
  console.log('Waiting for results...');
  await page.waitForTimeout(10000); // 10 seconds should be enough for 3s delay + overhead

  await page.screenshot({ path: 'verification/ai_pdf_results.png', fullPage: true });

  const content = await page.textContent('body');
  if (content?.includes('Extracted 5 Questions')) {
    console.log('SUCCESS: Questions extracted');
  } else {
    console.log('FAILURE: Questions NOT extracted. Body content length: ' + content?.length);
  }
});
