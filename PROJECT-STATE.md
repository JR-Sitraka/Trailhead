# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — IMPLEMENTATION, item 2 (golden benchmark), stage A.**
Planning complete through Layer 9 (`a4647e1`); design handoff frozen
(`35ab684`). Benchmark stage-A packet issued 2026-07-27; execution
paused one round for a tooling decision (below), now resolved.

## Approval gates passed
- 2026-07-27 — Dashboard observability panel: human visual approval,
  all four states (artifact `cfe1be53…`).
- *(Pending, stage B gate: ground-truth approval for the benchmark.)*

## Standing project rules (this phase)
- All repo file placement/commits are Claude Code tasks, full packet
  every round.
- Same-codebase-continuation qualifier on §8 verdicts/promotions.

## Coding-agent trial (2026-07-27)
**Decision:** implement this round (benchmark stage A) with **Claude
Code**, as a real trial, not a default. **Explicit switch criterion,
decided in advance so the verdict isn't rationalized after the fact:**
if the person is satisfied with how Claude Code handles the task
packet → continue with it as the standing tool. If not → switch to
**Kilo Code** directly for all subsequent implementation, logged as an
`ADR-005` update at that point.
**Hermes Agent considered and explicitly declined for now** — real
tool (Nous Research, Feb 2026), but architecturally a persistent,
self-improving-skills agent, not a per-task session tool like Claude
Code/Kilo Code. Its auto-generated skills could apply themselves
across sessions independent of this kit's explicit task-packet
routing — a real, structural conflict with `orchestrator.md`'s model
where the planning assistant decides all context per task. Not
ruled out permanently; ruled out for "try it this round."
**Mechanical check still owed before any future switch:** confirm
whether the new tool's persistent-instructions behavior matches
Kilo's confirmed behavior (loads `AGENTS.md` every session; only
`@file` mentions are selective) before assuming task packets built
for Claude Code's conventions transfer as-is.

## Provisional-items trail (V4.2 — feeds retrospective §8)
- 2026-07-27 — security-reviewer deliberately not triggered.
- 2026-07-27 — credit-exhaustion section: code-first by choice,
  exhaustion not re-observed.
- 2026-07-27 — design-handoff.md USED (first live run) — findings
  logged in prior round's entry, unchanged.
- visual-parity-review.md — scheduled, after item 5's build.
- session-recovery.md — now live-relevant (implementation underway).

## Upgrade scope — FINAL, with status
1 doc-drift — substantially DONE. 2 benchmark — IN PROGRESS (stage
A). 3 swap — spec done, gated on BENCH-04. 4 "Unknown" — spec done,
not implemented. 5 observability — design+spec+handoff done, not
implemented. 6 screen-reader — plan placed. 7 closeout — targets
restated.

## Key decisions
- Benchmark curation = split: person authors filename-trap category;
  agent proposes the other three categories for review.
- Two-stage build: stage A = harness + corpus manifest + unapproved
  candidates; stage B = ground-truth lock + BENCH-04 baseline.
- Coding-agent trial criteria as above.
- All prior decisions unchanged.

## Open questions
- Corpus identity — stage A's first job, to be reported.
- Framework-review conversation — separate track.

## Current blocker
None.

## Last completed action
Coding-agent trial decision recorded; benchmark stage-A packet
reissued unchanged — 2026-07-27.

## Next valid moves
1. Run the (unchanged) stage-A packet with Claude Code; relay report.
2. Person authors trap-category queries in parallel (guidance given
   in chat this round).
3. After stage A + trap queries: ground-truth review/merge → gate →
   stage B baseline.
4. At this round's close, person gives a satisfaction verdict on
   Claude Code for the switch decision above.

## Files changed last round
- `PROJECT-STATE.md` (this file)
