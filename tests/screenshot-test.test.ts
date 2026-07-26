import { test } from '@playwright/test';

test('screenshot test', async ({ page }) => {
  await page.goto('http://localhost:3000/repositories/188ab357-e47e-43ba-9e08-f1668e772372/chat');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/screenshot-test.png', fullPage: true });
  console.log('Screenshot saved to test-results/screenshot-test.png');
});
