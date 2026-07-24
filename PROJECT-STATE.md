# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. Backend (MVP-A
pipeline + Ask/Chat + Symbols API) is complete and proven end-to-end,
including now through a real running dev server, not just tests.
Frontend foundation is built; per-screen content is next.

## Phase
**UI-Foundation-1 complete and verified.** Canonical Tailwind v4
tokens (reconciled from two naming eras across the 7 approved
screens), real shared WorkspaceHeader (real data, real navigation),
real routing shell for all 6 workspace tabs + Dashboard placeholder.
Verified against a real repository that completed the full pipeline
through `npm run dev` itself — first genuine end-to-end run outside
of vitest all session.

## Where everything actually lives
- **Backend (Steps A–D2, Ask/Chat, Symbols API):** all complete,
  all committed, all real — see prior rounds.
- **Frontend foundation:** `src/app/globals.css` (canonical `@theme`
  tokens, kebab-case per Tailwind v4's CSS-first config — NOT the
  camelCase used in the original Magic Patterns mocks, this is
  correct/intentional, see `KNOWN-GOOD.md`), `src/components/
  WorkspaceHeader.tsx` (real data via Server Component layout),
  `src/app/repositories/[id]/layout.tsx` + six placeholder tab pages,
  `src/app/page.tsx` (Dashboard placeholder).
- **`links.md`** (repo root) has all 7 verified Magic Patterns URLs
  for the approved screens — real code already pulled and read for
  Dashboard, Overview, Explorer, Symbols, Search, Chat, Export.
  Real source content for all 7 is in this conversation's own
  history, ready to hand to Kilo Code per-screen without re-fetching.

## Key decisions
*(Unchanged, plus:)* Frontend token naming is kebab-case (Tailwind v4
`@theme` requirement), canonical scheme is the one Chat/Export's mocks
used (matches `design-tokens.md`'s documented prose), not the older
naming Dashboard/Overview/Explorer/Symbols/Search's mocks used —
values were identical across both, naming reconciliation only.

## Open questions
- **Per-screen content is next** — Dashboard, Overview, Explorer,
  Symbols, Search, Chat, Export all still need their real content
  ported (currently placeholder pages) and wired to real backend
  endpoints (all of which already exist and work).
- Symbols' 5 kind-badge colors (function/class/interface/import/
  export) — deliberately not added as global tokens, deferred to
  whichever task actually builds the Symbols screen content.
- Hover-state modifier values (`primary/90` etc. replacing the old
  mocks' separate hover hex tokens) — not yet visually confirmed
  against the original mock's exact hover shade, low-risk, worth a
  glance when that screen's interactions get built.
- All prior open items unchanged: shared Gemini quota risk (dormant
  now that Groq is primary), Symbols/Search person-verification,
  screen-reader behavior across Ask/Chat/Export, `/export/context`
  fallback-correctness test, questions-only context-blending,
  cross-screen retrofit sweep pattern (now actively avoided by
  extracting WorkspaceHeader once, worth confirming this pattern
  holds as more screens get built), repo cleanup, branch-selector
  logic, corrupt-ZIP catch's string-matching fragility, AnalysisJob
  lookup ordering (deferred to Reanalyze), codeload.github.com's
  separate rate limit, embedding cross-call non-determinism.

## Current blocker
None.

## Last completed action
UI-Foundation-1 verified end-to-end against a real repository
(sindresorhus/got) that completed the full pipeline through a real
`npm run dev` session — real screenshots confirm status pill, SHA
display, and tab navigation all working correctly — 2026-07-23.

## Next valid moves
1. **Dashboard's real content** — natural next screen (entry point,
   self-contained, real `GET/POST/DELETE /api/repositories` already
   built and proven). Real source already pulled from Magic Patterns
   in this conversation's history.
2. Then the six workspace screens, roughly in the order a user would
   actually encounter them: Overview → Explorer → Symbols → Search →
   Chat → Export.

## Files changed last round
- `KNOWN-GOOD.md` (real end-to-end pipeline confirmation)
- `PROJECT-STATE.md` (this file)
