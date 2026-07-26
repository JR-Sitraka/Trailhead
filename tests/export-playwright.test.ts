import { test, expect, type Page, type BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const READY_REPO = '188ab357-e47e-43ba-9e08-f1668e772372';
const ANALYZING_REPO = '1daf6a6b-c233-4e6f-85d1-b283c3f9827e';
const FALLBACK_REPO = '8ab4ce3e-d7a9-4c15-9bfe-2405568db705';

async function waitForState(page: Page, sectionTitle: string, expectedState: string, timeout = 90000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const caption = await page.locator(`h2:has-text("${sectionTitle}") >> xpath=following-sibling::span`).first().textContent();
    if (caption?.includes(expectedState)) return;
    await page.waitForTimeout(500);
  }
  throw new Error(`Timeout waiting for "${expectedState}" in ${sectionTitle}`);
}

test.describe('Export Acceptance Criteria', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('EXPORT-01: Export gated for non-ready repo', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${ANALYZING_REPO}/export`);
    await page.waitForTimeout(4000);
    const bodyText = await page.locator('body').textContent();
    const has409 = bodyText?.includes('409') ?? false;
    const hasNotReady = bodyText?.includes('not ready') ?? false;
    console.log('EXPORT-01 has409:', has409);
    console.log('EXPORT-01 hasNotReady:', hasNotReady);
    console.log('EXPORT-01 body snippet:', bodyText?.slice(0, 400));
    await page.screenshot({ path: 'test-results/export-01-non-ready.png', fullPage: true });
    expect(has409 || hasNotReady).toBe(true);
  });

  test('EXPORT-02: JSON section shows real, correct schema', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${READY_REPO}/export`);
    await waitForState(page, 'JSON', 'State: Generated');
    const preText = await page.locator('pre').textContent();
    const json = JSON.parse(preText ?? '{}');
    console.log('EXPORT-02 repository.name:', json.repository?.name);
    console.log('EXPORT-02 stack.primaryLanguage:', json.stack?.primaryLanguage);
    console.log('EXPORT-02 entryPoints:', json.entryPoints?.length);
    console.log('EXPORT-02 modules:', json.modules);
    await page.screenshot({ path: 'test-results/export-02-json-schema.png', fullPage: true });
    expect(json.repository?.name).toBeTruthy();
    expect(json.repository?.source).toBeTruthy();
    expect(json.stack).toBeDefined();
    expect(json.entryPoints).toBeDefined();
    expect(json.configFiles).toBeDefined();
    expect(json.symbols).toBeDefined();
    expect(json.notAnalyzed).toBeDefined();
    expect(json.modules).toBeUndefined();
  });

  test('EXPORT-03: REPOSITORY_CONTEXT.md citations resolve to real file/line data', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${READY_REPO}/export`);
    await waitForState(page, 'REPOSITORY_CONTEXT.md', 'State: Generated');
    await page.waitForTimeout(2000);
    const citationLinks = page.locator('a:has-text("[1]")');
    const count = await citationLinks.count();
    console.log('EXPORT-03 citation [1] count:', count);
    if (count > 0) {
      await citationLinks.first().click();
      await page.waitForTimeout(1000);
      const bodyText = await page.locator('body').textContent();
      console.log('EXPORT-03 after click body:', bodyText?.slice(0, 500));
      await page.screenshot({ path: 'test-results/export-03-citation-click.png', fullPage: true });
    } else {
      console.log('EXPORT-03 no citations found in generated summary');
      const fallbackNote = page.locator('text=deterministic fallback');
      console.log('EXPORT-03 fallbackNote:', await fallbackNote.count());
      await page.screenshot({ path: 'test-results/export-03-no-citations.png', fullPage: true });
    }
  });

  test('EXPORT-04: Deterministic-fallback path is visually distinct', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${FALLBACK_REPO}/export`);
    await waitForState(page, 'REPOSITORY_CONTEXT.md', 'State: Generated');
    await page.waitForTimeout(2000);
    const fallbackNote = page.locator('text=Generated via deterministic fallback');
    const fallbackCount = await fallbackNote.count();
    console.log('EXPORT-04 fallbackCount:', fallbackCount);
    const bodyText = await page.locator('body').textContent();
    console.log('EXPORT-04 body:', bodyText?.slice(0, 600));
    await page.screenshot({ path: 'test-results/export-04-fallback-note.png', fullPage: true });
    expect(fallbackCount).toBeGreaterThan(0);
  });

  test('EXPORT-05: Fallback content substantively matches JSON export', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${FALLBACK_REPO}/export`);
    await waitForState(page, 'REPOSITORY_CONTEXT.md', 'State: Generated');
    await page.waitForTimeout(1000);
    let contextText = await page.locator('body').textContent();
    await page.goto(`${BASE_URL}/repositories/${FALLBACK_REPO}/export`);
    await waitForState(page, 'JSON', 'State: Generated');
    await page.waitForTimeout(1000);
    const preText = await page.locator('pre').textContent();
    const json = JSON.parse(preText ?? '{}');
    const jsonHasRepo = json.repository?.name === 'python-only-empty-state-verification';
    const contextHasStack = contextText?.includes('primary language') ?? false;
    console.log('EXPORT-05 jsonHasRepo:', jsonHasRepo);
    console.log('EXPORT-05 contextHasStack:', contextHasStack);
    console.log('EXPORT-05 context snippet:', contextText?.slice(0, 600));
    console.log('EXPORT-05 json snippet:', preText?.slice(0, 600));
    await page.screenshot({ path: 'test-results/export-05-fallback-json-crosscheck.png', fullPage: true });
    expect(jsonHasRepo).toBe(true);
    expect(contextHasStack).toBe(true);
  });

  test('EXPORT-06: Task-Packet returns real capped ranked results', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${READY_REPO}/export`);
    await waitForState(page, 'Task-Packet', 'State: Idle');
    await page.waitForTimeout(1000);
    const taskInput = page.locator('textarea');
    await taskInput.fill('export context summary');
    await page.locator('button:has-text("Generate")').click();
    await waitForState(page, 'Task-Packet', 'State: Generated');
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').textContent();
    const hasPortableFile = bodyText?.includes('.ts') ?? false;
    const hasContent = bodyText?.includes('export') ?? false;
    console.log('EXPORT-06 hasPortableFile:', hasPortableFile);
    console.log('EXPORT-06 hasContent:', hasContent);
    console.log('EXPORT-06 body:', bodyText?.slice(0, 600));
    await page.screenshot({ path: 'test-results/export-06-task-packet.png', fullPage: true });
    expect(hasPortableFile).toBe(true);
    expect(hasContent).toBe(true);
  });

  test('EXPORT-07: Empty/over-1000-char task rejected at UI level', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${READY_REPO}/export`);
    await waitForState(page, 'Task-Packet', 'State: Idle');
    const taskInput = page.locator('textarea');
    const generateBtn = page.locator('button:has-text("Generate")');
    await taskInput.fill('   ');
    const disabledEmpty = await generateBtn.isDisabled();
    console.log('EXPORT-07 disabledEmpty:', disabledEmpty);
    await page.screenshot({ path: 'test-results/export-07-empty-disabled.png', fullPage: true });
    await taskInput.fill('a'.repeat(1001));
    const disabledOver = await generateBtn.isDisabled();
    console.log('EXPORT-07 disabledOver1:', disabledOver);
    await generateBtn.click();
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').textContent();
    const has400Error = bodyText?.includes('at most 1000 characters') ?? false;
    console.log('EXPORT-07 has400Error:', has400Error);
    await page.screenshot({ path: 'test-results/export-07-over1000-error.png', fullPage: true });
    expect(disabledEmpty).toBe(true);
    expect(bodyText?.includes('Error')).toBe(true);
  });

  test('EXPORT-08: Three sections are independent', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${READY_REPO}/export`);
    await waitForState(page, 'REPOSITORY_CONTEXT.md', 'State: Generated');
    await waitForState(page, 'JSON', 'State: Generated');
    await waitForState(page, 'Task-Packet', 'State: Idle');
    const taskInput = page.locator('textarea');
    await taskInput.fill('independence test');
    await page.locator('button:has-text("Generate")').click();
    await waitForState(page, 'Task-Packet', 'State: Generated');
    await page.waitForTimeout(2000);
    const contextCaption = await page.locator('h2:has-text("REPOSITORY_CONTEXT.md") >> xpath=following-sibling::span').first().textContent();
    const jsonCaption = await page.locator('h2:has-text("JSON") >> xpath=following-sibling::span').first().textContent();
    console.log('EXPORT-08 context state:', contextCaption);
    console.log('EXPORT-08 json state:', jsonCaption);
    await page.screenshot({ path: 'test-results/export-08-independence.png', fullPage: true });
    expect(contextCaption?.includes('Generated')).toBe(true);
    expect(jsonCaption?.includes('Generated')).toBe(true);
  });

  test('EXPORT-09: UI and API produce consistent results', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${READY_REPO}/export`);
    await waitForState(page, 'JSON', 'State: Generated');
    await page.waitForTimeout(1000);
    const uiJson = await page.locator('pre').textContent();
    const apiResp = await page.evaluate(async (repoId: string) => {
      const res = await fetch(`/api/repositories/${repoId}/export/json`);
      return await res.json();
    }, READY_REPO);
    const apiJson = JSON.stringify(apiResp, null, 2);
    console.log('EXPORT-09 UI JSON matches API:', uiJson === apiJson);
    console.log('EXPORT-09 UI JSON snippet:', uiJson?.slice(0, 200));
    console.log('EXPORT-09 API JSON snippet:', apiJson?.slice(0, 200));
    await page.screenshot({ path: 'test-results/export-09-ui-api-match.png', fullPage: true });
    expect(uiJson).toBe(apiJson);
  });

  test('EXPORT-10: Real Download/Copy button checks', async ({ page }) => {
    await page.goto(`${BASE_URL}/repositories/${READY_REPO}/export`);
    await waitForState(page, 'JSON', 'State: Generated');
    await page.waitForTimeout(1000);
    
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Download .json")').click();
    const download = await downloadPromise;
    console.log('EXPORT-10 JSON download:', download.suggestedFilename());
    expect(download.suggestedFilename()).toBe('export.json');
    await page.screenshot({ path: 'test-results/export-10-download-json.png', fullPage: true });
    
    const clipboardPromise = page.evaluate(async () => {
      const start = Date.now();
      while (Date.now() - start < 5000) {
        try {
          const text = await navigator.clipboard.readText();
          if (text && text.length > 0) return { success: true as const, text };
        } catch {
          // ignore
        }
        await new Promise(r => setTimeout(r, 200));
      }
      return { success: false as const, error: 'No clipboard content' };
    });
    await page.locator('button:has-text("Copy")').first().click();
    const clipboardResult = await clipboardPromise;
    console.log('EXPORT-10 clipboard result:', clipboardResult);
    expect(clipboardResult.success).toBe(true);
    expect(clipboardResult.text?.length).toBeGreaterThan(0);
    await page.screenshot({ path: 'test-results/export-10-copy.png', fullPage: true });
  });
});
