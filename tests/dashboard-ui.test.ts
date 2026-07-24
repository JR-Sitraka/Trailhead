import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as GetRepos, POST as PostRepo } from '../src/app/api/repositories/route';
import { DELETE as DeleteRepo } from '../src/app/api/repositories/[id]/route';
import { POST as ReanalyzeRepo } from '../src/app/api/repositories/[id]/reanalyze/route';
import { db } from '../src/server/db';
import { repositories, analysisJobs } from '../src/server/db/schema';
import { eq, desc } from 'drizzle-orm';

const PREFIX = `dashboard-ui-${Date.now()}`;
const TEST_GITHUB_URL_IMPORT = 'https://github.com/octocat/Spoon-Knife';
const TEST_GITHUB_URL_READY = 'https://github.com/octocat/Hello-World';

async function getRepos() {
  const req = new NextRequest('http://localhost/api/repositories');
  return GetRepos();
}

async function postRepo(payload: { source: 'github' | 'zip'; url?: string; file?: File }) {
  const fd = new FormData();
  fd.append('source', payload.source);
  if (payload.url) fd.append('url', payload.url);
  if (payload.file) fd.append('file', payload.file);
  const req = new NextRequest('http://localhost/api/repositories', { method: 'POST', body: fd });
  return PostRepo(req);
}

async function deleteRepo(id: string) {
  const req = new NextRequest(`http://localhost/api/repositories/${id}`, { method: 'DELETE' });
  return DeleteRepo(req, { params: { id } });
}

async function reanalyzeRepo(id: string) {
  const req = new NextRequest(`http://localhost/api/repositories/${id}/reanalyze`, { method: 'POST' });
  return ReanalyzeRepo(req, { params: { id } });
}

describe('Dashboard UI — API wiring verification', () => {
  let readyRepoId: string;

  beforeAll(async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-ready`,
      source: 'github',
      sourceUrl: TEST_GITHUB_URL_READY,
      commitSha: 'abc1234',
      status: 'ready'
    }).returning();

    await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: 'completed',
      truncated: false,
      parsingCompletedAt: new Date('2024-01-01T00:00:00Z'),
      embeddingCompletedAt: new Date('2024-01-01T00:00:00Z')
    });

    readyRepoId = repo.id;
  });

  afterAll(async () => {
    const toDelete = await db.select().from(repositories).where(eq(repositories.name, `${PREFIX}-ready`));
    for (const r of toDelete) {
      await db.delete(repositories).where(eq(repositories.id, r.id));
    }
  });

  it('GET /api/repositories returns the real data shape the Dashboard expects', async () => {
    const res = await getRepos();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);

    const ready = data.find((r: any) => r.id === readyRepoId);
    expect(ready).toBeDefined();
    expect(ready.status).toBe('ready');
    expect(ready.commitSha).toBe('abc1234');
    expect(ready.analysisJob).not.toBeNull();
    expect(ready.analysisJob.status).toBe('completed');
    expect(ready.analysisJob.embeddingCompletedAt).toBeTruthy();
  });

  it('response shape matches what Dashboard maps (all required fields present)', async () => {
    const res = await getRepos();
    const data = await res.json();
    const ready = data.find((r: any) => r.id === readyRepoId);
    expect(ready).toHaveProperty('id');
    expect(ready).toHaveProperty('name');
    expect(ready).toHaveProperty('status');
    expect(ready).toHaveProperty('source');
    expect(ready).toHaveProperty('sourceUrl');
    expect(ready).toHaveProperty('commitSha');
    expect(ready).toHaveProperty('createdAt');
    expect(ready).toHaveProperty('updatedAt');
    expect(ready).toHaveProperty('analysisJob');
  });

  it('POST /api/repositories (github) returns 201 and the returned row can be prepended to the list', async () => {
    const res = await postRepo({ source: 'github', url: TEST_GITHUB_URL_IMPORT });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe('queued');
    expect(body.source).toBe('github');
    expect(body.sourceUrl).toBe(TEST_GITHUB_URL_IMPORT);
    expect(body.id).toBeTruthy();
    expect(body.name).toBeTruthy();
  }, 60000);

  it('DELETE /api/repositories/:id returns 204 on success, 409 when job is active', async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-del-test`,
      source: 'zip',
      sourceUrl: null,
      commitSha: null,
      status: 'ready'
    }).returning();

    await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: 'completed',
      truncated: false,
      parsingCompletedAt: new Date(),
      embeddingCompletedAt: new Date()
    });

    const res = await deleteRepo(repo.id);
    expect(res.status).toBe(204);

    const remaining = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(remaining.length).toBe(0);
  });

  it('DELETE returns 409 when analysis job is queued/running', async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-del-409`,
      source: 'zip',
      sourceUrl: null,
      commitSha: null
    }).returning();

    await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: 'queued',
      truncated: false
    });

    const res = await deleteRepo(repo.id);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('analysis is in progress');
  });

  it('DELETE returns 404 for nonexistent repo (treats as already-gone)', async () => {
    const res = await deleteRepo('00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('POST /api/repositories/:id/reanalyze returns 201 with queued job, repo status unchanged', async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-rean-test`,
      source: 'zip',
      sourceUrl: null,
      commitSha: null,
      status: 'ready'
    }).returning();

    await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: 'completed',
      truncated: false,
      parsingCompletedAt: new Date(),
      embeddingCompletedAt: new Date()
    });

    const res = await reanalyzeRepo(repo.id);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe('queued');
    expect(body.repositoryId).toBe(repo.id);

    const [updatedRepo] = await db.select().from(repositories).where(eq(repositories.id, repo.id));
    expect(updatedRepo.status).toBe('ready');
  });

  it('reanalyze returns 409 when job already active', async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${PREFIX}-rean-409`,
      source: 'zip',
      sourceUrl: null,
      commitSha: null,
      status: 'ready'
    }).returning();

    await db.insert(analysisJobs).values({
      repositoryId: repo.id,
      status: 'queued',
      truncated: false
    });

    const res = await reanalyzeRepo(repo.id);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('already in progress');
  });

  it('GET /api/repositories: Dashboard can derive lastAnalyzed from embeddingCompletedAt', async () => {
    // Create a fresh ready repo to verify the lastAnalyzed derivation logic
    const [freshRepo] = await db.insert(repositories).values({
      name: `${PREFIX}-lastanalyzed`,
      source: 'zip',
      sourceUrl: null,
      commitSha: 'def5678',
      status: 'ready'
    }).returning();

    await db.insert(analysisJobs).values({
      repositoryId: freshRepo.id,
      status: 'completed',
      truncated: false,
      parsingCompletedAt: new Date(),
      embeddingCompletedAt: new Date('2024-06-01T12:00:00Z')
    });

    const res = await getRepos();
    const data = await res.json();
    const found = data.find((r: any) => r.id === freshRepo.id);
    expect(found).toBeDefined();
    expect(found.analysisJob?.embeddingCompletedAt).toBeTruthy();
    // Simulate what Dashboard does:
    const lastAnalyzed = found.analysisJob?.embeddingCompletedAt ?? found.updatedAt;
    expect(lastAnalyzed).toBe('2024-06-01T12:00:00.000Z');
  });
});
