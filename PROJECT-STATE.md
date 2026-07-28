# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 2 (benchmark) stage B: both ground-truth gates
passed; BASELINE RUN is the next and final step.** Awaiting the
person's confirm on which agent runs it (see Coding-agent policy).

**Hash convention:** hashes are stamped "as of" a date; treat an
undated hash as possibly stale. As of 2026-07-28: `main` HEAD
`1f7cbe3`; branch `upgrade/benchmark-harness` HEAD `68b7267`.

## Approval gates passed
- 2026-07-27 — observability panel visual approval (all four states).
- 2026-07-28 — benchmark QUERY ground truth approved (31 queries).
- 2026-07-28 — benchmark SYMBOL ground truth approved (26/26,
  person-verified against pinned-commit source). BENCH-06 unblocked.

## Coding-agent policy — MIXED, adopted 2026-07-28 (ADR-005 amendment)
Claude Code trial **satisfactory, person-confirmed**, after a full
implementation arc (stage A gate, ADR-008 resolution, ground-truth
review, ranking-rule change, symbol verification support) —
real evidence: stopped correctly at two gates, caught the
orchestrator's own error, chose and verified merge-over-rebase across
six branch divergences, declared what it had not verified.
**Policy going forward: Claude Code for context-heavy/hard-gated-
artifact tasks; Kilo Code for routine/well-specified tasks**, to
conserve Claude usage. Every task packet states its intended agent
and a one-line reason from now on. No environment check needed for
Kilo — its confirmed persistent-file behavior is what this kit's
packet format was already built against.
**This round's live routing question:** the baseline run (BENCH-03/
04/05/06) is, by the policy's own criterion, context-heavy and
produces a hard-gated artifact — orchestrator recommends it stay on
Claude Code, with Kilo Code starting instead on the next task (item
4's display check, genuinely light). Awaiting the person's confirm or
override.

## Smoke-run results — INDICATIVE ONLY, superseded by the baseline
Retrieval overall Top-1 **0.258**, Top-3 **0.581**; **semantic Top-1
0.000**; trap outranked correct in **2 of 8**; **TRAP-06** = total
displacement; framework detection **1.0 (5/5)**.

## Item 4 observation (open check)
Framework detection already scores 5/5 at smoke. Remaining: confirm
Overview's null-framework render and whether JSON emits
`framework: null`. This is the proposed first Kilo Code task.

## Measurement rules — LOCKED (benchmark.md, 2026-07-28)
File-level ranking; depth 50; rank = best chunk position per file;
first-occurrence collapse; deterministic ties. Recorded as structured
fields in `manifest.lockedComparisonParameters`.

## Process lesson (retained for retrospective)
A prior state file asserted an unwritten artifact into existence —
caught by the coding agent, not the orchestrator. Corrective rules in
force: "Files changed last round" lists only what's placed; hashes
carry date qualifiers.

## Ground-truth corrections on record
KC-05: got has two `TimeoutError` classes; the public one
(`errors.ts:138`) is ground truth; question unchanged, rationale
corrected as a separate field.

## Key decisions
- ADR-010 (item 4 re-scope), ADR-008 (corpus + bench DB), ADR-007
  (kit V4.2), **ADR-005 amended (mixed coding-agent policy,
  2026-07-28)**. ADR-009 reserved for the model choice.
- Merge, never rebase, for branch updates — verified across six
  divergences, all prior hashes preserved.

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged; `session-recovery.md` still untriggered across the whole
implementation phase.

## Upgrade scope — status
1 doc-drift — substantially DONE. **2 benchmark — baseline is the
last step; agent routing pending confirm.** 3 swap — unblocks on
baseline commit; ADR-009 reserved; hard targets identified (TRAP-06,
semantic Top-1=0). 4 "Unknown" — display check queued as first Kilo
task. 5 observability — handoff frozen. 6 screen-reader — plan
placed. 7 closeout — boxen zero-files + got orphaned-state.

## Open questions
- **Baseline agent routing** — Claude Code (recommended) vs. Kilo.
- Whether to merge `upgrade/benchmark-harness` into `main` once the
  baseline commits.
- Framework-review conversation — separate track.

## Current blocker
None — awaiting the routing confirm to issue task 2.

## Last completed action
Mixed coding-agent policy adopted and logged (ADR-005 amendment);
routing question raised for the baseline — 2026-07-28.

## Next valid moves
1. Person confirms baseline routing.
2. Baseline runs (BENCH-03/04/05/06) → committed.
3. Kilo Code's first task: item 4's display check.
4. Then item 3 (swap) research → ADR-009.

## Files changed last round
- `docs/10-decisions/adr-005-tool-setup.md` (amendment, this round —
  not yet placed)
- `PROJECT-STATE.md` (this file, not yet placed)
