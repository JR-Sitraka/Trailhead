# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B are
both fully planned end-to-end. Implementation in progress.

## Phase
**pgvector query-pattern check — genuinely closed, real EXPLAIN
evidence.** PREPROC-01–04 remains done (prior round). Dev/test HNSW
parity task pending (small, mechanical, sent to Kilo Code this round).

## Where everything actually lives
- **PREPROC-01–04, architecture.md, testing.md, ADR-005/006:**
  unchanged from prior rounds — all real, all closed as previously
  recorded.
- **pgvector:** compiled natively for PostgreSQL 17 on Windows this
  session (real toolchain friction hit and resolved — wrong terminal
  type initially, see `KNOWN-GOOD.md`). Extension enabled on both
  `trailhead_dev`/`trailhead_test`. `EmbeddingChunk` table + HNSW
  cosine index pushed to `trailhead_test`, with real EXPLAIN evidence
  confirming the correct query pattern uses the index and the known
  bad pattern (`1 - cosineDistance` DESC) does not, even when forced.
  `trailhead_dev` parity (same table + index) is a pending, sent task
  — not yet confirmed done.
- **KNOWN-GOOD.md:** now also carries the pgvector Windows build
  procedure (exact terminal type required, build/install commands) and
  the empirically-confirmed HNSW query-direction gotcha.

## Key decisions
*(Unchanged.)*

## Open questions
- Confirm `trailhead_dev`'s EmbeddingChunk + HNSW parity task
  completed (sent this round, not yet reported back).
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
pgvector compiled and verified on PostgreSQL 17; EmbeddingChunk +
HNSW index pushed to `trailhead_test` with real, EXPLAIN-confirmed
evidence of the correct vs. incorrect query pattern — 2026-07-22.

## Next valid moves
1. Confirm `trailhead_dev` parity task result.
2. Real groundwork for Ask/Chat implementation can now begin — the
   retrieval mechanism's core risk (index usage) is de-risked ahead of
   building the endpoint around it, as intended.
3. Opportunistically: repo cleanup, AnalysisJob ordering fix (when
   Reanalyze work begins).

## Files changed last round
- `PROJECT-STATE.md` (this file)
- `KNOWN-GOOD.md` (pgvector build procedure + confirmed query gotcha)
