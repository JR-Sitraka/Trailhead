# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B are
both fully planned end-to-end. Implementation in progress.

## Phase
**PREPROC-01–04 (Repository Import + Safe Preprocessing) is genuinely,
functionally complete.** Every acceptance criterion that's currently
testable has real, Agent-verified evidence — no more Code-reviewed-
only or self-contradicting tier claims outstanding on this feature.
`architecture.md`'s Data Model + API Contracts are backfilled from the
real implementation (ADR-006). Two known, deliberately-deferred gaps
remain logged (not blocking): AnalysisJob lookup ordering (fix when
Reanalyze is built), corrupt-ZIP catch's string-matching fragility.

## Where everything actually lives
- **architecture.md:** fully backfilled this round — Data Model + API
  Contracts now reflect real, tested code. Stack section still points
  to ADR-002/003/004 rather than restating (no cross-check done there
  yet, nothing invented).
- **ADR-006:** documents the backfill + two real findings from the
  cross-check (commitSha integrity, fixed; AnalysisJob ordering,
  deferred).
- **KNOWN-GOOD.md:** full accumulated list of environment facts,
  adm-zip API quirks, GitHub API behavior, and known code fragilities
  from this session — read before any future backend task.
- **testing.md:** Ask/Chat/Export tables current (pasted this
  session). Repository Import/Safe Preprocessing's row-level detail
  was never pasted to me — still showing "(unchanged, see prior
  rounds)" — real completion status is accurately reflected here in
  PROJECT-STATE.md instead, until that section gets pasted for a
  proper update.

## Key decisions
*(Unchanged — see prior rounds.)*

## Open questions
- `testing.md`'s Repository Import/Safe Preprocessing table needs a
  real paste to update accurately (see above).
- All prior open items unchanged: shared Gemini quota risk, Symbols/
  Search person-verification, Symbols' zero-symbols empty state +
  server-side filtering, screen-reader behavior across Ask/Chat/
  Export, Ask/Chat reanalysis race condition, `/export/context`
  fallback-correctness test, questions-only context-blending,
  cross-screen retrofit sweep pattern, repo cleanup (stray zip
  fixtures / tsconfig.tsbuildinfo), branch-selector logic (deferred,
  needs UI).

## Current blocker
None.

## Last completed action
commitSha integrity fix implemented and verified (real network-failure
simulation via scoped fetch interception, real 502, real DB check);
architecture.md fully backfilled from real implementation — 2026-07-21.

## Next valid moves
1. **PREPROC-01–04 is done — move to `testing.md`'s next stated
   priorities:** the pgvector query-pattern check, and the
   ASK-03/EXPORT-04/CHAT-05 failure-path tests. These require Slice 1
   Ask/Chat implementation to exist first (EmbeddingChunk, retrieval)
   — worth confirming with you whether to start there next, or
   somewhere else.
2. Paste `testing.md`'s Repository Import/Safe Preprocessing table for
   a proper update reflecting this session's real completion status.
3. Opportunistically: repo cleanup, AnalysisJob ordering fix (only
   when Reanalyze work begins).

## Files changed last round
- `docs/07-architecture/architecture.md` (Data Model + API Contracts
  backfilled)
- `PROJECT-STATE.md` (this file)
