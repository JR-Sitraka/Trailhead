# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 2 CLOSED on main. Item 4: verification complete, one
scoped fix in flight (Kilo Code).** Item 3 (swap research) opens the
moment item 4's fix lands.

**Hash convention:** as of 2026-07-28, `main` HEAD `780c851`
(item-2-into-main merge; 30 files, additive only, all under
`benchmark/` + two pre-authorized config lines — confirmed via diff).
`upgrade/benchmark-harness` retained, not deleted, per instruction.

## Item 2 — CLOSED
Ten merge-chain hashes confirmed as ancestors of `780c851`, verified
individually: `db7f433`, `0ded4e5`, `8495460`, `47313dd`, `57544d1`,
`68b7267`, `df9237b`, `c94aaa2`, `530365a`, `da9f073`. Zero rebases
across the entire item's branch life. Baseline results (the
comparison point for item 3) live permanently in `testing.md` and
this file's prior rounds — not restated here to avoid drift between
copies; see `benchmark/reports/BASELINE-2026-07-28T18-02-00-408Z.json`
for the canonical artifact.

## Item 4 — verification complete, ADR-010 mostly validated
**JSON export: VERIFIED as spec-compliant** — `framework: null`
(and siblings) pass through untouched, no fix needed.
**Overview: GAP found and scoped** — renders `"Not detected"` instead
of `"Unknown"` for null stack facts
(`src/app/repositories/[id]/overview/page.tsx:115`). Fix: change the
`displayValue` fallback string for all five stack fields; underlying
`null` data flow unchanged. No regression risk (no test asserts the
old string). **Fix issued to Kilo Code this round** — one-line,
mechanical, low-risk, the exact shape of task its category exists
for.

## Coding-agent policy — MIXED, first real Kilo data point positive
Kilo Code's debut (item 4 verification): precise, bounded, real
server evidence for both checks, no scope creep, explicitly declined
to fix without confirming scope first. Policy holding as designed —
Claude Code closed the multi-round item-2 branch cleanly; Kilo Code
handled the light, well-specified verification correctly.

## Baseline results — unchanged, still the comparison point for item 3
Semantic Top-1 = 0.000 → known_code Top-1 = 0.250 → TRAP-06 total
displacement, in priority order. Full table: `testing.md`'s baseline
append and the committed report.

## Key decisions
ADR-010 (item 4 re-scope, now substantially validated), ADR-008,
ADR-007, ADR-005 amended. ADR-009 reserved for the model choice.

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged; `session-recovery.md` still untriggered across the entire
implementation phase so far — worth a §8 note either way.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — **COMPLETE, merged,
closed.** 3 swap — **unblocks once item 4's fix lands**; ADR-009
reserved. **4 "Unknown" — verification done, one scoped fix in
flight.** 5 observability — handoff frozen. 6 screen-reader — plan
placed. 7 closeout — boxen zero-files + got orphaned-state.

## Open questions
- Framework-review conversation — separate track. (Item 2's clean
  merge-chain discipline and Kilo's clean debut are both real §8
  candidates.)

## Current blocker
None.

## Last completed action
Item 2 formally closed on main; item 4 gap scoped and fix issued —
2026-07-28.

## Next valid moves
1. Place this round's 2 files.
2. Kilo Code implements the Overview display fix + the new test.
3. Item 3 (swap) research opens on Claude Code, armed with three
   ranked baseline targets → ADR-009.

## Files changed last round
- `PROJECT-STATE.md`, `docs/08-features/repository-overview.md`
  (verification-result append) — not yet placed
