# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B are
both fully planned end-to-end. Implementation in progress.

## Phase
**MVP-A's full analysis pipeline is genuinely complete, end to end,
for the first time this project.** Import (ZIP + GitHub) → Safe
Preprocessing → Symbol extraction → Embedding generation →
`Repository.status = 'ready'`, all real, all Agent-verified, all
checkpointed. `next build` is fully green. This is a real milestone,
not just another closed task.

## Where everything actually lives
- **Steps A, B, C, D1, D2 — all closed, all committed.** Real content
  persistence, real GitHub zipball import, real tree-sitter symbol
  extraction, real transformers.js embeddings, real HNSW-indexed
  retrieval-ready storage, real status-transition logic
  (`AnalysisJob.status = 'completed'` + `Repository.status = 'ready'`
  only once both `parsingCompletedAt` and `embeddingCompletedAt` are
  set).
- **KNOWN-GOOD.md** now carries the full accumulated environment/
  implementation knowledge from this entire implementation arc —
  required reading before any further backend work, per its own
  standing instruction.
- **architecture.md** is fully backfilled (Stack, Symbol,
  EmbeddingChunk, Slice 2a) — no more collapsed placeholders anywhere
  in the Data Model or Stack sections.

## Key decisions
*(Unchanged, plus:)* Chunk-boundary algorithm: symbol-range chunks for
function/class/interface, 30-line fixed-window fallback for gaps and
non-TS/JS files. Reanalysis's delete-and-replace semantics explicitly
NOT implemented (Reanalyze doesn't exist yet) — flagged in code, not
silently skipped.

## Open questions
- **Reanalyze is not implemented.** Once it is, it must implement the
  delete-and-replace semantics `architecture.md` specifies AND fix the
  AnalysisJob-lookup-ordering gap flagged earlier this session — both
  real, both deferred to that feature specifically, both now clearly
  documented rather than forgotten.
- All prior open items unchanged: shared Gemini quota risk, Symbols/
  Search person-verification, Symbols' zero-symbols empty state +
  server-side filtering, screen-reader behavior across Ask/Chat/
  Export, `/export/context` fallback-correctness test, questions-only
  context-blending, cross-screen retrofit sweep pattern, repo cleanup
  (stray zip fixtures / tsconfig.tsbuildinfo), branch-selector logic
  (deferred, needs UI), corrupt-ZIP catch's string-matching fragility,
  codeload.github.com's separate rate limit.

## Current blocker
None.

## Last completed action
D2 fully verified and committed: real `next build` (native ML deps
fixed), real dev server, 51/51 tests passing, all 8 remaining
`tsc --noEmit` errors individually confirmed genuinely pre-existing
(one, `symbols.test.ts`'s missing `afterAll` import, was a real
one-line fix, not waved through) — 2026-07-22.

## Next valid moves
1. **Ask (Slice 1) can now genuinely start** — every dependency it
   needs (real File.content, real Symbol data, real EmbeddingChunk
   rows with verified HNSW retrieval) now exists for real, tested
   repositories. This is the natural next major feature.
2. **The Symbols API endpoint** (`GET /api/repositories/:id/symbols`)
   was deferred a while back as "small, after Symbol extraction" —
   still pending, genuinely small now that real Symbol data exists to
   query.
3. Opportunistically: everything in Open questions above.

## Files changed last round
- `PROJECT-STATE.md` (this file)
- `KNOWN-GOOD.md` (D1/D2 arc consolidated)
