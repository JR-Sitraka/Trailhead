import { test, expect, type Page, type Route } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const READY_REPO = '188ab357-e47e-43ba-9e08-f1668e772372';

test.describe('Chat Diagnostic', () => {
  test('CHAT-09: Verify malformed history returns 400 via direct API call', async ({ page }) => {
    const response = await page.request.post(
      `${BASE_URL}/api/repositories/${READY_REPO}/chat`,
      {
        headers: { 'Content-Type': 'application/json' },
        data: { question: 'test', history: 'not-an-array' },
      }
    );
    console.log('CHAT-09 malformed history status:', response.status());
    const body = await response.json();
    console.log('CHAT-09 malformed history body:', JSON.stringify(body));
    expect(response.status()).toBe(400);
  });

  test('CHAT-10: Verify empty question returns 400 via direct API call', async ({ page }) => {
    const response = await page.request.post(
      `${BASE_URL}/api/repositories/${READY_REPO}/chat`,
      {
        headers: { 'Content-Type': 'application/json' },
        data: { question: '   ', history: [] },
      }
    );
    console.log('CHAT-10 empty question status:', response.status());
    const body = await response.json();
    console.log('CHAT-10 empty question body:', JSON.stringify(body));
    expect(response.status()).toBe(400);
  });

  test('CHAT-10: Verify 501-char question returns 400 via direct API call', async ({ page }) => {
    const response = await page.request.post(
      `${BASE_URL}/api/repositories/${READY_REPO}/chat`,
      {
        headers: { 'Content-Type': 'application/json' },
        data: { question: 'a'.repeat(501), history: [] },
      }
    );
    console.log('CHAT-10 501-char status:', response.status());
    const body = await response.json();
    console.log('CHAT-10 501-char body:', JSON.stringify(body));
    expect(response.status()).toBe(400);
  });

  test('CHAT-10: Verify 500-char question is accepted', async ({ page }) => {
    const response = await page.request.post(
      `${BASE_URL}/api/repositories/${READY_REPO}/chat`,
      {
        headers: { 'Content-Type': 'application/json' },
        data: { question: 'a'.repeat(500), history: [] },
      }
    );
    console.log('CHAT-10 500-char status:', response.status());
    expect(response.status()).toBe(200);
  });
});
