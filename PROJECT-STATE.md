# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B are
both fully planned end-to-end. Implementation in progress: MVP-A
foundation (Repository Import + Safe Preprocessing).

## Phase
**Implementation — PREPROC-01–04 functionally complete**, closing out
a documentation gap discovered during that work. One real code fix
still pending (commitSha failure handling) before this feature is
fully closed.

## Where everything actually lives
- **Product → Testing, Retrospective:** unchanged.
- **ADR-005 (tool setup):** unchanged from prior update.
- **ADR-006 (new):** documents the architecture.md Data Model/API
  Contract backfill and two real findings from cross-checking spec
  against implemented code — see that file directly.
- **architecture.md:** Data Model + API Contract sections pending
  final backfill — waiting on a fresh full-file paste to safely
  replace only those sections without guessing at unseen content
  (Stack, NFRs, rejected alternatives).
- **Local dev environment, git, PostgreSQL setup:** unchanged from
  prior rounds — see `KNOWN-GOOD.md` for the full, accumulated list.

## Key decisions across all of MVP-B
*(Unchanged — see prior rounds.)*

## Open questions
- **architecture.md full-file paste needed** to complete the backfill
  — I only have the Slice 2b delta from an earlier round, not the
  real Stack/NFR/rejected-alternatives content.
- All prior open items unchanged: shared Gemini quota risk, Symbols/
  Search person-verification, Symbols' zero-symbols empty state +
  server-side filtering, screen-reader behavior across Ask/Chat/
  Export, Ask/Chat reanalysis race condition, `/export/context`
  fallback-correctness test, questions-only context-blending,
  cross-screen retrofit sweep pattern, repo cleanup (stray zip
  fixtures / tsconfig.tsbuildinfo), branch-selector logic (deferred,
  needs UI), corrupt-ZIP catch's string-matching fragility (logged,
  not blocking).

## Current blocker
None — waiting on one file paste (architecture.md) and one Kilo Code
round (commitSha fix) to fully close PREPROC-01–04.

## Last completed action
ADR-006 written: documents architecture.md's Data Model/API Contract
backfill and two real findings (commitSha nullability contradicting
spec, resolved to fail-the-import; AnalysisJob ordering gap, deferred
to Reanalyze work) — 2026-07-21.

## Next valid moves
1. Paste current `architecture.md` in full so I can deliver the
   complete backfilled file.
2. Run the commitSha-fix Kilo Code task above.
3. Once both land: PREPROC-01–04 is genuinely, fully done. Move to
   `testing.md`'s next stated priorities — pgvector query-pattern
   check, ASK-03/EXPORT-04/CHAT-05 failure-path tests.

## Files changed last round
- `docs/10-decisions/adr-006-architecture-doc-backfill.md` (new)
- `KNOWN-GOOD.md` (AnalysisJob ordering gap added)
- `PROJECT-STATE.md` (this file)
