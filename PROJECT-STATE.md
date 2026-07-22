# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B are
both fully planned end-to-end. Implementation in progress.

## Phase
**Step A (foundational schema + job-runner) — fully closed.** Real
`File.content`/`File.category` persistence, `AnalysisJob` two-phase
completion columns, and a genuinely-verified-at-real-boot in-process
poller all confirmed with real evidence, including two real defects
found and fixed along the way (missing `instrumentationHook` flag;
HNSW index silently dropped on every `drizzle-kit push`).

Next: **Step B — GitHub content fetching** (repos imported via GitHub
URL currently have zero real file content — only metadata — since
nothing clones or downloads them yet).

## Where everything actually lives
- **PREPROC-01–04, pgvector/EmbeddingChunk, architecture.md,
  testing.md, ADR-005/006:** unchanged from prior rounds — all real,
  all closed.
- **Step A (this round):** `File.content` now genuinely persisted for
  ZIP imports (read before temp-dir cleanup); `File.category`
  (entrypoint/config) detected via a documented heuristic;
  `AnalysisJob.parsingCompletedAt`/`embeddingCompletedAt` columns
  exist (both null until Steps C/D give them something real to set);
  in-process poller (`src/server/poller.ts` + `src/instrumentation.ts`)
  verified via real dev-server boot output and a real DB row
  transition, not just a direct-call unit test. `scripts/
  ensure-indexes.ts` now runs automatically after every `db:push`,
  closing the HNSW-index-drop gap for good. Poller test no longer
  mutates unrelated rows (real two-repo isolation test, using an
  optional `scopeRepositoryId` param that production code never
  passes).
- **KNOWN-GOOD.md:** now also carries the confirmed
  `instrumentationHook` requirement and the general lesson it
  represents (startup-claims need real-server evidence, not just
  direct-call tests).

## Key decisions
*(Unchanged, plus:)* async job execution uses a simple in-process
poller (10s interval, `FOR UPDATE SKIP LOCKED`) — no Redis, no
dedicated queue, confirmed as the right fit for a single-operator,
zero-spend, local-only tool.

## Open questions
- **Step B not yet started:** GitHub-sourced repositories have no real
  file content — `fetchGithubRepoInfo()` only ever fetched metadata.
  Needs a real clone or tarball-download step before Structural
  Analysis (Step C) can run against GitHub-sourced repos at all.
- All prior open items unchanged: shared Gemini quota risk, Symbols/
  Search person-verification, Symbols' zero-symbols empty state +
  server-side filtering, screen-reader behavior across Ask/Chat/
  Export, Ask/Chat reanalysis race condition, `/export/context`
  fallback-correctness test, questions-only context-blending,
  cross-screen retrofit sweep pattern, repo cleanup (stray zip
  fixtures / tsconfig.tsbuildinfo), branch-selector logic (deferred,
  needs UI), corrupt-ZIP catch's string-matching fragility,
  AnalysisJob lookup ordering (deferred to Reanalyze work), unused
  `sleep()` helper in poller.ts (trivial dead code).

## Current blocker
None.

## Last completed action
Step A fully closed — HNSW index auto-restore script verified
end-to-end (drop → push → confirmed restored), poller test isolation
fixed with real two-repo verification, production call site confirmed
unchanged — 2026-07-22.

## Next valid moves
1. **Step B — GitHub content fetching.** Needs a real design decision
   first: clone via git (would need git available in the runtime
   environment) vs. GitHub's tarball/zipball API endpoint (reuses
   existing ZIP-handling infrastructure from Safe Preprocessing,
   likely the lower-friction path) — worth deciding explicitly before
   writing the task packet, not defaulting silently.
2. Step C (Symbol extraction/tree-sitter) and Step D (embeddings)
   remain queued behind Step B.

## Files changed last round
- `PROJECT-STATE.md` (this file)
