import { test, expect } from '@playwright/test';
const fs = require('fs');

test('verify AI PDF parsing simulation', async ({ page }) => {
  page.on('dialog', dialog => dialog.dismiss());

  await page.route('**/api/teacher/assessments/convert-pdf', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        questions: [
          { id: 'q-1', text: 'What is 2 + 2?', type: 'multiple_choice', options: ['2', '3', '4', '5'], correctAnswer: '4', confidence: 0.98 },
          { id: 'q-2', text: 'Water boils at 100 degrees C.', type: 'true_false', options: ['True', 'False'], correctAnswer: 'True', confidence: 0.95 },
          { id: 'q-3', text: 'Capital of France is Paris.', type: 'fill_in_the_gap', correctAnswer: 'Paris', confidence: 0.92 },
          { id: 'q-4', text: 'Primary color among these is Blue.', type: 'multiple_choice', options: ['Green', 'Blue', 'Orange', 'Purple'], correctAnswer: 'Blue', confidence: 0.96 },
          { id: 'q-5', text: 'The sun rises in the East.', type: 'true_false', options: ['True', 'False'], correctAnswer: 'True', confidence: 0.99 }
        ]
      })
    });
  });

  await page.goto('http://localhost:3000/dashboard/teacher');
  await page.waitForTimeout(1000);
  await page.goto('http://localhost:3000/dashboard/teacher/assessments/create/pdf');
  await page.waitForTimeout(2000);

  console.log('Current URL:', page.url());
  const bodyText = await page.textContent('body');
  console.log('Body Text:', bodyText);

  // Take screenshot of empty state
  await page.screenshot({ path: 'verification/ai_pdf_empty.png', fullPage: true });

  // Create a dummy file
  fs.writeFileSync('dummy.pdf', 'fake pdf content');

  // Wait for file input to be attached in DOM
  await page.waitForSelector('input#pdf-upload', { state: 'attached', timeout: 10000 });
  const fileInput = await page.locator('input#pdf-upload');
  await fileInput.setInputFiles('dummy.pdf');

  // Wait for results - using a longer timeout and checking for the text
  console.log('Waiting for results...');
  await page.waitForTimeout(10000); // 10 seconds should be enough for 3s delay + overhead

  await page.screenshot({ path: 'verification/ai_pdf_results.png', fullPage: true });

  const content = await page.textContent('body');
  expect(content).toContain('Extracted 5 Questions');
  console.log('SUCCESS: Questions extracted');
});
