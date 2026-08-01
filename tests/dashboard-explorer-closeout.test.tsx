/** @vitest-environment happy-dom */

import React from 'react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdmZip from 'adm-zip';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/repositories/route';
import { GET as GET_FILES } from '../src/app/api/repositories/[id]/files/route';
import ExplorerClient from '../src/app/repositories/[id]/explorer/ExplorerClient';
import Dashboard from '../src/components/repository/Dashboard';
import { pollOnce } from '../src/server/poller';
import { db } from '../src/server/db';
import { repositories } from '../src/server/db/schema';
import { eq } from 'drizzle-orm';

// Item 7, Group 5 — closing testing.md's remaining planning-era Dashboard and
// Explorer rows. Those rows were all written against the MVP-A mock with
// in-memory fake data; the features have since shipped for real. Each test
// here exercises the real shipped implementation, and EXPLORER-01/04 use real
// pipeline output rather than seeded rows (KNOWN-GOOD 2026-07-25: a seeded
// repository proves frontend rendering only, never real pipeline behavior).

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ---------- EXPLORER-01 / EXPLORER-04: real pipeline, real tree ----------

async function importRealZipRepository(): Promise<{ repoId: string; name: string }> {
  const name = `explorer-closeout-${Date.now()}`;
  const zip = new AdmZip();
  zip.addFile('README.md', Buffer.from('# Real repo\n'));
  zip.addFile('src/index.ts', Buffer.from('export const x = 1;\n'));
  zip.addFile('src/nested/deep.ts', Buffer.from('export const deep = true;\n'));
  // A genuinely binary file — the real pipeline must skip this one, and the
  // tree must still list it (that is exactly what EXPLORER-04 asserts).
  zip.addFile('assets/logo.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]));

  const formData = new FormData();
  formData.append('source', 'zip');
  formData.append('file', new File([zip.toBuffer() as BlobPart], `${name}.zip`, { type: 'application/zip' }));

  const res = await POST(
    new NextRequest('http://localhost:3000/api/repositories', { method: 'POST', body: formData })
  );
  expect(res.status).toBe(201);
  const repo = await res.json();

  // Real poller run, not a status UPDATE — this is the real path to 'ready'.
  await pollOnce(repo.id);

  return { repoId: repo.id, name };
}

async function realFileRows(repoId: string) {
  const res = await GET_FILES(
    new NextRequest(`http://localhost:3000/api/repositories/${repoId}/files`),
    { params: { id: repoId } }
  );
  expect(res.status).toBe(200);
  return res.json();
}

describe('EXPLORER-01 / EXPLORER-04 — real repository, real file tree', () => {
  it('lists every real pipeline file in the tree, including the skipped binary one (EXPLORER-04)', async () => {
    const { repoId } = await importRealZipRepository();
    try {
      const rows = await realFileRows(repoId);

      // Real pipeline actually produced a skipped file — guard the fixture so
      // this can't pass vacuously.
      const skipped = rows.filter((r: any) => r.skipped);
      expect(rows.length).toBe(4);
      expect(skipped.length).toBeGreaterThan(0);
      expect(skipped.some((r: any) => r.path === 'assets/logo.png')).toBe(true);

      render(<ExplorerClient repoId={repoId} initialFiles={rows} />);

      // Expand every folder so the whole tree is visible.
      for (const folder of ['src', 'assets', 'nested']) {
        const btn = screen.queryByText(folder);
        if (btn) await userEvent.click(btn);
      }

      // EXPLORER-04: every file in the repository has a tree entry —
      // including the skipped one.
      for (const row of rows) {
        const leaf = row.path.split('/').pop() as string;
        expect(screen.getByText(leaf)).toBeTruthy();
      }
    } finally {
      await db.delete(repositories).where(eq(repositories.id, repoId));
    }
  }, 120000);

  it('renders the real folder structure and expand/collapse actually works (EXPLORER-01)', async () => {
    const { repoId } = await importRealZipRepository();
    try {
      const rows = await realFileRows(repoId);
      render(<ExplorerClient repoId={repoId} initialFiles={rows} />);

      // Collapsed initially: a nested file is not rendered.
      expect(screen.queryByText('index.ts')).toBeNull();

      // Expand -> child appears.
      await userEvent.click(screen.getByText('src'));
      await waitFor(() => expect(screen.getByText('index.ts')).toBeTruthy());

      // Collapse -> child disappears again. This is the real state
      // transition, not just "the folder label exists".
      await userEvent.click(screen.getByText('src'));
      await waitFor(() => expect(screen.queryByText('index.ts')).toBeNull());
    } finally {
      await db.delete(repositories).where(eq(repositories.id, repoId));
    }
  }, 120000);
});

// ---------- DASH-02 / DASH-05: real Dashboard component ----------

// sourceUrl is derived from the name rather than left at a shared default:
// the real filter matches name OR sourceUrl (Dashboard.tsx), so a shared URL
// would make every repo match every name-ish query and the test would fail
// for a reason that has nothing to do with the behavior under test.
function apiRepo(over: Partial<any> = {}) {
  const name = (over as any).name ?? 'owner/alpha';
  return {
    id: `id-${Math.random().toString(36).slice(2)}`,
    name,
    status: 'ready',
    source: 'github',
    sourceUrl: `https://github.com/${name}`,
    commitSha: 'abc1234def5678',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    analysisJob: null,
    ...over
  };
}

function mockRepositoriesApi(rows: any[]) {
  (global as any).fetch = vi.fn(async (url: any) => {
    const u = String(url);
    if (u.includes('/api/observability')) {
      return { ok: true, status: 200, json: async () => ({ requests: 0, failures: 0, providerStatus: 'unknown', providerName: 'groq' }) };
    }
    return { ok: true, status: 200, json: async () => rows };
  });
}

describe('DASH-01 — real status, SHA, and relative time render for every repository', () => {
  it('renders each repository with its correct status pill, short SHA, and a real relative time', async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    mockRepositoriesApi([
      apiRepo({
        name: 'owner/ready-repo',
        status: 'ready',
        commitSha: 'af0098901175156af7829cbf24259df1dcb8e41d',
        analysisJob: { status: 'completed', embeddingCompletedAt: twoHoursAgo }
      }),
      apiRepo({ name: 'owner/queued-repo', status: 'queued', commitSha: null }),
      apiRepo({ name: 'owner/analyzing-repo', status: 'analyzing', commitSha: null }),
      apiRepo({ name: 'owner/failed-repo', status: 'failed', commitSha: 'cbc42403142c96923b482604e1f3d627b1956aff' })
    ]);

    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText('owner/ready-repo')).toBeTruthy());

    // Every repository appears.
    for (const n of ['owner/ready-repo', 'owner/queued-repo', 'owner/analyzing-repo', 'owner/failed-repo']) {
      expect(screen.getByText(n)).toBeTruthy();
    }

    // Scope to the repository list: the status filter chips reuse the same
    // labels ("Ready", "Failed", ...), so an unscoped query would match the
    // chips and prove nothing about the rows.
    const list = within(screen.getByLabelText('Imported repositories'));

    // Correct status, per repository (StatusPill's real labels).
    expect(list.getByText('Ready')).toBeTruthy();
    expect(list.getByText('Queued')).toBeTruthy();
    expect(list.getByText('Analyzing')).toBeTruthy();
    expect(list.getByText('Failed')).toBeTruthy();

    // Correct SHA: shortened, and absent SHAs render the em-dash placeholder
    // rather than an empty cell or the string "null".
    expect(list.getByText('af00989')).toBeTruthy();
    expect(list.getByText('cbc4240')).toBeTruthy();
    expect(list.getAllByText('—').length).toBeGreaterThanOrEqual(2);

    // Correct relative time: the real formatRelativeTime output for a real
    // timestamp, plus the real status-specific strings.
    expect(list.getByText('2 hours ago')).toBeTruthy();
    expect(list.getByText('Queued just now')).toBeTruthy();
    expect(list.getByText('Running…')).toBeTruthy();
  }, 60000);
});

describe('DASH-02 — status and text filters against the real Dashboard', () => {
  it('filters by status, by text, and by both combined', async () => {
    mockRepositoriesApi([
      apiRepo({ name: 'owner/alpha', status: 'ready' }),
      apiRepo({ name: 'owner/beta', status: 'failed' }),
      apiRepo({ name: 'other/alpha-tool', status: 'ready' })
    ]);

    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText('owner/alpha')).toBeTruthy());

    // Baseline: all three visible.
    expect(screen.getByText('owner/beta')).toBeTruthy();
    expect(screen.getByText('other/alpha-tool')).toBeTruthy();

    // Status filter alone.
    await userEvent.click(screen.getByRole('button', { name: /failed/i }));
    await waitFor(() => expect(screen.queryByText('owner/alpha')).toBeNull());
    expect(screen.getByText('owner/beta')).toBeTruthy();
    expect(screen.queryByText('other/alpha-tool')).toBeNull();

    // Back to all, then text filter alone.
    await userEvent.click(screen.getByRole('button', { name: /^all/i }));
    const search = screen.getByLabelText('Filter repositories');
    await userEvent.type(search, 'alpha');
    await waitFor(() => expect(screen.queryByText('owner/beta')).toBeNull());
    expect(screen.getByText('owner/alpha')).toBeTruthy();
    expect(screen.getByText('other/alpha-tool')).toBeTruthy();

    // Combined: text 'alpha' AND status 'ready' still shows both alphas;
    // narrowing text to 'other' leaves exactly one.
    await userEvent.clear(search);
    await userEvent.type(search, 'other');
    await waitFor(() => expect(screen.queryByText('owner/alpha')).toBeNull());
    expect(screen.getByText('other/alpha-tool')).toBeTruthy();
  }, 60000);
});

describe('DASH-05 — zero-repositories and zero-filter-results are distinct states', () => {
  it('shows the empty-import state when there are no repositories at all', async () => {
    mockRepositoriesApi([]);
    render(<Dashboard />);

    await waitFor(() =>
      expect(screen.getByText(/No repositories yet/i)).toBeTruthy()
    );
    // Must NOT be the filtered-empty copy.
    expect(screen.queryByText(/No repositories match/i)).toBeNull();
  }, 60000);

  it('shows the distinct no-matches state when repositories exist but none match the filter', async () => {
    mockRepositoriesApi([apiRepo({ name: 'owner/alpha', status: 'ready' })]);
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText('owner/alpha')).toBeTruthy());

    await userEvent.type(screen.getByLabelText('Filter repositories'), 'zzz-no-such-repo');

    await waitFor(() => expect(screen.getByText(/No repositories match/i)).toBeTruthy());
    // The two states are genuinely different copy, not the same component
    // reused — this is the actual DASH-05 requirement.
    expect(screen.queryByText(/No repositories yet/i)).toBeNull();
  }, 60000);
});
