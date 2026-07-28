# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 2 (benchmark) stage B, at the SYMBOL ground-truth
gate.** Query gate passed and manifest written (branch
`upgrade/benchmark-harness`, commits `0ded4e5` queries+trap-rank,
`8495460` proposed symbols; branch HEAD is the merge `0f8a19c…` plus
those). Main HEAD `3e8e51d`. 26 symbols proposed and
content-verified by the agent; **person verification is the last gate
before the baseline.**

## Approval gates passed
- 2026-07-27 — observability panel visual approval (all four states).
- 2026-07-28 — benchmark QUERY ground truth approved (31 queries).
- *(OPEN: symbol ground truth — 26 proposed, person verification
  pending. BENCH-06 invalid until then.)*

## Smoke-run results — INDICATIVE ONLY, not the baseline (2026-07-28)
Run with the approved query set before symbol curation; recorded
because the findings are substantive, but **BENCH-04's baseline is a
separate, later, committed artifact.**
- Retrieval overall: Top-1 **0.258**, Top-3 **0.581**
- known_code Top-1 0.25 / Top-3 0.5 · filename_trap 0.375 / 0.75 ·
  **semantic Top-1 0.000 / Top-3 0.286** · documentation 0.375 / 0.75
- Trap outranked correct in **2 of 8** (0.25): TRAP-06 and TRAP-08.
- **TRAP-06 is a textbook reproduction of the defect item 3 targets:**
  `docs/08-features/export.md` ranks 1; `src/server/services/export.ts`
  is absent from the top 50 — total displacement of implementation by
  specification.
- **Semantic Top-1 = 0.000** is the strongest quantitative statement
  yet of why item 3 exists; expected headline of the baseline-vs-swap
  comparison.
- Framework detection: **1.0 (5/5)** — see item 4 note below.
- Symbol resolution: n/a (pending curation); DALL-E and awesome
  contribute no data, never scored as 0%.

## Item 4 observation (2026-07-28)
Framework detection already scores 5/5 at smoke, so ADR-010's
verification criterion is **essentially satisfied at baseline**. What
remains is the display side: confirm what Overview actually renders
today for a null framework, and whether JSON already emits
`framework: null`. Item 4 may be nearly complete — to be checked, not
assumed.

## Measurement rules — LOCKED (benchmark.md amendment, 2026-07-28)
File-level ranking; depth 50; rank = best chunk position per file;
first-occurrence duplicate collapse; deterministic tie order.
Changing any invalidates comparability and requires a new baseline.
Validator rejects a trap query with no trap file, or whose trap is
its own ground truth.

## Process lesson — orchestrator error, logged for the retrospective
Last round's state file listed `benchmark/manifest.json` under "Files
changed last round" **before the task that writes it had run** — a
doc asserting an artifact into existence ahead of the work, the same
failure class as the corpus-never-instantiated finding, committed by
the orchestrator two rounds after logging it. Caught by the coding
agent, not by the orchestrator. **Corrective rule adopted: "Files
changed last round" lists only what is already placed; in-flight work
belongs under "Next valid moves."**

## Ground-truth corrections
- **KC-05 rationale corrected:** got has TWO `TimeoutError` classes —
  `source/core/timed-out.ts:35` (internal) and `source/core/errors.ts:138`
  (public, extends `RequestError`). The latter is KC-05's ground
  truth. The question stands as written; the recorded *reason* for
  the earlier edit was incomplete and is fixed in the manifest so a
  wrong rationale cannot resurface as a wrong decision.
- Symbol sample includes that name collision deliberately — nothing
  else in the corpus pins that symbol resolution is file-scoped
  rather than name-global.

## Key decisions
- ADR-010 (item 4 re-scope), ADR-008 (corpus + bench DB), ADR-007
  (kit V4.2). ADR-009 reserved for the model choice.
- Merge (not rebase) is the standing branch-update method: rebasing
  would rewrite hashes this state file asserts as fact.

## Standing project rules / Coding-agent trial
Claude Code has now: stopped at two gates rather than guessing,
corrected this file when its wording outran the evidence, caught the
orchestrator asserting an unwritten artifact, and chosen merge over
rebase for a stated principled reason. **Person's verdict still
owed.**

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged; `session-recovery.md` still untriggered.

## Upgrade scope — status
1 doc-drift — substantially DONE. **2 benchmark — stage B, symbol
gate.** 3 swap — gated on BENCH-04; ADR-009 reserved; TRAP-06 and
semantic-0.000 now give it hard target cases. 4 "Unknown" — possibly
near-complete, see observation above. 5 observability — handoff
frozen. 6 screen-reader — plan placed. 7 closeout — boxen zero-files
+ got orphaned-state.

## Open questions
- Person verification of the 26 proposed symbols.
- Item 4's display-side check.
- Framework-review conversation — separate track.

## Current blocker
The symbol ground-truth gate (by design).

## Last completed action
Query manifest written; trap-rank implemented; smoke run executed;
26 symbols proposed and content-verified — 2026-07-28.

## Next valid moves
1. Place the ranking amendment + this file on `main`; fix KC-05's
   note and emit symbol permalinks on the branch.
2. Person verifies the 26 symbols → symbol gate passes.
3. Stage B completes: BENCH-03/04/05/06 → committed baseline.
4. Then item 3 (swap) research → ADR-009.

## Files changed last round
- `docs/10-decisions/adr-010-item4-rescope.md`,
  `docs/08-features/repository-overview.md`,
  `docs/08-features/benchmark.md`, `PROJECT-STATE.md` (main,
  `3e8e51d`)
- `benchmark/manifest.json`, `benchmark/setup/verify-paths.ts`,
  `benchmark/setup/verify-symbols.ts`,
  `benchmark/candidates/proposed-symbols.json`, runner trap-rank
  changes (branch, `0ded4e5` + `8495460`)
