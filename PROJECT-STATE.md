# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B
shipped and publicly released. Current phase: **Trailhead Upgrade**
(project 2 on Starter Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — Layer 6 setup (observability panel visual pass).** Layers
2/3 placed and committed (`c9636ed`). Fork decided 2026-07-27: the
Dashboard observability panel gets a light visual pass — retrofit of
the approved Dashboard mock, code-first in Magic Patterns, full
review split, then design-handoff → visual-parity at implementation.

## Standing project rules (this phase)
- **All repo file placement/commits are Claude Code tasks** with a
  full task packet every round (person's standing instruction).
- Same-codebase-continuation qualifier on all retrospective §8
  verdicts and promotion recommendations.

## Provisional-items trail (V4.2 — feeds retrospective §8, may not be blank)
- 2026-07-27 — trail opened.
- 2026-07-27 — security-reviewer/security-review deliberately not
  triggered: auth deferred to V2/V3. Re-evaluate when observability
  touches API surfaces.
- 2026-07-27 — **scheduled by the Layers 4–6 fork decision:**
  `playbooks/design-handoff.md` + `playbooks/visual-parity-review.md`
  (will run around the panel's implementation) and
  `playbooks/visualization-prompting.md`'s credit-exhaustion
  code-first section (expected to trigger at the panel build —
  second-project data point if it does).

## Upgrade scope — FINAL (full detail in product-prd.md)
Priority: 1 doc-drift fix → 2 golden benchmark (script-only; baseline
pre-swap) → 3 embedding swap → 4 misdetection fix ("Unknown" state) →
5 LLM observability (Dashboard panel; visual pass confirmed) → 6
screen-reader → 7 testing closeout. Out list unchanged — see PRD.

## Key decisions
- **Layers 4–6 fork (2026-07-27):** option (a) — visual pass for the
  panel. Reasoning recorded: screen changes without an approved
  reference contradict the project's own strongest finding (visual
  defects were caught only by mock-vs-real comparison); also
  exercises three provisional items this phase owes verdicts on.
- **Item 5 surface:** Dashboard global panel. **Item 2:** script-only.
- **ADR-007:** Kit V4.2 adopted, verified.
- All prior decisions unchanged.

## Open questions
- Awaiting from the person: the Magic Patterns URL/ID of the approved
  Dashboard artifact (code-first retrofit target).
- Awaiting via agent relay: design-language.md, design-tokens.md,
  Dashboard brief + component-specs slice (brief inputs).
- Framework-review conversation — separate track, unchanged.

## Current blocker
None — brief inputs in flight.

## Last completed action
Fork (a) recorded; brief-input relay task issued — 2026-07-27.

## Next valid moves
1. Person runs the read-relay task + supplies the Magic Patterns
   Dashboard URL.
2. Orchestrator compiles the retrofit screen brief
   (docs/06-components/briefs/dashboard-observability-panel.md) →
   code-first build in Magic Patterns → compliance pass → human
   visual approval gate.
3. Then: architect light-pass check (benchmark harness +
   observability counters vs. ADR-004 stack) can proceed in parallel
   with the visual pass if the person wants — it doesn't depend on
   the panel's pixels.

## Files changed last round
- `PROJECT-STATE.md` (this file)
