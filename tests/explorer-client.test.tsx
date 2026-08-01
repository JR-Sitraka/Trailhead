/** @vitest-environment happy-dom */

import React from 'react';
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExplorerClient from '../src/app/repositories/[id]/explorer/ExplorerClient';

const PREFIX = `explorer-ui-${Date.now()}`;
let mockFetch: any;

beforeEach(() => {
  mockFetch = vi.fn();
  (global as any).fetch = mockFetch;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function mockFetchFileContent(repoId: string, path: string, content: string, language: string | null) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ content, language, path, size: content.length }),
  });
}

describe('ExplorerClient rendering — both highlight and plain-text branches', () => {
  it('renders colored syntax highlighting for a Shiki-supported language', { timeout: 15000 }, async () => {
    const repoId = `ts-${PREFIX}`;
    const filePath = 'index.ts';
    const content = 'export const x = 1;\nexport const y = 2;';

    mockFetchFileContent(repoId, filePath, content, 'typescript');

    render(<ExplorerClient repoId={repoId} initialFiles={[{
      path: filePath,
      name: 'index.ts',
      skipped: false,
      skipReason: null,
      size: content.length,
      language: 'typescript',
      category: null,
    }]} />);

    const fileButton = screen.getByText('index.ts');
    await userEvent.click(fileButton);

    let table: HTMLTableElement;
    await waitFor(() => {
      const el = screen.queryByRole('table');
      if (!el) throw new Error('table not found');
      table = el as HTMLTableElement;
    }, { timeout: 20000 });

    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    const rightCells = Array.from(rows).map(r => r.querySelector('td:last-child')!);
    for (const cell of rightCells) {
      expect(cell.innerHTML).toContain('<span');
      expect(cell.querySelector('span')).not.toBeNull();
    }
  });

  it('renders plain text for a file with an unrecognized language', async () => {
    const repoId = `text-${PREFIX}`;
    const filePath = 'README.txt';
    const content = 'Hello world\nSecond line\n';

    mockFetchFileContent(repoId, filePath, content, 'text');

    render(<ExplorerClient repoId={repoId} initialFiles={[{
      path: filePath,
      name: 'README.txt',
      skipped: false,
      skipReason: null,
      size: content.length,
      language: 'text',
      category: null,
    }]} />);

    const fileButton = screen.getByText('README.txt');
    await userEvent.click(fileButton);

    const table = await screen.findByRole('table');
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);

    const rightCells = Array.from(rows).map(r => r.querySelector('td:last-child')!);
    expect(rightCells.length).toBe(3);
    expect(rightCells.every(c => !c.hasAttribute('dangerouslySetInnerHTML'))).toBe(true);

    const expectedLines = content.split('\n');
    rightCells.forEach((cell, i) => {
      expect(cell.textContent).toBe(expectedLines[i]);
    });
  });

  it('matches API response line count and content for both branches sequentially', async () => {
    const cases = [
      { repoId: `lines-ts-${PREFIX}`, filePath: 'app.ts', content: 'const a = 1;\nconst b = 2;\nconst c = 3;', language: 'typescript' },
      { repoId: `lines-txt-${PREFIX}`, filePath: 'notes.txt', content: 'line1\nline2', language: 'text' },
    ];

    for (const c of cases) {
      mockFetchFileContent(c.repoId, c.filePath, c.content, c.language);
      render(<ExplorerClient repoId={c.repoId} initialFiles={[{
        path: c.filePath,
        name: c.filePath,
        skipped: false,
        skipReason: null,
        size: c.content.length,
        language: c.language,
        category: null,
      }]} />);

      const btn = screen.getByText(c.filePath);
      await userEvent.click(btn);

      const table = await screen.findByRole('table');
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBe(c.content.split('\n').length);

      const rightCells = Array.from(rows).map(r => r.querySelector('td:last-child')!);
      const expectedLines = c.content.split('\n');
      rightCells.forEach((cell, i) => {
        expect(cell.textContent).toBe(expectedLines[i]);
      });
      cleanup();
    }
  });

  it('announces the opened file via an aria-live region once content loads', async () => {
    const repoId = `announce-${PREFIX}`;
    const filePath = 'page.tsx';
    const content = 'export default function Page() {}';

    mockFetchFileContent(repoId, filePath, content, 'typescript');

    const { container } = render(<ExplorerClient repoId={repoId} initialFiles={[{
      path: filePath,
      name: 'page.tsx',
      skipped: false,
      skipReason: null,
      size: content.length,
      language: 'typescript',
      category: null,
    }]} />);

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion!.textContent).toBe('');

    const fileButton = screen.getByText('page.tsx');
    await userEvent.click(fileButton);

    await waitFor(() => {
      expect(liveRegion!.textContent).toBe(`Viewing ${filePath}`);
    });
  });

  it('announces the skip reason via the aria-live region for a skipped file', async () => {
    const repoId = `announce-skip-${PREFIX}`;
    const filePath = 'prisma-client.ts';

    const { container } = render(<ExplorerClient repoId={repoId} initialFiles={[{
      path: filePath,
      name: filePath,
      skipped: true,
      skipReason: 'File exceeds 1MB parse limit',
      size: 2_000_000,
      language: null,
      category: null,
    }]} />);

    const liveRegion = container.querySelector('[aria-live="polite"]');

    const fileButton = screen.getByText(filePath);
    await userEvent.click(fileButton);

    await waitFor(() => {
      expect(liveRegion!.textContent).toContain('File exceeds 1MB parse limit');
    });
  });
});
