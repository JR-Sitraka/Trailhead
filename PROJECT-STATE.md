# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. Backend (full
pipeline + Ask/Chat + Symbols + Reanalyze) is complete and proven
end-to-end through real running dev-server sessions, not just tests.
Frontend has a working foundation (shared header, routing, canonical
tokens); Dashboard's real content is next.

## Phase
**Reanalyze feature genuinely complete**, closing two long-deferred
gaps from Step D2 (AnalysisJob lookup ordering, delete-and-replace
semantics). Took three separate interrupted Kilo Code sessions to
land — all real work preserved and correctly resumed each time, none
lost. Real E2E proof: a live reanalyze on `sindresorhus/got` showed
genuine `ready→analyzing→ready` transitions and confirmed every
Symbol/EmbeddingChunk row got fresh IDs (old data genuinely replaced,
not just recounted) — under real ~16-minute CPU-bound processing time,
not a mocked shortcut.

## Where everything actually lives
- **Full backend (import, preprocessing, symbols, embeddings, Ask/
  Chat, Symbols API, Reanalyze, Delete):** all complete, all committed,
  all real.
- **Frontend foundation:** canonical tokens, WorkspaceHeader, routing
  shell — done, verified against real pipeline data.
- **`links.md`:** all 7 approved Magic Patterns screens' real source
  already pulled into this conversation's history, ready to hand to
  Kilo Code per-screen.

## Key decisions
*(Unchanged, plus:)* Reanalyze does NOT implement mid-job cancellation
— Delete returns 409 against any active job, full stop, rather than
building a real abort/cancel mechanism (deliberately scoped out,
stated explicitly). Delete-and-replace clears Symbol/EmbeddingChunk
rows before new parsing starts (not after success, per
architecture.md's original framing) — File rows are kept as re-
parseable input; a failed reanalysis leaves analysis output empty but
raw file content intact, a stated, deliberate tradeoff for
implementation simplicity over strict failure-safety.

## Open questions
- **Dashboard is the next real target** — entry point, self-contained,
  every endpoint it needs (List/Import/Delete/Reanalyze) now genuinely
  exists and works.
- `tests/reanalysis.test.ts`'s fresh-import test has a known, logged
  timing-dependency fragility (see `KNOWN-GOOD.md`) — not urgent, real
  future hardening candidate.
- All prior open items unchanged: per-screen frontend content
  (Overview/Explorer/Symbols/Search/Chat/Export all still
  placeholders), Symbols' kind-badge colors (deferred to that
  screen's task), hover-modifier visual confirmation, Gemini quota
  (dormant, Groq primary), screen-reader behavior, `/export/context`
  fallback test, questions-only context-blending, repo cleanup,
  branch-selector logic, corrupt-ZIP string-matching fragility,
  codeload.github.com's separate rate limit, embedding cross-call
  non-determinism.

## Current blocker
None.

## Last completed action
Reanalyze feature's fresh-import regression guard confirmed genuinely
reliable (10/10 real reruns, mechanistically explained via real
source-code timing analysis) — 2026-07-24.

## Next valid moves
1. **Dashboard's real content** — real source already pulled from
   Magic Patterns, all backend endpoints now exist. Natural next task.
2. Then the six workspace screens in user-facing order.

## Files changed last round
- `KNOWN-GOOD.md` (reanalyze test fragility logged)
- `PROJECT-STATE.md` (this file)
