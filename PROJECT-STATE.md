# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B are
both fully planned end-to-end. Implementation in progress: MVP-A
foundation (Repository Import + Safe Preprocessing).

## Phase
**Implementation — MVP-A foundation, closing out verification gaps.**
Two real code defects found and fixed this session (symlink detection
checking the wrong ZIP field; path-traversal over-rejection). Local
PostgreSQL now set up; final route-level DB test in progress.

## Where everything actually lives
- **Product → Testing, Retrospective, ADR-005:** unchanged from prior
  rounds.
- **Local dev environment:** PostgreSQL 17 running natively on
  Windows, `trailhead_dev` + `trailhead_test` databases created,
  `.env` configured locally (not committed). Setup friction and the
  concrete facts from it are now recorded in `KNOWN-GOOD.md` rather
  than only in chat history.
- **Git:** first commit made this session (`a01d86c`) — 93 files,
  full planning docs + initial PREPROC-01–04 implementation. No
  `node_modules`/`.env` leaked into the commit, confirmed directly
  from the commit's file list. Two minor cleanup items noted but not
  yet actioned: `test-modified.zip`/`test-traversal.zip` committed at
  repo root (likely debug leftovers, not meant to be permanent
  fixtures), and `tsconfig.tsbuildinfo` (build artifact, should
  probably be gitignored). Neither is blocking.

## Key decisions
*(Unchanged — see prior rounds.)*

## Open questions
- `architecture.md`'s Data Model section header exists but the actual
  Repository/File/AnalysisJob field definitions and the
  POST /api/repositories contract shape were never written in —
  confirmed missing by direct agent report this session, not just
  suspected. Field shapes currently in use were reverse-engineered
  from feature docs. Still undecided: formalize as a real ADR now
  (backfill architecture.md or adopt the inferred schema after review)
  vs. keep patching inline per-feature. Recommend resolving before the
  next backend feature (Ask/Chat/Export) hits the same gap.
- Whether to clean up test-modified.zip/test-traversal.zip and
  tsconfig.tsbuildinfo from the repo (see above) — small, not urgent.
- All prior open items unchanged: shared Gemini quota risk, Symbols/
  Search person-verification, Symbols' zero-symbols empty state +
  server-side filtering, screen-reader behavior across Ask/Chat/
  Export, Ask/Chat reanalysis race condition, `/export/context`
  fallback-correctness test, questions-only context-blending,
  cross-screen retrofit sweep pattern (no kit home yet).

## Current blocker
None — test DB now exists, Kilo Code task sent to wire it in and get
the final route-level acceptance criterion actually verified.

## Last completed action
Local PostgreSQL 17 installed and configured (superuser password set,
`trailhead_dev`/`trailhead_test` created); `KNOWN-GOOD.md` updated
with the real setup facts and two adm-zip API findings — 2026-07-21.

## Next valid moves
1. Run the DB-wiring Kilo Code task above; report back its actual test
   output before PREPROC-01–04 is called done — the clean-ZIP → 201 +
   real-row criterion is the last unverified piece.
2. Once PREPROC-01–04 is genuinely done: decide the architecture.md
   Data Model gap (see Open questions), then move to the pgvector
   query-pattern check and ASK-03/EXPORT-04/CHAT-05 failure-path
   tests per testing.md's stated priorities.
3. Opportunistically: repo cleanup (stray zip fixtures, buildinfo
   file).

## Files changed last round
- `KNOWN-GOOD.md` (real environment facts + adm-zip findings added)
- `PROJECT-STATE.md` (this file)
