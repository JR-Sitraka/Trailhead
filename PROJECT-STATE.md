# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B are
both fully planned end-to-end. Implementation in progress.

## Phase
**Step B (GitHub content fetching) — fully closed, including a real
DB-routing bug found and fixed along the way.** Steps A and B are both
genuinely done with real evidence. Next: Step C (Symbol extraction).

## Where everything actually lives
- **PREPROC-01–04, pgvector/EmbeddingChunk, Step A (schema + poller),
  architecture.md, testing.md, ADR-005/006:** unchanged from prior
  rounds — all real, all closed.
- **Step B (this round, closed):** `fetchGithubZipball()` +
  `stripGitHubTopLevel()` implemented and verified against a real
  repo (`sindresorhus/got`) — real content persisted, paths correctly
  stripped, category detection working. Size-limit download properly
  cancels the underlying reader (`reader.cancel()`) on exceeding
  150MB, not just stopping accumulation. Three "investigate, don't
  assume" items from the task packet all confirmed against live
  GitHub behavior: redirect handling (automatic, no manual work
  needed), top-level folder wrapping format (`{owner}-{repo}-{short-
  sha}/`), and Content-Length unreliability (not guaranteed on
  zipball responses — streaming size-check required, can't
  pre-check).
- **DB-routing bug (found + fixed this round):** real, session-wide
  bug where the dev server was silently writing to `trailhead_test`
  instead of `trailhead_dev` — see `KNOWN-GOOD.md` for full detail.
  Fixed, verified both directions with real running processes, and 20
  contaminated rows cleaned from `trailhead_test` with cascade
  verified.

## Key decisions
*(Unchanged, plus:)* Step B uses GitHub's zipball endpoint (not git
clone), reusing Safe Preprocessing's existing validateZipSafety()
pipeline unmodified against the downloaded/stripped bytes.

## Open questions
- All prior open items unchanged: shared Gemini quota risk, Symbols/
  Search person-verification, Symbols' zero-symbols empty state +
  server-side filtering, screen-reader behavior across Ask/Chat/
  Export, Ask/Chat reanalysis race condition, `/export/context`
  fallback-correctness test, questions-only context-blending,
  cross-screen retrofit sweep pattern, repo cleanup (stray zip
  fixtures / tsconfig.tsbuildinfo), branch-selector logic (deferred,
  needs UI), corrupt-ZIP catch's string-matching fragility,
  AnalysisJob lookup ordering (deferred to Reanalyze work), unused
  `sleep()` helper in poller.ts, codeload.github.com's separate
  unauthenticated rate limit (GITHUB_TOKEN doesn't carry across the
  redirect — logged, not currently a functional problem).

## Current blocker
None.

## Last completed action
DB-routing bug fully closed: fix verified both directions with real
running processes, 20 contaminated trailhead_test rows deleted with
cascade verified, full suite (32/32) confirmed clean — 2026-07-22.

## Next valid moves
1. **Step C — Symbol extraction (tree-sitter/web-tree-sitter, per
   ADR-002).** Both source types (ZIP and GitHub) now have real
   persisted `File.content` to parse against. This is the last
   foundational piece before embeddings (Step D) can finally run
   against real, symbol-aware chunking instead of a placeholder.
2. Opportunistically: everything in Open questions above.

## Files changed last round
- `PROJECT-STATE.md` (this file)
- `KNOWN-GOOD.md` (consolidated DB-routing bug entry)
