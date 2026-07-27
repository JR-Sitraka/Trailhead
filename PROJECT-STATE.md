# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — Layer 8 open.** Panel visually approved; component spec +
observability feature spec written. Remaining Layer 8: feature specs
for items 2 (benchmark), 3 (swap), 4 ("Unknown" state) — next round,
one batch. Items 1/6/7 are tasks, not features (no specs — they
execute via task packets + testing.md).

## Approval gates passed
- 2026-07-27 — **Dashboard observability panel: human visual approval
  (all four states cycled and confirmed).** Artifact `cfe1be53…`.
  Recorded decision: first-run zero state shows provider `unknown`.

## Standing project rules (this phase)
- All repo file placement/commits are Claude Code tasks, full packet
  every round.
- Same-codebase-continuation qualifier on §8 verdicts/promotions.

## Provisional-items trail (V4.2 — feeds retrospective §8)
- 2026-07-27 — trail opened.
- 2026-07-27 — security-reviewer deliberately not triggered (auth →
  V2/V3). Observability endpoint is read-only, no auth surface, no
  sensitive data — re-evaluated at spec time, still not triggered.
- 2026-07-27 — design-handoff + visual-parity scheduled for panel
  implementation; handoff strips the mock-only cycler.
- 2026-07-27 — credit-exhaustion nuance: code-first by choice,
  exhaustion not re-observed.

## Upgrade scope — FINAL (product-prd.md)
1 doc-drift → 2 benchmark → 3 swap → 4 "Unknown" → 5 observability
(design done, spec done) → 6 screen-reader → 7 testing closeout.

## Architect notes
Light pass: no new ADR (2026-07-27). Full-pass data-model additions
now partially concretized by observability.md (counter record,
metrics payload) — architecture.md gets its consolidated update after
the remaining feature specs land, one pass, not three.

## Key decisions
- Zero-state provider status = `unknown` (evidence-honesty).
- Embedding counting excluded from observability (local + free — the
  panel measures exactly the constrained resource).
- Panel artifact lineage + compliance history: see review doc.
- All prior decisions unchanged.

## Open questions
- None blocking. Framework-review conversation — separate track.

## Current blocker
None.

## Last completed action
Gate recorded; review upgraded to person-confirmed; ObservabilityPanel
component spec + observability feature spec drafted — 2026-07-27.

## Next valid moves
1. Place this round's files (agent task issued).
2. Next round: feature specs for items 2–4 in one batch, then the
   consolidated architecture.md full-pass update, then testing.md
   additions (OBS rows + items 6/7 rows) — Layer 8/9 closes, and
   implementation task-packet compilation begins (design-handoff
   first, per the scheduled provisional pair).

## Files changed last round
- `docs/06-components/briefs/dashboard-observability-panel-review.md`
  (updated — person-confirmed)
- `docs/06-components/component-specs.md` (ObservabilityPanel block
  APPENDED — append-only change)
- `docs/08-features/observability.md` (new)
- `PROJECT-STATE.md` (this file)
