# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 2 (benchmark) STAGE B opening. GROUND-TRUTH GATE
PASSED for queries (2026-07-28).** 31 queries approved; symbol ground
truth is stage B's first step, then the baseline.

## Approval gates passed
- 2026-07-27 — observability panel visual approval (all four states).
- **2026-07-28 — benchmark QUERY ground truth approved** (31 queries:
  8 known_code, 7 semantic, 8 documentation, 8 person-authored
  filename_trap). Four open calls resolved by the person: SEM-02 and
  DOC-02 rewrites approved, SEM-05 dropped, TRAP-04 trap swapped to
  `documentation/3-streams.md` (the original fixture contains only
  the word "Unicorns" — a nominal trap, not a material one), TRAP-07
  trap diversified to `tests/symbols.test.ts`.
- *(OPEN: symbol ground truth — approach approved, curation pending;
  BENCH-06 invalid until person-verified.)*

## Benchmark corpus — REAL, verified (2026-07-28)
`trailhead_bench` (pgvector 0.8.5): Trailhead `19221f3d…`
(225/1047/1471), got (127/1666/2481), escape-string-regexp (13/6/15),
DALL-E (11/0/22), awesome (23/0/50). BENCH-01/02/07 Agent-verified.

## Ground-truth rules adopted
- Test files are never valid ground truth — the question is always
  "where is this implemented."
- A file may be ground truth for one query and a trap for another
  (e.g. `documentation/4-pagination.md`: ground truth for DOC-04,
  trap for TRAP-01) — deliberate; it tests discrimination by
  question rather than by file.
- **Trap-rank recording is mandatory** (benchmark.md amendment,
  2026-07-28): for trap queries the runner records the trap file's
  rank next to the correct file's, plus
  `trap_outranked_correct` and a category rate. Without it the
  swap's criterion 2 is unevaluable — it is a comparison, not an
  accuracy number. Binds the baseline too.
- `knownFramework`: only Trailhead is a positive case; the metric
  largely measures correct declining. Defensible under ADR-010,
  recorded as a known limitation; an Express/Vue corpus addition
  would strengthen it.
- Zero-symbol repos (DALL-E, awesome) report as contributing no data
  — never scored as 0% accuracy.

## Key decisions
- **ADR-010:** item 4 re-scoped from fix to verify + regression-proof
  (the got misdetection does not reproduce; `framework: null` is
  correct). ADR-009 stays reserved for the model choice.
- ADR-008 (corpus + bench DB + renumbering), ADR-007 (kit V4.2).

## Standing project rules / Coding-agent trial
Claude Code: stopped correctly at two gates, volunteered a correction
when this file's wording outran its own evidence. **Person's verdict
still owed.**

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged; `session-recovery.md` still untriggered.

## Upgrade scope — status
1 doc-drift — substantially DONE. **2 benchmark — stage B opening.**
3 swap — gated on BENCH-04; ADR-009 reserved. 4 "Unknown" —
re-scoped per ADR-010. 5 observability — handoff frozen. 6
screen-reader — plan placed. 7 closeout — carries boxen zero-files +
got orphaned-state.

## Open questions
- Symbol ground truth (in flight, stage B step 1).
- Framework-review conversation — separate track.

## Current blocker
None.

## Last completed action
Query ground-truth gate passed; manifest finalized; trap-rank
requirement added to benchmark.md — 2026-07-28.

## Next valid moves
1. Place ADR-010 + amendments + state on `main`; write approved
   queries into `benchmark/manifest.json` on the benchmark branch and
   propose the symbol sample.
2. Person verifies the symbol sample → BENCH-03/04/05/06 → committed
   baseline.
3. Then item 3 (swap) research → ADR-009.

## Files changed last round
- `docs/10-decisions/adr-010-item4-rescope.md` (new)
- `docs/08-features/repository-overview.md` (re-scope amendment
  APPENDED)
- `docs/08-features/benchmark.md` (trap-rank amendment APPENDED)
- `benchmark/manifest.json` (queries section written, status
  APPROVED — benchmark branch)
- `PROJECT-STATE.md` (this file)
