# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B are
both fully planned end-to-end. Implementation in progress.

## Phase
**pgvector query-pattern check — fully closed, both databases at
parity.** PREPROC-01–04 remains done. Both previously-flagged
high-priority testing.md items (security-critical PREPROC work,
pgvector query-pattern check) are now genuinely complete with real
evidence, not just planned or code-reviewed.

## Where everything actually lives
- **PREPROC-01–04, architecture.md, testing.md, ADR-005/006:**
  unchanged — all real, all closed.
- **pgvector:** compiled natively for PostgreSQL 17 on Windows.
  Extension enabled on both `trailhead_dev`/`trailhead_test`.
  `EmbeddingChunk` table + HNSW cosine index confirmed present on
  BOTH databases via direct `pg_indexes` query (not just push-command
  output). Real EXPLAIN evidence (prior round) confirms the correct
  query pattern uses the index and the known bad pattern doesn't, even
  forced. `KNOWN-GOOD.md` carries the full build procedure and the
  confirmed query-direction gotcha.

## Key decisions
*(Unchanged.)*

## Open questions
- All prior open items unchanged: shared Gemini quota risk, Symbols/
  Search person-verification, Symbols' zero-symbols empty state +
  server-side filtering, screen-reader behavior across Ask/Chat/
  Export, Ask/Chat reanalysis race condition, `/export/context`
  fallback-correctness test, questions-only context-blending,
  cross-screen retrofit sweep pattern, repo cleanup (stray zip
  fixtures / tsconfig.tsbuildinfo), branch-selector logic (deferred,
  needs UI), corrupt-ZIP catch's string-matching fragility,
  AnalysisJob lookup ordering (deferred to Reanalyze work).

## Current blocker
None.

## Last completed action
`trailhead_dev` EmbeddingChunk + HNSW index parity confirmed via real
`pg_indexes` query — 2026-07-22.

## Next valid moves
1. **Real groundwork is now in place to start Ask (Slice 1)
   implementation** — the two highest-priority pre-Ask risks
   (PREPROC security, retrieval index correctness) are both closed
   with real evidence. Natural next step: the `transformers.js`
   embedding pipeline (query-time + ingestion-time, same model,
   confirmed matching per `ask.md`'s dependency note) and the actual
   `/api/repositories/:id/ask` endpoint.
2. Opportunistically: repo cleanup, AnalysisJob ordering fix (when
   Reanalyze work begins), ADR-005's minor Context staleness (screen
   count, still unaddressed from several rounds back).

## Files changed last round
- `PROJECT-STATE.md` (this file)
