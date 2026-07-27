# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B
shipped and publicly released. Current phase: **Trailhead Upgrade**
(project 2 on Starter Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — Layer 2/3 (UX + IA) drafted, awaiting placement; Layers
4–6 fork open.** Flows and IA revised in place with dated Upgrade
additions (items 4 + 5); the other five items confirmed as needing no
UX/IA work, stated explicitly in both docs.

## Standing project rules (this phase)
- **All repo file placement/commits are Claude Code tasks** with a
  full task packet every round (person's standing instruction).
- Same-codebase-continuation qualifier on all retrospective §8
  verdicts and promotion recommendations.

## Provisional-items trail (V4.2 — feeds retrospective §8, may not be blank)
- 2026-07-27 — trail opened. No provisional item triggered yet.
- 2026-07-27 — security-reviewer/security-review deliberately not
  triggered: auth deferred to V2/V3. Re-evaluate when observability
  touches API surfaces.
- 2026-07-27 — design-handoff / visual-parity-review: **pending the
  Layers 4–6 fork** — they trigger only if the observability panel
  gets a visual pass + implementation; logged either way once decided.

## Upgrade scope — FINAL (full detail in product-prd.md)
Priority: 1 doc-drift fix → 2 golden benchmark (script-only; baseline
pre-swap) → 3 embedding swap → 4 misdetection fix ("Unknown" state) →
5 LLM observability (Dashboard panel, confirmed) → 6 screen-reader →
7 testing closeout. Out: enforcement; auth (→V2/V3); V1 blueprint
items; benchmark perf metrics (→V1, carried); Group C; persistence;
query rewriting.

## Key decisions
- **Item 5 surface (2026-07-27):** Dashboard-level global panel — not
  a new tab (retrofit-sweep precedent, MVP-B retro finding #6), not
  logs-only. Recorded in IA doc.
- **Item 2 surface (2026-07-27):** script/CLI-only, no UI. Recorded
  in both UX docs.
- **ADR-007:** Kit V4.2 adopted, verified. CHANGELOG had no V4.2
  entry at adoption — recorded for the retrospective.
- All prior decisions unchanged.

## Open questions
- **Layers 4–6 fork (the round's live question):** does the
  observability panel get (a) a light visual pass — a compiled brief
  + code-first Magic Patterns build + the full review split, which
  would trigger the provisional design-handoff/visual-parity
  playbooks — or (b) spec-only from existing approved components
  (Card, ListRow, status-caption patterns), skipping Layers 4–6
  entirely per the sizing rule? Orchestrator recommendation pending
  discussion in chat.
- Framework-review conversation — separate track, unchanged.

## Current blocker
None — awaiting placement-task run and the Layers 4–6 pick.

## Last completed action
Flows + IA revised in place (Upgrade additions); placement task
issued — 2026-07-27.

## Next valid moves
1. Run placement task (3 files below).
2. Decide the Layers 4–6 fork → then software-architect light-pass
   check (does ADR-004's stack cover benchmark harness + observability
   counters, or new ADR?) → feature specs (Layer 8) for items 2–7.

## Files changed last round
- `docs/02-ux/ux-user-flows.md` (Upgrade additions appended)
- `docs/03-information-architecture/information-architecture.md`
  (Upgrade additions appended)
- `PROJECT-STATE.md` (this file)
