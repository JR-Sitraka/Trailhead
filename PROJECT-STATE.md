# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — Layer 6: panel + state-demo cycler published, AT HUMAN
VISUAL APPROVAL GATE (all four states now viewable).** Person
requested the demo affordance before approving (2026-07-27) —
delivered. An artefact existing never implies approval.

## Standing project rules (this phase)
- All repo file placement/commits are Claude Code tasks with a full
  task packet every round.
- Same-codebase-continuation qualifier on all §8 verdicts/promotions.

## Provisional-items trail (V4.2 — feeds retrospective §8)
- 2026-07-27 — trail opened.
- 2026-07-27 — security-reviewer deliberately not triggered (auth →
  V2/V3); re-evaluate at observability API spec.
- 2026-07-27 — design-handoff + visual-parity scheduled for panel
  implementation. Handoff must list the mock-only state cycler as a
  prototype shortcut to strip (playbook step 4).
- 2026-07-27 — credit-exhaustion nuance: code-first used by choice,
  exhaustion not re-observed (two publishes this round, zero AI
  generation calls).

## Upgrade scope — FINAL (product-prd.md)
1 doc-drift → 2 benchmark → 3 embedding swap → 4 "Unknown" state →
5 observability panel (at visual gate) → 6 screen-reader → 7 testing
closeout.

## Architect light-pass conclusion (2026-07-27)
No new ADR. Benchmark + counters fit ADR-004 stack; data-model detail
deferred to full pass with feature specs. Pairing-search rule
triggers at item 3's model research, per candidate.

## Key decisions
- Panel artifact lineage: approved `6af558a6…` → reviewed panel
  `3f49e44a…` → panel+cycler `cfe1be53…` (published, current). The
  cycler is mock-only demo scaffolding, excluded from the spec.
- Compliance pass: zero fails, one Unverified (states) — now
  human-checkable via the cycler.
- All prior decisions unchanged.

## Open questions
- **Human visual approval** — person cycles all 4 states and
  approves / requests changes.
- Framework-review conversation — separate track.

## Current blocker
The human visual gate (by design).

## Last completed action
State-demo cycler added and published — 2026-07-27.

## Next valid moves
1. Person cycles states, gives verdict.
2. On approval: record gate, update the review doc's Unverified row
   to person-confirmed, write the panel's component-spec block, then
   Layer 8 feature specs (items 2–7) in priority-order batches.

## Files changed last round
- `PROJECT-STATE.md` (this file)
