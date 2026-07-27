# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B
shipped and publicly released. Current phase: **Trailhead Upgrade**
(project 2 on Starter Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — Layer 2 (UX/IA) in progress.** Layer 1 closed 2026-07-27
(done-check passed from the UX seat). Layer 2 scoping issued: items
1/3/7 need no UX work; item 6 only reactively; items 4 and 5 need
targeted in-place updates to existing UX/IA docs — two surface
decisions pending with the person.

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

## Upgrade scope — FINAL (full detail in product-prd.md)
Priority: 1 doc-drift fix → 2 golden benchmark (baseline pre-swap) →
3 embedding swap → 4 misdetection fix ("unknown" allowed) → 5 LLM
observability (visibility only) → 6 screen-reader → 7 testing
closeout. Out: enforcement; auth (→V2/V3); V1 blueprint items;
benchmark perf metrics (→V1, carried); Group C; persistence; query
rewriting.

## Key decisions
- **ADR-007:** Kit V4.2 adopted, verified (`3dcf1ad`). CHANGELOG had
  no V4.2 entry at adoption — recorded for the retrospective.
- **Upgrade scope + priority:** PRD Upgrade section, commit `ed6081d`.
- All prior decisions unchanged.

## Open questions
- **Item 5 surface:** orchestrator recommends a Dashboard-level
  panel/indicator over a new 8th tab (recorded precedent: three
  WorkspaceHeader retrofit sweeps, MVP-B retro finding #6) or
  logs-only. Awaiting confirm/pick.
- **Item 2 surface:** orchestrator recommends script/CLI only, no UI
  this phase. Awaiting confirm.
- **Item 4 treatment:** edge-state additions inside existing
  Overview/Export flows, no new flow doc — flagged low-controversy.
- Framework-review conversation — separate track, unchanged.

## Current blocker
None — awaiting the two surface confirmations, plus the current
`docs/02-ux/ux-user-flows.md` and
`docs/03-information-architecture/information-architecture.md`
contents (needed before in-place revision; orchestrator has never
seen the filled versions).

## Last completed action
Layer 1 closed; Layer 2 scoping + surface recommendations issued —
2026-07-27.

## Next valid moves
1. Person confirms item-2/item-5 surfaces and provides the two
   current UX/IA files (paste, or a Claude Code read-and-relay task).
2. Orchestrator revises both docs in place (items 4+5 only) →
   placement task → Layer 3 check (IA likely needs only the item-5
   note) → then Layers 4–6 skip entirely for items with no visual
   change, per the sizing rule ("templates are ceilings").

## Files changed last round
- `PROJECT-STATE.md` (this file)
