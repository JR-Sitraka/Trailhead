# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 5: backend + frontend implementation COMPLETE and
real-verified on trailhead_dev. Visual parity (OBS-07) is the one
remaining step before item 5 closes.**

**Hash convention:** as of 2026-07-30, `main` HEAD `a66a744`. Branch
`upgrade/observability`: `023171b` (schema), `e56c18e` (generation.ts
abstraction + counter wiring), `75031c6` (GET /api/observability),
`c0aa03d` (panel + Dashboard integration), `a25bb2b` (OBS tests).

## Item 5 — two spec-vs-reality corrections found and fixed
1. **"Shared generation abstraction" did not exist** —
   `observability.md` and `architecture.md` both asserted it as
   already built; real trace found two duplicated Groq call sites
   (`chat.ts`, `export.ts`). Real fix: `src/server/services/
   generation.ts` created as the actual single choke point; both
   callers now route through it, error semantics preserved. Second
   instance of "docs described architecture that was never actually
   built" (first: item 3's `BATCH_SIZE` length-unawareness) —
   flagged together for the retrospective.
2. **The approved Magic Patterns panel work was never ported into
   the real codebase** — `Dashboard.tsx` had no panel, mock, or
   cycler prior to this task. Now ported for real; nothing needed
   "removing" since the mock scaffolding never shipped.

Both corrected in `architecture.md`'s Upgrade section (append) rather
than silently absorbed, per principles.md #3.

## Process note (not a correction needed)
Agent self-flagged that discovering the missing abstraction should
have been surfaced before acting, not just in the report (AGENTS.md
#4). The deviation itself was correct and necessary — duplicating
counting logic across two sites would have quietly broken the "no
path can bypass counting" guarantee. Logged as a process observation
for §8, not a defect.

## OBS-01 through OBS-06 — all real-verified (full table: testing.md)
Real Groq calls, real induced failures (corrupted credential, table
renamed away), real dev-server Chat turn, real DOM inspection
confirming zero focusable elements and the mock cycler fully absent
(grep + live check). Regression: 281/285 passed, identical
pre-existing failure set to main (KNOWN-GOOD-documented).

## KNOWN-GOOD entry added
`npm run db:push` hangs indefinitely in this harness (blocks on an
interactive confirmation prompt with no stdin). Workaround: apply
additive DDL directly; also avoids drizzle-kit's documented HNSW-
index-drop risk. Index verified intact both DBs after workaround.

## Coding-agent policy — unchanged
Placement always Claude Code. Visual parity (next task): Claude Code
— it's the artifact-comparison step, decision-adjacent.

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged; `visual-parity-review.md` about to trigger for the first
time this phase (next task) — will be item 5's closing gate.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — COMPLETE. 3 swap —
CLOSED: HELD. 4 "Unknown" — CLOSED. **5 observability —
implementation COMPLETE; OBS-07 visual parity is the last step.**
6 screen-reader — plan placed, not executed. 7 closeout — boxen +
got orphaned-state + check-got.ts + BATCH_SIZE length-awareness +
(now) generation.ts's real single-choke-point should be double-
checked for embedding calls' own future counting needs, if any.

## Open questions
- OBS-07 visual parity method: the mock cycler is gone, so the four
  states must be reached on the real app via the same real techniques
  already proven in OBS-02/04/05 (real call, real zero-state window,
  real induced credential failure, real induced table-unavailable) —
  specified in this round's task packet.
- `scripts/check-got.ts` disposition (item 7).
- Documentation-mitigation study, cloud-embedding scoping — deferred,
  unscheduled.
- Framework-review conversation — separate track.

## Current blocker
None.

## Last completed action
Item 5 implementation verified real; two spec corrections logged;
KNOWN-GOOD entry added — 2026-07-30.

## Next valid moves
1. Place four files (architecture append, KNOWN-GOOD append,
   testing.md append, this file).
2. Claude Code: OBS-07 visual parity review against the approved
   Magic Patterns artifact, four states induced by real means, three
   canonical viewports (per the design-handoff).
3. On clean parity: item 5 closes; item 6 (screen-reader) opens next.

## Files changed last round
- (pending this round's placement)
