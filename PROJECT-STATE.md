# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. Backend fully
complete (import, preprocessing, symbols, embeddings, Ask/Chat,
Symbols API, Reanalyze/Delete). Frontend: foundation + Dashboard both
complete and real-verified. Six workspace screens remain placeholders.

## Phase
**Dashboard is the first fully complete, real, end-to-end screen in
this project** — real data, real Import/Delete/Reanalyze wiring, real
409 handling, real dual-cadence polling (fast + baseline), every
accessibility detail from the approved mock preserved.

## Where everything actually lives
- **Full backend + UI-Foundation-1 (tokens, WorkspaceHeader,
  routing):** complete, committed, real — see prior rounds.
- **Dashboard** (`src/components/repository/`): List, Import, Delete,
  Reanalyze all real-wired. Two independent polling mechanisms (5s
  fast / 30s baseline) both real-verified via dev-server request logs.
  `src/app/page.tsx` renders it.
- **`links.md`:** real source for all 7 approved screens already
  pulled into this conversation's history — Overview, Explorer,
  Symbols, Search, Chat, Export still need their real ports.

## Key decisions
*(Unchanged, plus:)* Dashboard's GitHub-import branch selector was
deliberately dropped (no real endpoint exists to fetch a repo's real
branch list before import) — real backend default-branch behavior is
used instead. Polling uses two independent effects (fast/conditional,
baseline/unconditional) rather than one — deliberate, not accidental
complexity.

## Open questions
- **Six workspace screens still placeholders** — Overview, Explorer,
  Symbols, Search, Chat, Export. Real Magic Patterns source for all
  six already pulled and available in this conversation's history.
- Symbols' 5 kind-badge colors — deferred to that screen's task.
- All prior open items unchanged: hover-modifier visual confirmation,
  Gemini quota (dormant), screen-reader behavior, `/export/context`
  fallback test, questions-only context-blending, repo cleanup,
  corrupt-ZIP string-matching fragility, embedding cross-call
  non-determinism, `tests/reanalysis.test.ts`'s known timing fragility.

## Current blocker
None.

## Last completed action
Dashboard fully closed — baseline poll added and real-verified for
externally-created repositories, all four API integrations proven end
to end — 2026-07-24.

## Next valid moves
1. **Repository Overview** — natural next screen (first workspace tab,
   real source already pulled, real backend data — `File.category`,
   framework detection — already exists).
2. Then Explorer → Symbols → Search → Chat → Export, in user-facing
   order.

## Files changed last round
- `KNOWN-GOOD.md` (baseline poll, lucide-react brand-icon removal)
- `PROJECT-STATE.md` (this file)
