/** @vitest-environment happy-dom */

import React from 'react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { RepoRow } from '../src/components/repository/RepoRow';
import OverviewPage from '../src/app/repositories/[id]/overview/page';
import { db } from '../src/server/db';
import { repositories, files } from '../src/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Repository } from '../src/components/repository/types';

afterEach(() => cleanup());

function makeRepo(overrides: Partial<Repository> = {}): Repository {
  return {
    id: 'repo-1',
    name: 'sindresorhus/got',
    path: 'sindresorhus/got',
    status: 'ready',
    commitSha: 'abc1234',
    lastAnalyzed: '2 hours ago',
    source: 'github',
    ...overrides,
  };
}

describe('RepoRow — status announced on Tab (item 6 defect 1)', () => {
  it('includes the visible status in the Open link\'s accessible name, for every status', () => {
    const cases: Array<[Repository['status'], string]> = [
      ['ready', 'Ready'],
      ['analyzing', 'Analyzing'],
      ['queued', 'Queued'],
      ['failed', 'Failed'],
    ];

    for (const [status, label] of cases) {
      const { unmount } = render(
        <RepoRow repo={makeRepo({ status })} onReanalyze={() => {}} onDelete={() => {}} />
      );

      const openLink = screen.getByRole('link', { name: new RegExp(`status: ${label}`, 'i') });
      expect(openLink).toBeDefined();
      unmount();
    }
  });

  it('still shows the visible "Ready"/"Analyzing"/etc. pill text unchanged (no visual regression)', () => {
    render(<RepoRow repo={makeRepo({ status: 'analyzing' })} onReanalyze={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('Analyzing')).toBeDefined();
  });
});

const PREFIX = `overview-a11y-${Date.now()}`;

describe('Overview page — real headings for each fact section (item 6 defect 4)', () => {
  let readyRepoId: string;
  let analyzingRepoId: string;
  let skippedFileRepoId: string;

  beforeAll(async () => {
    const [readyRepo] = await db.insert(repositories).values({
      name: `${PREFIX}-ready`,
      source: 'github',
      sourceUrl: 'https://github.com/octocat/Hello-World',
      commitSha: 'abc1234',
      status: 'ready',
    }).returning();
    readyRepoId = readyRepo.id;

    await db.insert(files).values({
      repositoryId: readyRepoId,
      path: 'index.js',
      size: 100,
      language: 'javascript',
      content: 'module.exports = () => {};',
      category: 'entrypoint',
      skipped: false,
    });

    const [analyzingRepo] = await db.insert(repositories).values({
      name: `${PREFIX}-analyzing`,
      source: 'github',
      sourceUrl: 'https://github.com/octocat/Hello-World',
      commitSha: 'abc1234',
      status: 'analyzing',
    }).returning();
    analyzingRepoId = analyzingRepo.id;

    const [skippedFileRepo] = await db.insert(repositories).values({
      name: `${PREFIX}-skipped`,
      source: 'github',
      sourceUrl: 'https://github.com/octocat/Hello-World',
      commitSha: 'abc1234',
      status: 'ready',
    }).returning();
    skippedFileRepoId = skippedFileRepo.id;

    await db.insert(files).values({
      repositoryId: skippedFileRepoId,
      path: 'huge-generated.ts',
      size: 2_000_000,
      language: 'typescript',
      content: null,
      category: null,
      skipped: true,
      skipReason: 'File exceeds 1MB parse limit',
    });
  });

  afterAll(async () => {
    for (const id of [readyRepoId, analyzingRepoId, skippedFileRepoId]) {
      await db.delete(repositories).where(eq(repositories.id, id));
    }
  });

  it('renders "Stack", "Entry points", "Configuration files", "Testing" as real headings', async () => {
    const element = await OverviewPage({ params: { id: readyRepoId } });
    render(element);

    const headings = screen.getAllByRole('heading').map((h) => h.textContent);
    expect(headings).toContain('Stack');
    expect(headings).toContain('Entry points');
    expect(headings).toContain('Configuration files');
    expect(headings).toContain('Testing');

    for (const name of ['Stack', 'Entry points', 'Configuration files', 'Testing']) {
      const heading = screen.getByRole('heading', { name });
      expect(heading.tagName).toMatch(/^H[1-6]$/);
    }
  });

  it('renders the conditional "Status: analyzing" section as a real heading for a non-ready repo', async () => {
    const element = await OverviewPage({ params: { id: analyzingRepoId } });
    render(element);

    const heading = screen.getByRole('heading', { name: 'Status: analyzing' });
    expect(heading.tagName).toMatch(/^H[1-6]$/);
  });

  it('renders the conditional "Not analyzed" section as a real heading when a file was skipped', async () => {
    const element = await OverviewPage({ params: { id: skippedFileRepoId } });
    render(element);

    const heading = screen.getByRole('heading', { name: 'Not analyzed' });
    expect(heading.tagName).toMatch(/^H[1-6]$/);
    expect(screen.getByText('File exceeds 1MB parse limit')).toBeDefined();
  });
});
