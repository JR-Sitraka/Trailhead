# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — ITEM 2 (BENCHMARK) COMPLETE.** Committed baseline exists
and is the locked comparison point for item 3. Item 4's display check
(Kilo Code's first task) and the branch-merge decision are next.

**Hash convention:** hashes are stamped "as of" a date. As of
2026-07-28: `main` HEAD `9b6584a`; branch
`upgrade/benchmark-harness` HEAD `530365a`.

## Approval gates passed
- 2026-07-27 — observability panel visual approval (all four states).
- 2026-07-28 — benchmark QUERY ground truth approved (31 queries).
- 2026-07-28 — benchmark SYMBOL ground truth approved (26/26).
- **2026-07-28 — BASELINE COMMITTED**
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
Trap-rank: 2/8 outranked (0.25) — TRAP-06 (total displacement:
`export.md` rank 1, `export.ts` outside top 50) and TRAP-08.
Framework detection 1.000 (5/5, nulls scored per ADR-010). Symbol
resolution 1.000 (26/26; DALL-E/awesome report as no-data, not 0%).
**Jitter (BENCH-05): zero movement across 2 runs — stated honestly as
practical stability for this set, NOT a determinism proof** (KNOWN-
GOOD 2026-07-23: query-embedding drift is real, visible only on
near-ties). **Noise floor for post-swap comparison: ±1 rank on
near-tied candidates is possible noise; rest verdicts on
category-level movement.**

**What item 3 must beat, priority order:** (1) semantic Top-1 = 0.000,
(2) known_code Top-1 = 0.250, (3) TRAP-06's total displacement.

## Coding-agent policy — MIXED (ADR-005 amendment, 2026-07-28)
Baseline ran on Claude Code per its own context-heavy/hard-gated-
artifact criterion — confirmed the right call in hindsight (four
stacked amendments held correctly, promotion round-trip-verified
rather than hand-edited, jitter honestly qualified rather than
oversold). **Kilo Code's first real assignment is next: item 4's
display check** — light, well-specified, a fair first test.

## Item 4 observation (open, next task)
Framework detection scores 5/5 at the real baseline (not just smoke).
Remaining: confirm Overview's null-framework render and whether JSON
already emits `framework: null`.

## Measurement rules — LOCKED, now proven in a real run
File-level ranking, depth 50, best-chunk rank, first-occurrence
collapse, deterministic ties. `manifestVersion` frozen at 1.0.0;
`manifest.versioningRule` states any change to queries/symbols/
corpus pins/locked parameters requires a version bump AND a new
baseline — a cross-version comparison is explicitly "not a valid
comparison and must not be reported as one."

## Process notes
- `docs/09-testing/testing.md` BENCH-01…07 rows still read "Not yet
  tested" — flagged by the agent as out of this round's scope,
  corrected via this round's append (below), not left dangling.
- Prior round's stale "not yet placed" wording (self-caught by the
  agent, not fixed then) — corrected: this file's "Files changed"
  section below reflects actual placement status only.

## Key decisions
ADR-010 (item 4 re-scope), ADR-008 (corpus + bench DB), ADR-007 (kit
V4.2), ADR-005 amended (mixed agent policy). ADR-009 reserved for the
model choice, now with concrete numbers to beat. Merge-never-rebase
verified across seven branch divergences.

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged; `session-recovery.md` still untriggered across the entire
implementation phase — worth noting in §8 as either good luck or a
sign the checkpoint discipline is working.

## Upgrade scope — status
1 doc-drift — substantially DONE. **2 benchmark — COMPLETE.** 3 swap
— UNBLOCKED, ADR-009 reserved, three ranked targets identified. 4
"Unknown" — display check queued (Kilo Code). 5 observability —
handoff frozen. 6 screen-reader — plan placed. 7 closeout — boxen
zero-files + got orphaned-state.

## Open questions
- Branch-merge timing: merge `upgrade/benchmark-harness` into `main`
  now that item 2 is complete, or hold until item 3 also lands there?
- Framework-review conversation — separate track.

## Current blocker
None.

## Last completed action
Baseline committed and reviewed; testing.md append drafted —
2026-07-28.

## Next valid moves
1. Place this round's 2 files (testing.md append + this file).
2. Kilo Code: item 4's display check.
3. Branch-merge decision.
4. Item 3: model research begins → ADR-009.

## Files changed last round
- `benchmark/manifest.json` (symbols promoted, version frozen),
  `benchmark/reports/BASELINE-*` + `BASELINE-README.md` (branch,
  `c94aaa2` + `530365a`)
