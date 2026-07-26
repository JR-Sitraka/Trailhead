import { test, expect, type Page, type Route } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const READY_REPO = '188ab357-e47e-43ba-9e08-f1668e772372';

test('Verify CHAT-10 501-char result', async ({ page }) => {
  await page.goto(`${BASE_URL}/repositories/${READY_REPO}/chat`);
  await page.waitForTimeout(3000);

  let responseStatus: number | null = null;
  await page.route('**/api/repositories/*/chat', async (route: Route) => {
    if (route.request().method() === 'POST') {
      const body = await route.request().postDataJSON();
      if (body.question && body.question.length > 500) {
        await route.fulfill({ status: 400, body: JSON.stringify({ error: 'Question must be at most 500 characters' }) });
        responseStatus = 400;
      } else {
        await route.continue();
      }
    } else {
      await route.continue();
    }
  });

  const input = page.locator('input[aria-label="Ask a follow-up question"]');
  await input.fill('a'.repeat(501));
  await page.click('button[aria-label="Ask"]');

  await page.waitForTimeout(5000);

  const bodyText = await page.locator('body').textContent();
  console.log('Full body text after 501-char:', bodyText);

  const hasFailedState = await page.locator('text=Couldn\'t generate an answer').count();
  const hasNoEvidence = await page.locator('text=No relevant evidence found').count();
  const hasAnswered = await page.locator('.rounded-card.border.border-border-muted').count();
  console.log('Has failed state:', hasFailedState);
  console.log('Has no evidence:', hasNoEvidence);
  console.log('Has answered card:', hasAnswered);
  console.log('Response status:', responseStatus);

  await page.screenshot({ path: 'test-results/chat-10-501char-verify.png', fullPage: true });
});
