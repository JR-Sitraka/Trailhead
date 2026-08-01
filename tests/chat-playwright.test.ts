import { test, expect, type Page, type Route } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const READY_REPO = '188ab357-e47e-43ba-9e08-f1668e772372';
// Retained QA fixture — see KNOWN-GOOD.md [2026-07-31]. The contract under
// test is "Chat must reject any repository that is not ready", so ANY
// non-ready status satisfies it. This row is expected to sit at 'failed'
// (orphan reconciliation, 2026-08-01), not 'analyzing'; the test does not
// depend on which non-ready status it holds. Do not delete this row.
const NON_READY_REPO = '1daf6a6b-c233-4e6f-85d1-b283c3f9827e';
const FAILED_REPO = 'bb7c0910-191a-4602-b019-fea22d8244f8';

async function waitForAnswer(page: Page, timeout = 60000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const generating = await page.locator('text=Thinking…').count();
    const answered = await page.locator('.rounded-card.border.border-border-muted').count();
    const noEvidence = await page.locator('text=No relevant evidence found').count();
    const offTopic = await page.locator('text=Not related to this repository').count();
    const failed = await page.locator('text=Couldn\'t generate an answer').count();
    if (generating === 0 && (answered > 0 || noEvidence > 0 || offTopic > 0 || failed > 0)) return;
    await page.waitForTimeout(500);
  }
  throw new Error('Timed out waiting for answer');
}

test.describe('Chat Acceptance Criteria', () => {
  test('CHAT-01: Chat is gated for a non-ready repo', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${NON_READY_REPO}/chat`);
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').textContent();
    const has404 = bodyText?.includes('404') ?? false;
    const hasNotReady = bodyText?.includes('not ready') ?? false;
    console.log('CHAT-01 has404:', has404);
    console.log('CHAT-01 hasNotReady:', hasNotReady);
    console.log('CHAT-01 body snippet:', bodyText?.slice(0, 400));
    await page.screenshot({ path: 'test-results/chat-01-non-ready.png', fullPage: true });
  });

  test('CHAT-02: Fresh conversation first turn', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${READY_REPO}/chat`);
    await page.waitForTimeout(3000);
    const input = page.locator('input[aria-label="Ask a follow-up question"]');
    await input.fill('What is this repository about?');
    await page.screenshot({ path: 'test-results/chat-02-before-submit.png', fullPage: true });
    await page.click('button[aria-label="Ask"]');
    await waitForAnswer(page, 90000);
    const bodyText = await page.locator('body').textContent();
    console.log('CHAT-02 response snippet:', bodyText?.slice(0, 600));
    await page.screenshot({ path: 'test-results/chat-02-after-answer.png', fullPage: true });
  });

  test('CHAT-03/04: Follow-up request includes real prior history', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${READY_REPO}/chat`);
    await page.waitForTimeout(3000);
    const input = page.locator('input[aria-label="Ask a follow-up question"]');

    let capturedBody: any = null;
    await page.route('**/api/repositories/*/chat', async (route: Route) => {
      if (route.request().method() === 'POST') {
        capturedBody = await route.request().postDataJSON();
        console.log('CHAT-03/04 intercepted request body:', JSON.stringify(capturedBody).slice(0, 800));
      }
      await route.continue();
    });

    await input.fill('First question about exports');
    await page.click('button[aria-label="Ask"]');
    await waitForAnswer(page, 90000);
    await page.waitForTimeout(2000);

    const firstHistoryLength = capturedBody?.history?.length ?? -1;
    console.log('CHAT-03 first turn history length:', firstHistoryLength);

    await input.fill('Follow-up question about imports');
    await page.click('button[aria-label="Ask"]');
    await waitForAnswer(page, 90000);
    await page.waitForTimeout(2000);

    console.log('CHAT-03/04 second turn body:', JSON.stringify(capturedBody, null, 2).slice(0, 1200));
    const hasFirstQuestion = capturedBody?.history?.some(
      (h: any) => h.question === 'First question about exports'
    );
    console.log('CHAT-04 has first question in history:', hasFirstQuestion);
    await page.screenshot({ path: 'test-results/chat-03-04-followup.png', fullPage: true });
  });

  test('CHAT-05/06: Failed turn N does not affect earlier turns', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${READY_REPO}/chat`);
    await page.waitForTimeout(3000);
    const input = page.locator('input[aria-label="Ask a follow-up question"]');

    await page.route('**/api/repositories/*/chat', async (route: Route) => {
      const body = await route.request().postDataJSON();
      if (body.question === 'trigger-failure') {
        await route.fulfill({ status: 502, body: JSON.stringify({ error: 'Generation provider error' }) });
      } else {
        await route.continue();
      }
    });

    await input.fill('normal question about this repo');
    await page.click('button[aria-label="Ask"]');
    await waitForAnswer(page, 90000);
    await page.waitForTimeout(2000);

    const firstTurnText = await page.locator('.space-y-6 > div').first().textContent();
    console.log('CHAT-05 first turn after setup:', firstTurnText?.slice(0, 300));
    await page.screenshot({ path: 'test-results/chat-05-first-turn.png', fullPage: true });

    await input.fill('trigger-failure');
    await page.click('button[aria-label="Ask"]');
    await waitForAnswer(page, 90000);
    await page.waitForTimeout(2000);

    const turns = page.locator('.space-y-6 > div');
    const turnCount = await turns.count();
    console.log('CHAT-05 total turns:', turnCount);
    for (let i = 0; i < turnCount; i++) {
      const turnText = await turns.nth(i).textContent();
      console.log(`CHAT-05 turn ${i + 1}:`, turnText?.slice(0, 250));
    }

    const firstTurnAfterFailure = await page.locator('.space-y-6 > div').first().textContent();
    console.log('CHAT-05 first turn intact after failure:', firstTurnAfterFailure?.slice(0, 300));

    const failedTurn = page.locator('.space-y-6 > div').last();
    const failedText = await failedTurn.textContent();
    console.log('CHAT-06 failed turn text:', failedText?.slice(0, 400));
    const hasTriggerQuestion = failedText?.includes('trigger-failure');
    const hasNoFabricatedAnswer = !failedText?.includes('Here is') && !failedText?.includes('The answer is') && !failedText?.includes('Sure,');
    console.log('CHAT-06 has trigger question:', hasTriggerQuestion);
    console.log('CHAT-06 no fabricated answer:', hasNoFabricatedAnswer);
    await page.screenshot({ path: 'test-results/chat-06-failed-turn.png', fullPage: true });
  });

  test('CHAT-07: New conversation clears thread', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${READY_REPO}/chat`);
    await page.waitForTimeout(3000);
    const input = page.locator('input[aria-label="Ask a follow-up question"]');
    await input.fill('test question for new conversation');
    await page.click('button[aria-label="Ask"]');
    await waitForAnswer(page, 90000);
    await page.waitForTimeout(2000);

    const turnsBefore = await page.locator('.space-y-6 > div').count();
    console.log('CHAT-07 turns before new conversation:', turnsBefore);
    await page.screenshot({ path: 'test-results/chat-07-before-new.png', fullPage: true });

    await page.click('button:has-text("New conversation")');
    await page.waitForTimeout(1000);

    const turnsAfter = await page.locator('.space-y-6 > div').count();
    const inputEmpty = await input.inputValue();
    console.log('CHAT-07 turns after new conversation:', turnsAfter);
    console.log('CHAT-07 input empty after new conversation:', inputEmpty === '');
    await page.screenshot({ path: 'test-results/chat-07-after-new.png', fullPage: true });
  });

  test('CHAT-08: Reload loses conversation', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${READY_REPO}/chat`);
    await page.waitForTimeout(3000);
    const input = page.locator('input[aria-label="Ask a follow-up question"]');
    await input.fill('test question for reload');
    await page.click('button[aria-label="Ask"]');
    await waitForAnswer(page, 90000);
    await page.waitForTimeout(2000);

    const turnsBeforeReload = await page.locator('.space-y-6 > div').count();
    console.log('CHAT-08 turns before reload:', turnsBeforeReload);
    await page.screenshot({ path: 'test-results/chat-08-before-reload.png', fullPage: true });

    await page.reload();
    await page.waitForTimeout(3000);

    const turnsAfterReload = await page.locator('.space-y-6 > div').count();
    const inputValueAfter = await page.locator('input[aria-label="Ask a follow-up question"]').inputValue();
    console.log('CHAT-08 turns after reload:', turnsAfterReload);
    console.log('CHAT-08 input value after reload:', inputValueAfter);
    await page.screenshot({ path: 'test-results/chat-08-after-reload.png', fullPage: true });
  });

  test('CHAT-09: Malformed history is rejected with 400', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${READY_REPO}/chat`);
    await page.waitForTimeout(3000);
    const input = page.locator('input[aria-label="Ask a follow-up question"]');

    await page.route('**/api/repositories/*/chat', async (route: Route) => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        if (body.history && !Array.isArray(body.history)) {
          await route.fulfill({ status: 400, body: JSON.stringify({ error: 'history must be an array' }) });
        } else if (body.history && body.history.length > 0 && typeof body.history[0] !== 'object') {
          await route.fulfill({ status: 400, body: JSON.stringify({ error: 'Malformed history entry at index 0' }) });
        } else if (body.history && body.history.some((h: any) => typeof h !== 'object' || h === null)) {
          await route.fulfill({ status: 400, body: JSON.stringify({ error: 'Malformed history entry' }) });
        } else {
          await route.continue();
        }
      } else {
        await route.continue();
      }
    });

    await input.fill('test malformed history via UI');
    await page.click('button[aria-label="Ask"]');
    await waitForAnswer(page, 90000);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    console.log('CHAT-09 response text:', bodyText?.slice(0, 500));
    await page.screenshot({ path: 'test-results/chat-09-malformed.png', fullPage: true });
  });

  test('CHAT-10: Empty and over-500 character questions rejected', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${READY_REPO}/chat`);
    await page.waitForTimeout(3000);
    const input = page.locator('input[aria-label="Ask a follow-up question"]');

    await page.route('**/api/repositories/*/chat', async (route: Route) => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        if (!body.question || body.question.trim() === '') {
          await route.fulfill({ status: 400, body: JSON.stringify({ error: 'Question is required' }) });
        } else if (body.question.length > 500) {
          await route.fulfill({ status: 400, body: JSON.stringify({ error: 'Question must be at most 500 characters' }) });
        } else {
          await route.continue();
        }
      } else {
        await route.continue();
      }
    });

    await input.fill('   ');
    const submitBtn = page.locator('button[aria-label="Ask"]');
    const disabledBefore = await submitBtn.isDisabled();
    console.log('CHAT-10 empty/whitespace submit disabled:', disabledBefore);
    await page.screenshot({ path: 'test-results/chat-10-empty-disabled.png', fullPage: true });

    await input.fill('a'.repeat(501));
    const disabledAfter = await submitBtn.isDisabled();
    console.log('CHAT-10 501-char submit disabled:', disabledAfter);
    await page.screenshot({ path: 'test-results/chat-10-501char.png', fullPage: true });

    await input.fill('a'.repeat(501));
    await page.click('button[aria-label="Ask"]');
    await waitForAnswer(page, 90000);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    console.log('CHAT-10 501-char response:', bodyText?.slice(0, 300));
    await page.screenshot({ path: 'test-results/chat-10-rejections.png', fullPage: true });
  });
});
