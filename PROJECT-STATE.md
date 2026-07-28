# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 2 (benchmark) stage B: BOTH GROUND-TRUTH GATES
PASSED. Baseline run is the next and final step of item 2.**

**Hash convention (adopted 2026-07-28):** hashes below are stamped
"as of" a date because they move. A hash without a date qualifier
should be treated as possibly stale, not as a current fact.
- As of 2026-07-28: `main` HEAD `982fa88`; branch
  `upgrade/benchmark-harness` HEAD `57544d1`.

## Approval gates passed
- 2026-07-27 — observability panel visual approval (all four states).
- 2026-07-28 — benchmark QUERY ground truth approved (31 queries).
- **2026-07-28 — benchmark SYMBOL ground truth approved: 26/26
  verified by the person against source at the pinned commits.**
  Focused confirmations: the two `TimeoutError` classes are genuinely
  distinct and file-scoped (`errors.ts:138-149` extends
  `RequestError`; `timed-out.ts:35-44` extends `Error`);
  `detectStackFacts` at `stackFacts.ts:113-187` is valid dual
  function/export extraction, not duplication; got's
  `calculateRetryDelay` shows declaration `5-40` and export statement
  at `42` as separate ranges — real evidence the extractor does not
  collapse declarations into exports; the three non-exported helpers
  confirm extraction is not export-gated. **BENCH-06 is unblocked.**

## Smoke-run results — INDICATIVE ONLY, superseded by the baseline
(2026-07-28, pre-symbol-curation) Retrieval overall Top-1 **0.258**,
Top-3 **0.581**; **semantic Top-1 0.000**; trap outranked correct in
**2 of 8**; **TRAP-06** = total displacement (`export.md` rank 1,
`export.ts` absent from top 50); framework detection **1.0 (5/5)**.
These are indicative; BENCH-04's committed baseline is the recorded
comparison point.

## Item 4 observation (open check)
Framework detection already scores 5/5, so ADR-010's verification
criterion looks satisfied at baseline. Remaining: confirm what
Overview renders today for a null framework, and whether JSON already
emits `framework: null`. **Deferred one round on purpose** — the
baseline packet stays single-purpose rather than mixing concerns.

## Measurement rules — LOCKED (benchmark.md, 2026-07-28)
File-level ranking; depth 50; rank = best chunk position per file;
first-occurrence collapse; deterministic ties (`ORDER BY
cosine_distance ASC, id ASC`). Recorded in
`manifest.lockedComparisonParameters` as structured fields so a
future diff shows a parameter change as a one-line change. Changing
any invalidates comparability and requires a new baseline.

## Process lesson — orchestrator error (retained for retrospective)
A prior state file listed a file under "Files changed last round"
before the task writing it had run — the same failure class as the
corpus-never-instantiated finding, committed by the orchestrator and
caught by the coding agent. **Corrective rules now in force:** (1)
"Files changed last round" lists only what is already placed; (2)
hashes carry date qualifiers.

## Ground-truth corrections on record
- KC-05: got has two `TimeoutError` classes; the public one
  (`errors.ts:138`) is KC-05's ground truth. Question unchanged; the
  recorded rationale was wrong and is corrected in the manifest as a
  separate `rationaleCorrection` field rather than overwritten — the
  correction stays legible.

## Key decisions
- ADR-010 (item 4 re-scope), ADR-008 (corpus + bench DB), ADR-007
  (kit V4.2). ADR-009 reserved for the model choice.
- **Merge, never rebase**, for branch updates — rebasing would
  rewrite hashes this file asserts as fact. Confirmed doing real work
  twice (`db7f433`, `0ded4e5`, `8495460` all preserved).

## Standing project rules / Coding-agent trial
Claude Code across item 2: stopped at two gates rather than guessing,
corrected this file twice when its wording outran the evidence,
caught the orchestrator asserting an unwritten artifact, chose merge
over rebase for a stated reason, and declared honestly what it had
NOT verified (never opened the permalinks it generated). **Person's
verdict still owed — item 2's completion is the natural switch point
if one is wanted.**

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged; `session-recovery.md` still untriggered across the whole
implementation phase so far.

## Upgrade scope — status
1 doc-drift — substantially DONE. **2 benchmark — baseline run is
the last step.** 3 swap — unblocks the moment the baseline commits;
ADR-009 reserved; hard targets already identified (TRAP-06's total
displacement; semantic Top-1 = 0.000). 4 "Unknown" — possibly
near-complete, display check pending. 5 observability — handoff
frozen. 6 screen-reader — plan placed. 7 closeout — boxen zero-files
+ got orphaned-state.

## Open questions
- Item 4's display-side check (next round).
- Whether to merge `upgrade/benchmark-harness` into `main` once the
  baseline commits, closing item 2.
- Framework-review conversation — separate track.

## Current blocker
None.

## Last completed action
Symbol ground truth verified 26/26 by the person and approved;
permalink sheet and locked parameters placed — 2026-07-28.

## Next valid moves
1. Promote the 26 symbols into `manifest.symbolGroundTruth`; run
   BENCH-03/04/05/06; commit the baseline.
2. Then: item 4's display check, the branch-merge decision, and item
   3's research → ADR-009.

## Files changed last round
- `docs/08-features/benchmark.md`, `PROJECT-STATE.md` (main,
  `982fa88`)
- `benchmark/manifest.json` (KC-05 correction + locked parameters),
  `benchmark/candidates/proposed-symbols-review.md`,
  `benchmark/setup/emit-symbol-review.ts` (branch, `57544d1`)
