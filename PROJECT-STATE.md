# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — IMPLEMENTATION, item 2 stage A, resuming after the
corpus gate.** Stage A's discovery gate stopped correctly: the
"5-repo corpus" was never instantiated (best finding of the phase so
far — a fact asserted into existence across seven doc locations).
Resolved by ADR-008; resumption packet issued 2026-07-28.

## Approval gates passed
- 2026-07-27 — observability panel visual approval (all four states).
- *(Pending: benchmark ground-truth gate, stage B.)*

## Standing project rules / Coding-agent trial
Unchanged — trial of Claude Code in progress; switch criterion on
record (satisfied → keep; not → Kilo Code, ADR-005 update). Early
evidence FOR: the stage-A stop-at-gate behavior and the quality of
the corpus investigation. Verdict still the person's, at round close.

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged from last round (design-handoff used; parity scheduled;
security-reviewer not triggered; credit-exhaustion nuance;
session-recovery live-relevant).

## Upgrade scope — status
1 doc-drift — substantially DONE. **2 benchmark — stage A resuming
under ADR-008** (corpus: Trailhead / got / escape-string-regexp /
DALL-E / awesome; dedicated `trailhead_bench` DB). 3 swap — gated on
BENCH-04; its ADR is now **ADR-009** (renumbered). 4 "Unknown" —
spec done. 5 observability — handoff frozen. 6 screen-reader — plan
placed. 7 closeout — now also carries the **boxen zero-files defect**
and the got-orphaned-state observation (logged in testing.md,
deliberately not chased now).

## Key decisions
- **ADR-008 (2026-07-28):** corpus enumerated + `trailhead_bench`
  dedicated DB + ADR renumbering (model choice → ADR-009). Spec
  amendments to benchmark.md and embedding-swap.md placed.
- boxen defect: log-don't-chase, folded into item 7 (ADR-008).
- All prior decisions unchanged.

## Open questions
- Framework-review conversation — separate track. (Corpus-never-
  instantiated finding queued for the phase retrospective.)

## Current blocker
None.

## Last completed action
ADR-008 + three spec amendments drafted; stage-A resumption packet
issued — 2026-07-28.

## Next valid moves
1. Place this round's files; run the resumption packet on the
   existing `upgrade/benchmark-harness` branch.
2. Person drafts trap queries against the now-named corpus (guidance
   from two rounds ago now has real targets — got and Trailhead are
   the richest trap sources).
3. Stage A report → ground-truth review/merge → gate → stage B
   baseline. Claude Code verdict at round close.

## Files changed last round
- `docs/10-decisions/adr-008-benchmark-corpus-and-db.md` (new)
- `docs/08-features/benchmark.md` (amendment APPENDED)
- `docs/08-features/embedding-swap.md` (amendment APPENDED)
- `docs/09-testing/testing.md` (boxen gap APPENDED)
- `PROJECT-STATE.md` (this file)
