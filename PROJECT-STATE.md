# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 7, Groups 0-3 CLOSED. Groups 4-5 are the last
remaining work in the ENTIRE Upgrade phase.**

**Hash convention:** as of 2026-07-31, `main` HEAD `b0dab84`
(unchanged — item 7's work is on `upgrade/item7-closeout`, not yet
merged). Branch commits through this round: `1f5b19f`, `6b86504`,
`fb88852`, `241241f`, `86f2300`, `878abd0`.

## Item 7 — status
| Group | Scope | Status |
|---|---|---|
| 0 | check-got.ts | ✅ CLOSED |
| 1 | boxen + got | ✅ CLOSED |
| 2 | BATCH_SIZE length-awareness | ✅ CLOSED |
| 3 | Inter font-resolution | ✅ CLOSED |
| 4 | IMPORT-04 + PREPROC-03 | **NEXT — last real verification work** |
| 5 | Remaining Dashboard/Explorer testing.md rows | **NEXT — same task** |

## Coding-agent policy — reverts to standard complexity-split
Placement always Claude Code (permanent). Last round's Groups 2-3 on
Claude Code was an explicit one-time exception for consistency, not a
standing change. **Groups 4-5 default to Kilo Code** (routine
verification against already-specified acceptance criteria, no
investigation needed) — pending the person's confirm or override,
same choice offered every round this pattern applies.

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — COMPLETE. 3 swap —
CLOSED: HELD. 4 "Unknown" — CLOSED. 5 observability — CLOSED, merged.
6 screen-reader — CLOSED, merged. **7 closeout — Groups 0-3 closed;
Groups 4-5 are the last item in the whole Upgrade phase.**

## Open questions
- Groups 4-5's agent routing (this round's live question).
- Item 7's eventual branch merge — likely the final merge of the
  entire phase.
- Documentation-mitigation study, cloud-embedding scoping — deferred
  past this phase, real future work.
- **Framework-review conversation** — separate track, now genuinely
  substantial: three confirmed instances of docs-describing-unbuilt-
  architecture, multiple deletion-gate/orchestrator-error catches in
  both directions, a complete falsified-hypothesis arc (item 3), and
  a full live-audit-to-fix cycle (item 6) — real material for
  updating the shared kit.

## Current blocker
None.

## Last completed action
Groups 2-3 closed with real evidence; Groups 4-5 identified as the
final work of the phase — 2026-07-31.

## Next valid moves
1. Place this round's two files.
2. Confirm Groups 4-5 routing (Kilo Code proposed).
3. Run Groups 4-5.
4. Merge upgrade/item7-closeout into main — closes item 7 and the
   entire Trailhead Upgrade phase.
5. Compile the phase-close retrospective (kit-required, per
   RETROSPECTIVE.template.md) — the real next piece of work after
   this phase ends.

## Files changed last round
- (pending this round's placement)
