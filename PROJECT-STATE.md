# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — ITEM 2 (BENCHMARK) COMPLETE.** Branch merged into main
this round (see below). Item 4's display check is Kilo Code's first
real assignment.

**Hash convention:** hashes are stamped "as of" a date. As of
2026-07-28: `main` HEAD `d065a71` (pre-merge below); post-merge HEAD
recorded once this round's placement runs.

## Branch decision (2026-07-28): MERGE NOW
`upgrade/benchmark-harness` merges into `main` this round — item 2 is
a clean, self-contained unit of work with a committed baseline
already the permanent record in this file and testing.md; a shorter-
lived branch is less to keep straight than holding it open through
item 3. This task packet performs that merge.

## Merge-discipline count — named, not tallied (corrected 2026-07-28)
Prior round's state file claimed "verified across seven branch
divergences" — an off-by-one; the real count was eight
(`0f8a19c`, `47313dd`, `68b7267`, `df9237b`, `da9f073` are the merge
commits on the benchmark branch; the item-2-into-main merge below
will be the branch's closing one). **Going forward this section names
merge commits explicitly rather than stating a running count** — a
count is a number someone has to hand-verify and gets stale the
moment it's wrong once; a list is self-evidently complete or not.
Merge commits confirmed across item 2's work: `0f8a19c`, `47313dd`,
`68b7267`, `df9237b`, `da9f073`. Zero rebases used; zero prior hashes
rewritten, confirmed individually every round.

## Approval gates passed
- 2026-07-27 — observability panel visual approval (all four states).
- 2026-07-28 — benchmark QUERY ground truth approved (31 queries).
- 2026-07-28 — benchmark SYMBOL ground truth approved (26/26).
- 2026-07-28 — BASELINE COMMITTED
  (`benchmark/reports/BASELINE-2026-07-28T18-02-00-408Z.json`,
  manifestVersion 1.0.0, Xenova/all-MiniLM-L6-v2 384-dim).

## Baseline results — THE comparison point for item 3
| Category | Top-1 | Top-3 |
|---|---|---|
| known_code | 0.250 | 0.500 |
| filename_trap | 0.375 | 0.750 |
| semantic | **0.000** | 0.286 |
| documentation | 0.375 | 0.750 |
| **Overall** | **0.258** | **0.581** |
Trap-rank: 2/8 outranked (TRAP-06 total displacement; TRAP-08).
Framework detection 1.000 (5/5). Symbol resolution 1.000 (26/26).
Jitter: zero movement across 2 runs, stated as practical stability
for this set, not a determinism proof (KNOWN-GOOD 2026-07-23).
**Noise floor: ±1 rank on near-tied candidates is possible noise.**
**What item 3 must beat, priority order:** semantic Top-1 = 0.000 →
known_code Top-1 = 0.250 → TRAP-06's total displacement.

## Coding-agent policy — MIXED (ADR-005 amendment)
Claude Code: context-heavy/hard-gated-artifact tasks — proven across
item 2's full arc. **Kilo Code's first real assignment: item 4's
display check** (light, well-specified) — issued this round.

## Item 4 — Kilo Code task issued this round
Confirm what Overview renders today for a null framework, and
whether JSON already emits `framework: null`. Framework detection
already scores 5/5 at the real baseline (not just smoke), so this may
close item 4 almost entirely once the display side is confirmed.

## Measurement rules — LOCKED, proven in a real run
File-level ranking, depth 50, best-chunk rank, first-occurrence
collapse, deterministic ties. `manifestVersion` frozen at 1.0.0;
any change to queries/symbols/corpus pins/locked parameters requires
a version bump AND a new baseline.

## Key decisions
ADR-010 (item 4 re-scope), ADR-008 (corpus + bench DB), ADR-007 (kit
V4.2), ADR-005 amended (mixed agent policy). ADR-009 reserved for the
model choice, now with concrete numbers to beat.

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged; `session-recovery.md` still untriggered across the entire
implementation phase.

## Upgrade scope — status
1 doc-drift — substantially DONE. **2 benchmark — COMPLETE, merged.**
3 swap — UNBLOCKED, ADR-009 reserved. 4 "Unknown" — display check in
flight (Kilo Code). 5 observability — handoff frozen. 6 screen-reader
— plan placed. 7 closeout — boxen zero-files + got orphaned-state.

## Open questions
- Framework-review conversation — separate track. (Merge-discipline
  self-correction and the earlier orchestrator-error catch are both
  strong §8 candidates.)

## Current blocker
None.

## Last completed action
Merge-count correction applied; branch-merge decision made; item 4
task issued to Kilo Code — 2026-07-28.

## Next valid moves
1. Place this file; merge `upgrade/benchmark-harness` into `main`,
   closing item 2's branch.
2. Kilo Code runs item 4's display check.
3. Item 3: model research begins → ADR-009.

## Files changed last round
- `PROJECT-STATE.md` (this file, main — not yet placed this round)
