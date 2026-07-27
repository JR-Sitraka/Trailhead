# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B
shipped and publicly released. Current phase: **Trailhead Upgrade**
(project 2 on Starter Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — Layer 6: observability panel built + compliance-passed,
AT HUMAN VISUAL APPROVAL GATE.** Architect light-pass check done in
parallel (below). An artefact existing never implies approval — the
gate is open, not passed.

## Standing project rules (this phase)
- All repo file placement/commits are Claude Code tasks with a full
  task packet every round (person's standing instruction).
- Same-codebase-continuation qualifier on all §8 verdicts/promotions.

## Provisional-items trail (V4.2 — feeds retrospective §8, may not be blank)
- 2026-07-27 — trail opened.
- 2026-07-27 — security-reviewer deliberately not triggered (auth →
  V2/V3); re-evaluate when observability API surface is specified.
- 2026-07-27 — design-handoff + visual-parity scheduled for the
  panel's implementation (fork-a decision).
- 2026-07-27 — **visualization-prompting credit-exhaustion section:
  nuanced data point** — code-first mode used for the panel build **by
  deliberate choice** (fork-a working mode), not forced by a failed
  generation call; credits were never tested this round. Honest §8
  note: mode reconfirmed workable, exhaustion itself not re-observed.

## Upgrade scope — FINAL (full detail in product-prd.md)
Priority: 1 doc-drift → 2 benchmark (script-only, baseline pre-swap)
→ 3 embedding swap → 4 "Unknown" state → 5 observability panel (at
visual gate) → 6 screen-reader → 7 testing closeout. Out list: PRD.

## Architect light-pass check (2026-07-27) — conclusion
**No new ADR needed.** Benchmark harness = repo-local Node/TS scripts
reusing the existing embedding/retrieval modules + test DB;
observability counters = small persisted store on the existing
Postgres/Drizzle stack. Zero new technologies or pairings introduced
→ the pairing-gotcha search rule doesn't trigger yet (it WILL trigger
in item 3's embedding-model research, per candidate). Precedent:
Slices 2a/2b also reused ADR-004 with zero new ADRs. Data-model
details (counter table shape, benchmark result format) belong to the
full pass alongside feature specs — deferred there explicitly, not
silently.

## Key decisions
- **Panel built code-first** on a new MP artifact branch
  (`3f49e44a…`, from approved `6af558a6…`), published. Compliance
  pass: zero fails, one honest Unverified (unavailable/zero states
  code-present but not visually demonstrated).
- Fork (a), item-5 Dashboard surface, item-2 script-only, ADR-007 —
  all as previously recorded.

## Open questions
- **Human visual approval of the panel** — including the flagged
  choice: demonstrate unavailable/zero states in the mock first, or
  defer their visual check to implementation's parity review.
- Framework-review conversation — separate track, unchanged.

## Current blocker
The human visual gate (by design, not an impediment).

## Last completed action
Panel built + published + compliance-reviewed; brief + review docs
drafted; light-pass concluded — 2026-07-27.

## Next valid moves
1. Person views the design (same URL) and approves / requests changes
   / asks for the state-demo affordance first.
2. On approval: record the gate here, then Layer 8 — feature specs
   for items 2–7 (observability spec now unblocked by the light-pass
   conclusion), then design-handoff when the panel moves to
   implementation.

## Files changed last round
- `docs/06-components/briefs/dashboard-observability-panel.md` (new)
- `docs/06-components/briefs/dashboard-observability-panel-review.md`
  (new)
- `PROJECT-STATE.md` (this file)
