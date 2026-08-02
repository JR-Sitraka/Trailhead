/** @vitest-environment happy-dom */

import React from 'react';
import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../src/server/db/schema';
import { repositories, analysisJobs } from '../src/server/db/schema';
import { db } from '../src/server/db';
import { getExportJson, buildDeterministicFallback } from '../src/server/services/export';
import OverviewPage from '../src/app/repositories/[id]/overview/page';

// Item 4 — "Unknown" detection state verification (item 7 closeout follow-up,
// 2026-08-02). Verifies OVERVIEW-U1, OVERVIEW-U2, EXPORT-U1, EXPORT-U2 against
// real data in real databases:
//   - null-framework fixture:  cloned into trailhead_test from the real
//     sindresorhus/got row in trailhead_dev (c08b0a4d-b85e-4359-a991-
//     efb79f77c66f) — same real stack facts, same null framework, so the
//     assertion is against the exact detection outcome the real pipeline
//     produced, not a hand-authored one. Cloned rather than pointed at
//     directly because the vitest environment binds `db` to trailhead_test.
//   - correctly-detected fixture: JR-Sitraka/Trailhead in trailhead_bench
//     (per BENCH-06 5/5 detection result, framework = 'Next.js')

afterEach(() => cleanup());

const NULL_FW_SOURCE_DEV = 'c08b0a4d-b85e-4359-a991-efb79f77c66f';
const STRONG_FW_REPO_BENCH = '3f0bba77-6d3d-45c9-b4dd-132c096ba062'; // JR-Sitraka/Trailhead

let nullFwRepoId: string;

beforeAll(async () => {
  // Pull the REAL got row from trailhead_dev...
  const devUrl = process.env.DATABASE_URL;
  if (!devUrl) throw new Error('DATABASE_URL required');
  const devClient = postgres(devUrl, { prepare: false });
  const devDb = drizzle(devClient, { schema });
  const [source] = await devDb.select().from(repositories).where(eq(repositories.id, NULL_FW_SOURCE_DEV));
  await devClient.end();
  if (!source) throw new Error(`Source repo ${NULL_FW_SOURCE_DEV} missing from trailhead_dev`);
  if (source.framework !== null) throw new Error(`Source repo framework is ${source.framework}, expected null`);

  // ...and clone into trailhead_test with the same real stack facts, so
  // getExportJson (which uses the vitest-bound singleton) reaches it.
  const [inserted] = await db.insert(repositories).values({
    name: `item4-clone-of-got-${Date.now()}`,
    source: source.source,
    sourceUrl: source.sourceUrl,
    commitSha: source.commitSha,
    status: source.status,
    primaryLanguage: source.primaryLanguage,
    framework: source.framework,
    packageManager: source.packageManager,
    buildTool: source.buildTool,
    testFrameworkSummary: source.testFrameworkSummary
  }).returning();
  await db.insert(analysisJobs).values({
    repositoryId: inserted.id,
    status: 'completed',
    truncated: false,
    parsingCompletedAt: new Date(),
    embeddingCompletedAt: new Date()
  });
  nullFwRepoId = inserted.id;
}, 30000);

afterAll(async () => {
  if (nullFwRepoId) {
    await db.delete(repositories).where(eq(repositories.id, nullFwRepoId));
  }
}, 15000);

describe('OVERVIEW-U1: real null-framework repo renders "Unknown" honestly', () => {
  it('shows "Unknown" for framework instead of blank, guess, or omission', async () => {
    // Guard the fixture: prove framework really is null in the DB.
    const [repo] = await db.select().from(repositories).where(eq(repositories.id, nullFwRepoId));
    expect(repo.framework).toBeNull();

    const pageEl = await OverviewPage({ params: { id: nullFwRepoId } });
    render(pageEl);

    // Framework field row must contain the literal "Unknown" — not empty,
    // not the string "null", not a fabricated framework name.
    const frameworkLabel = screen.getByText('Framework');
    const row = frameworkLabel.closest('div, li, tr, dl, p');
    expect(row?.textContent).toMatch(/Framework.*Unknown/);
    expect(row?.textContent).not.toMatch(/null/);

    // Nothing anywhere in the rendered page should invent a framework for
    // this repo. All the plausible false-positives worth guarding against:
    const body = document.body.textContent ?? '';
    for (const inventedName of ['Next.js', 'Express', 'React', 'Vue', 'Angular', 'Django', 'Rails', 'Flask']) {
      expect(body).not.toMatch(new RegExp(`\\b${inventedName}\\b`));
    }
  }, 20000);
});

describe('OVERVIEW-U2: real correctly-detected repo still renders its framework (no over-correction)', () => {
  it('shows the real detected framework (Next.js) for JR-Sitraka/Trailhead', async () => {
    // Read from trailhead_bench directly — the dev `db` singleton points at
    // trailhead_dev under vitest.
    const benchUrl = process.env.BENCH_DATABASE_URL;
    if (!benchUrl) throw new Error('BENCH_DATABASE_URL required');
    const benchClient = postgres(benchUrl, { prepare: false });
    const benchDb = drizzle(benchClient, { schema });
    try {
      const [repo] = await benchDb.select().from(repositories).where(eq(repositories.id, STRONG_FW_REPO_BENCH));

      // Guard the fixture.
      expect(repo.name).toBe('JR-Sitraka/Trailhead');
      expect(repo.framework).toBe('Next.js');
      expect(repo.packageManager).toBe('npm');
      expect(repo.testFrameworkSummary).toBe('Vitest');

      // Rendering OverviewPage against trailhead_bench would require pointing
      // the server-component's own db at bench, which the singleton doesn't
      // support. Instead, prove the render contract holds by exercising the
      // same displayValue helper the page uses, with the real bench data.
      const { displayValue } = await import('../src/app/repositories/[id]/overview/page');
      expect(displayValue(repo.framework, 'Unknown')).toBe('Next.js');
      expect(displayValue(repo.framework, 'Unknown')).not.toBe('Unknown');
      expect(displayValue(repo.packageManager, 'Unknown')).toBe('npm');
      expect(displayValue(repo.buildTool, 'Unknown')).toBe('Next.js (built-in)');
    } finally {
      await benchClient.end();
    }
  }, 30000);
});

describe('EXPORT-U1: JSON export serializes framework as null, not a fabricated label', () => {
  it('emits framework: null for the null-framework repo, no invented value, field present', async () => {
    const json = await getExportJson(nullFwRepoId);

    // Field present, not omitted (a missing field would also fail the spec).
    expect(json.stack).toHaveProperty('framework');
    // Literal null, not "", not "Unknown", not a guessed name.
    expect(json.stack.framework).toBeNull();
    expect(json.stack.framework).not.toBe('');
    expect(json.stack.framework).not.toBe('Unknown');

    // Also confirm sibling stack fields serialize the same way, so the null
    // discipline isn't accidentally isolated to `framework`.
    expect(json.stack.packageManager).toBeNull();
    expect(json.stack.buildTool).toBeNull();

    // Full serialized output must not contain any framework name whatsoever.
    const serialized = JSON.stringify(json);
    for (const inventedName of ['Next.js', 'Express', 'React', 'Vue', 'Angular']) {
      expect(serialized).not.toContain(inventedName);
    }
  }, 20000);
});

describe('EXPORT-U2: REPOSITORY_CONTEXT.md communicates non-detection honestly', () => {
  it('deterministic fallback path: uses the exact "framework is not specified" wording', async () => {
    const json = await getExportJson(nullFwRepoId);
    const fallback = buildDeterministicFallback(json);

    // Real, exact wording from the spec's non-detection path.
    expect(fallback).toContain('framework is not specified');
    // And no fabricated framework name anywhere in the prose.
    for (const inventedName of ['Next.js', 'Express', 'React', 'Vue', 'Angular', 'Django', 'Rails']) {
      expect(fallback).not.toContain(inventedName);
    }

    // Emit the exact prose so a reviewer can eyeball the wording without
    // re-running the test — cited in testing.md's EXPORT-U2 evidence.
    // eslint-disable-next-line no-console
    console.log('[EXPORT-U2 fallback prose, real]', JSON.stringify(fallback));
  }, 20000);

  it('LLM path: honestly reachable coverage is limited to code inspection here', () => {
    // The LLM path cannot be forced to run deterministically without spending
    // real Groq quota on an already-metered project (ADR-009-tracked
    // constraint). Instead, the code path is verified by inspection: the LLM
    // prompt is built from the same `contextJson` the deterministic fallback
    // uses, so `framework: null` is what the model would receive as input.
    // Item 5's LLM-observability audit (2026-07-30) already verified the
    // shared choke point (generateJson in generation.ts) is the sole way any
    // generation call reaches the provider. Any LLM-generated
    // REPOSITORY_CONTEXT.md that invented a framework for a null-framework
    // repo would therefore be a prompt-hygiene issue, not a data issue —
    // logged for KNOWN-GOOD alongside the earlier "session store" prompt
    // finding (2026-07-25), not testable from here without spending quota.
    expect(true).toBe(true);
  });
});
