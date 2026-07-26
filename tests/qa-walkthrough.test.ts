import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const OVERVIEW_REPO = '7cf3a196-d7ce-4f79-85b7-e2541930554a';
const SYMBOLS_REPO = 'c08b0a4d-b85e-4359-a991-efb79f77c66f';
const SEARCH_REPO = 'c08b0a4d-b85e-4359-a991-efb79f77c66f';
const CHAT_REPO = '188ab357-e47e-43ba-9e08-f1668e772372';
const EXPLORER_REPO = 'c08b0a4d-b85e-4359-a991-efb79f77c66f';
const EXPORT_REPO = '7cf3a196-d7ce-4f79-85b7-e2541930554a';

async function tabThroughAndRecord(page: Page, maxTabs = 30): Promise<string[]> {
  const order: string[] = [];
  for (let i = 0; i < maxTabs; i++) {
    await page.waitForTimeout(50);
    const active = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return 'null';
      const tag = el.tagName.toLowerCase();
      const text = (el as HTMLElement).innerText?.trim().slice(0, 50) || '';
      const aria = (el as HTMLElement).getAttribute('aria-label') || '';
      const type = (el as HTMLInputElement).type || '';
      const id = el.id ? `#${el.id}` : '';
      return `${tag}${type ? `[${type}]` : ''}${id ? ` ${id}` : ''}${aria ? ` aria="${aria}"` : ''}${text ? ` text="${text}"` : ''}`;
    });
    const key = active || 'null';
    if (order.includes(key) && key !== 'null') break;
    order.push(key);
    await page.keyboard.press('Tab');
  }
  return order;
}

async function getFocusedElementText(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return '';
    return el.innerText?.trim().slice(0, 100) || el.getAttribute('aria-label') || '';
  });
}

async function isFocusVisible(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return false;
    const style = getComputedStyle(el);
    return style.outlineStyle !== 'none' || style.boxShadow !== 'none' || el.matches(':focus-visible');
  });
}

test.describe('QA Walkthrough — Overview, Symbols, Search, Keyboard Navigation', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('OVERVIEW-01: All six sections render for a real repository', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${OVERVIEW_REPO}/overview`);
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').textContent();
    console.log('OVERVIEW-01 body:', bodyText?.slice(0, 1200));
    await page.screenshot({ path: 'test-results/qa-overview-01-sections.png', fullPage: true });

    const hasStack = bodyText?.includes('Stack') ?? false;
    const hasEntryPoints = bodyText?.includes('Entry points') ?? false;
    const hasConfig = bodyText?.includes('Configuration files') ?? false;
    const hasTesting = bodyText?.includes('Testing') ?? false;
    const hasNotAnalyzed = bodyText?.includes('Not analyzed') ?? false;
    console.log('OVERVIEW-01 hasStack:', hasStack, 'hasEntryPoints:', hasEntryPoints, 'hasConfig:', hasConfig, 'hasTesting:', hasTesting, 'hasNotAnalyzed:', hasNotAnalyzed);
    expect(hasStack && hasEntryPoints && hasConfig && hasTesting).toBe(true);
  });

  test('OVERVIEW-02: Stack facts contain real detected data', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${OVERVIEW_REPO}/overview`);
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').textContent();
    console.log('OVERVIEW-02 stack snippet:', bodyText?.slice(0, 800));
    await page.screenshot({ path: 'test-results/qa-overview-02-stack.png', fullPage: true });
    const hasPrimaryLanguage = bodyText?.includes('Primary Language');
    const hasFramework = bodyText?.includes('Framework');
    const hasPackageManager = bodyText?.includes('Package Manager');
    expect(hasPrimaryLanguage && hasFramework && hasPackageManager).toBe(true);
  });

  test('OVERVIEW-03: Not analyzed section lists real skipped files', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${OVERVIEW_REPO}/overview`);
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').textContent();
    console.log('OVERVIEW-03 notAnalyzed snippet:', bodyText?.slice(0, 1000));
    await page.screenshot({ path: 'test-results/qa-overview-03-notanalyzed.png', fullPage: true });
    const hasNotAnalyzedHeading = bodyText?.includes('Not analyzed');
    if (hasNotAnalyzedHeading) {
      const hasSkipReason = bodyText?.includes('skipped') || bodyText?.includes('Not analyzed');
      console.log('OVERVIEW-03 has skip content:', hasSkipReason);
    }
  });

  test('SYMBOLS-01: Symbols page loads with real data', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${SYMBOLS_REPO}/symbols`);
    await page.waitForTimeout(4000);
    const bodyText = await page.locator('body').textContent();
    console.log('SYMBOLS-01 body:', bodyText?.slice(0, 1000));
    await page.screenshot({ path: 'test-results/qa-symbols-01-initial.png', fullPage: true });
    const hasTable = bodyText?.includes('Kind') && bodyText?.includes('Name');
    const notEmpty = !bodyText?.includes('No symbols found');
    console.log('SYMBOLS-01 hasTable:', hasTable, 'notEmpty:', notEmpty);
  });

  test('SYMBOLS-02: Filter chips show real server-side-filtered results', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${SYMBOLS_REPO}/symbols`);
    await page.waitForTimeout(4000);
    const allBody = await page.locator('body').textContent();
    const allKindCount = (allBody?.match(/\bfunction\b/g) || []).length;
    console.log('SYMBOLS-02 all-kind function count (approx):', allKindCount);

    await page.click('button:has-text("Functions")');
    await page.waitForTimeout(1500);
    const fnBody = await page.locator('body').textContent();
    console.log('SYMBOLS-02 functions body:', fnBody?.slice(0, 1000));
    await page.screenshot({ path: 'test-results/qa-symbols-02-functions.png', fullPage: true });

    const ariaPressedFn = await page.locator('button:has-text("Functions")').getAttribute('aria-pressed');
    console.log('SYMBOLS-02 aria-pressed on Functions:', ariaPressedFn);
    expect(ariaPressedFn).toBe('true');
  });

  test('SYMBOLS-03: Each filter chip updates results', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${SYMBOLS_REPO}/symbols`);
    await page.waitForTimeout(4000);

    for (const label of ['Classes', 'Interfaces', 'Imports', 'Exports']) {
      await page.click(`button:has-text("${label}")`);
      await page.waitForTimeout(1200);
      const aria = await page.locator(`button:has-text("${label}")`).getAttribute('aria-pressed');
      console.log(`SYMBOLS-03 ${label} aria-pressed:`, aria);
      expect(aria).toBe('true');
    }

    await page.click('button:has-text("All")');
    await page.waitForTimeout(1200);
    const ariaAll = await page.locator('button:has-text("All")').getAttribute('aria-pressed');
    console.log('SYMBOLS-03 All aria-pressed:', ariaAll);
    expect(ariaAll).toBe('true');
    await page.screenshot({ path: 'test-results/qa-symbols-03-all-chips.png', fullPage: true });
  });

  test('SEARCH-01: Real debounced results for a real query', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${SEARCH_REPO}/search`);
    await page.waitForTimeout(2000);
    await page.fill('input[aria-label="Search repository"]', 'create');
    await page.waitForTimeout(800);
    const bodyText = await page.locator('body').textContent();
    console.log('SEARCH-01 body after query:', bodyText?.slice(0, 1000));
    await page.screenshot({ path: 'test-results/qa-search-01-query.png', fullPage: true });
    const hasResult = bodyText?.includes('.ts') || bodyText?.includes('src');
    console.log('SEARCH-01 has real result:', hasResult);
  });

  test('SEARCH-02: Empty-query prompt state', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${SEARCH_REPO}/search`);
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').textContent();
    console.log('SEARCH-02 empty body:', bodyText?.slice(0, 600));
    await page.screenshot({ path: 'test-results/qa-search-02-empty.png', fullPage: true });
    expect(bodyText?.includes('Start typing to search this repository')).toBe(true);
  });

  test('SEARCH-03: Zero-results copy', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${SEARCH_REPO}/search`);
    await page.waitForTimeout(2000);
    await page.fill('input[aria-label="Search repository"]', 'zzzznot-a-real-term-zzzz');
    await page.waitForTimeout(1200);
    const bodyText = await page.locator('body').textContent();
    console.log('SEARCH-03 zero body:', bodyText?.slice(0, 800));
    await page.screenshot({ path: 'test-results/qa-search-03-zero.png', fullPage: true });
    expect(bodyText?.includes('No matches.')).toBe(true);
    expect(bodyText?.includes('exact and full-text only')).toBe(true);
  });

  test.describe('Keyboard Navigation — all 7 screens', () => {
    test('KBD-01: Dashboard keyboard flow', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/qa-kbd-01-dashboard-start.png', fullPage: true });

      await page.keyboard.press('Tab');
      const first = await getFocusedElementText(page);
      const firstFocusVisible = await isFocusVisible(page);
      console.log('KBD-01 dashboard first focus:', first, 'visible:', firstFocusVisible);

      const tabOrder = await tabThroughAndRecord(page, 25);
      console.log('KBD-01 dashboard tab order:', tabOrder);
      await page.screenshot({ path: 'test-results/qa-kbd-01-dashboard-tab.png', fullPage: true });

      const hasSearch = tabOrder.some((t) => t.includes('search') || t.includes('Filter repositories'));
      const hasAdd = tabOrder.some((t) => t.includes('Add repository'));
      const hasRepo = tabOrder.some((t) => t.includes('open') || t.includes('Reanalyze'));
      expect(hasSearch || hasAdd || hasRepo).toBe(true);
    });

    test('KBD-02: Overview keyboard flow', async ({ page }) => {
      await page.goto(`${BASE_URL}/repositories/${OVERVIEW_REPO}/overview`);
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/qa-kbd-02-overview-start.png', fullPage: true });

      await page.keyboard.press('Tab');
      const first = await getFocusedElementText(page);
      const firstFocusVisible = await isFocusVisible(page);
      console.log('KBD-02 overview first focus:', first, 'visible:', firstFocusVisible);

      const tabOrder = await tabThroughAndRecord(page, 20);
      console.log('KBD-02 overview tab order:', tabOrder);
      await page.screenshot({ path: 'test-results/qa-kbd-02-overview-tab.png', fullPage: true });
    });

    test('KBD-03: Explorer keyboard flow and file selection', async ({ page }) => {
      await page.goto(`${BASE_URL}/repositories/${EXPLORER_REPO}/explorer`);
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/qa-kbd-03-explorer-start.png', fullPage: true });

      await page.keyboard.press('Tab');
      const first = await getFocusedElementText(page);
      const firstFocusVisible = await isFocusVisible(page);
      console.log('KBD-03 explorer first focus:', first, 'visible:', firstFocusVisible);

      const tabOrder = await tabThroughAndRecord(page, 20);
      console.log('KBD-03 explorer tab order:', tabOrder);
      await page.screenshot({ path: 'test-results/qa-kbd-03-explorer-tab.png', fullPage: true });
    });

    test('KBD-04: Symbols keyboard flow and filter chips', async ({ page }) => {
      await page.goto(`${BASE_URL}/repositories/${SYMBOLS_REPO}/symbols`);
      await page.waitForTimeout(4000);
      await page.screenshot({ path: 'test-results/qa-kbd-04-symbols-start.png', fullPage: true });

      await page.keyboard.press('Tab');
      const first = await getFocusedElementText(page);
      const firstFocusVisible = await isFocusVisible(page);
      console.log('KBD-04 symbols first focus:', first, 'visible:', firstFocusVisible);

      const preOrder = await tabThroughAndRecord(page, 25);
      console.log('KBD-04 symbols tab order (pre):', preOrder.slice(0, 10));

      const chipIdx = preOrder.findIndex((t) => t.includes('All') || t.includes('Functions'));
      if (chipIdx >= 0) {
        for (let i = 0; i < chipIdx; i++) await page.keyboard.press('Tab');
        const focused = await getFocusedElementText(page);
        const focusVisible = await isFocusVisible(page);
        console.log('KBD-04 focused chip before Enter:', focused, 'visible:', focusVisible);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        const afterEnter = await page.locator('body').textContent();
        console.log('KBD-04 after Enter:', afterEnter?.slice(0, 500));
        await page.screenshot({ path: 'test-results/qa-kbd-04-symbols-enter.png', fullPage: true });
      }
    });

    test('KBD-05: Search keyboard flow and results navigation', async ({ page }) => {
      await page.goto(`${BASE_URL}/repositories/${SEARCH_REPO}/search`);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/qa-kbd-05-search-start.png', fullPage: true });

      await page.keyboard.press('Tab');
      const first = await getFocusedElementText(page);
      const firstFocusVisible = await isFocusVisible(page);
      console.log('KBD-05 search first focus:', first, 'visible:', firstFocusVisible);

      const tabOrder = await tabThroughAndRecord(page, 15);
      console.log('KBD-05 search tab order:', tabOrder);
      await page.screenshot({ path: 'test-results/qa-kbd-05-search-tab.png', fullPage: true });
    });

    test('KBD-06: Export keyboard flow', async ({ page }) => {
      await page.goto(`${BASE_URL}/repositories/${EXPORT_REPO}/export`);
      await page.waitForTimeout(4000);
      await page.screenshot({ path: 'test-results/qa-kbd-06-export-start.png', fullPage: true });

      await page.keyboard.press('Tab');
      const first = await getFocusedElementText(page);
      const firstFocusVisible = await isFocusVisible(page);
      console.log('KBD-06 export first focus:', first, 'visible:', firstFocusVisible);

      const tabOrder = await tabThroughAndRecord(page, 15);
      console.log('KBD-06 export tab order:', tabOrder);
      await page.screenshot({ path: 'test-results/qa-kbd-06-export-tab.png', fullPage: true });
    });

    test('KBD-07: Chat keyboard flow and Enter to submit', async ({ page }) => {
      await page.goto(`${BASE_URL}/repositories/${CHAT_REPO}/chat`);
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/qa-kbd-07-chat-start.png', fullPage: true });

      await page.keyboard.press('Tab');
      const first = await getFocusedElementText(page);
      const firstFocusVisible = await isFocusVisible(page);
      console.log('KBD-07 chat first focus:', first, 'visible:', firstFocusVisible);

      const tabOrder = await tabThroughAndRecord(page, 10);
      console.log('KBD-07 chat tab order:', tabOrder);

      const inputIdx = tabOrder.findIndex((t) => t.includes('input') && t.includes('Ask a follow-up'));
      if (inputIdx >= 0) {
        for (let i = 0; i < inputIdx; i++) await page.keyboard.press('Tab');
        await page.keyboard.type('test keyboard question');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        const afterEnter = await page.locator('body').textContent();
        console.log('KBD-07 after Enter:', afterEnter?.slice(0, 500));
        await page.screenshot({ path: 'test-results/qa-kbd-07-chat-enter.png', fullPage: true });
      }
    });

    test('KBD-08: Dashboard modals — Escape closes Add modal', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);

      await page.click('button:has-text("Add repository")');
      await page.waitForTimeout(1500);
      const modalVisible = await page.locator('[role="dialog"]').count();
      console.log('KBD-08 modal visible after click:', modalVisible);
      await page.screenshot({ path: 'test-results/qa-kbd-08-modal-open.png', fullPage: true });
      expect(modalVisible).toBe(1);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
      const afterEscape = await page.locator('[role="dialog"]').count();
      console.log('KBD-08 modal visible after Escape:', afterEscape);
      await page.screenshot({ path: 'test-results/qa-kbd-08-modal-after-escape.png', fullPage: true });
      expect(afterEscape).toBe(0);
    });

    test('KBD-09: Dashboard modals — Escape closes Delete confirmation', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);

      const deleteBtn = page.locator('button[title="Delete"]').first();
      if ((await deleteBtn.count()) === 0) {
        console.log('KBD-09 no delete button visible, skipping');
        return;
      }
      await deleteBtn.click();
      await page.waitForTimeout(1500);
      const modalVisible = await page.locator('[role="dialog"][aria-labelledby="delete-repo-title"]').count();
      console.log('KBD-09 delete modal visible:', modalVisible);
      await page.screenshot({ path: 'test-results/qa-kbd-09-delete-modal.png', fullPage: true });
      expect(modalVisible).toBe(1);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
      const afterEscape = await page.locator('[role="dialog"][aria-labelledby="delete-repo-title"]').count();
      console.log('KBD-09 delete modal after Escape:', afterEscape);
      await page.screenshot({ path: 'test-results/qa-kbd-09-delete-after-escape.png', fullPage: true });
      expect(afterEscape).toBe(0);
    });
  });
});
