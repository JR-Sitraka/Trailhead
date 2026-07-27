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
(`35ab684`). First implementation packet issued 2026-07-27.

## Approval gates passed
- 2026-07-27 — Dashboard observability panel: human visual approval,
  all four states (artifact `cfe1be53…`).
- *(Pending, stage B gate: ground-truth approval for the benchmark —
  no labels become ground truth without it.)*

## Standing project rules (this phase)
- All repo file placement/commits are Claude Code tasks, full packet
  every round.
- Same-codebase-continuation qualifier on §8 verdicts/promotions.

## Provisional-items trail (V4.2 — feeds retrospective §8)
- 2026-07-27 — security-reviewer deliberately not triggered (auth →
  V2/V3; observability endpoint read-only, no sensitive data).
- 2026-07-27 — credit-exhaustion section: code-first by choice,
  exhaustion not re-observed.
- 2026-07-27 — **design-handoff.md USED** (first live run): caught
  the implicit wrapper ambiguity, the prototype-shortcut cycler, and
  surfaced the unlisted loading-state gap; timing finding logged
  (approval and implementation four items apart → early freeze).
- `visual-parity-review.md` — scheduled, after item 5's build.
- `session-recovery.md` — not yet needed; implementation has now
  begun, so it becomes live-relevant from this round on.

## Upgrade scope — FINAL, with status
1 doc-drift — substantially DONE; residual sweep folds into item 5.
2 benchmark — **IN PROGRESS (stage A)**.
3 swap — spec done; hard-gated on BENCH-04 baseline; ADR-008 pending.
4 "Unknown" — spec amendments placed, not implemented.
5 observability — design + spec + handoff done, not implemented.
6 screen-reader — test plan rows placed.
7 closeout — targets restated in testing.md.

## Key decisions
- **Benchmark curation = split (option c, 2026-07-27):** the person
  authors the filename-trap category himself (those labels test the
  exact defect item 3 fixes, so anchoring risk is unacceptable
  there); the agent proposes candidates for the other three
  categories, which the person verifies and edits before anything is
  committed as ground truth.
- **Two-stage build:** stage A produces the harness, the corpus
  manifest, and *candidate* queries clearly marked unapproved; stage
  B locks ground truth and runs BENCH-04's baseline. No baseline run
  is valid before the ground-truth gate passes.
- Full conversation history kept, Groq limits stated honestly
  (confirmed 2026-07-27).
- Loading state for the panel = metrics-unavailable treatment.
- All prior decisions unchanged.

## Open questions
- **Corpus identity:** the 5 benchmark repositories are referenced
  across PRD/testing.md but never enumerated in one place. Stage A's
  first job is to find them in existing project evidence and report
  them for confirmation — if not discoverable, the person names them.
- Framework-review conversation — separate track.

## Current blocker
None.

## Last completed action
Curation fork decided (split); benchmark stage-A implementation
packet issued — 2026-07-27.

## Next valid moves
1. Run the stage-A packet; relay its report (including the corpus
   finding and the candidate queries).
2. Person authors trap-category queries; reviews/edits candidates →
   ground-truth gate → stage B (lock manifest, compute metrics, run
   and commit the BENCH-04 baseline).
3. Then item 3 (swap) research → ADR-008.

## Files changed last round
- `PROJECT-STATE.md` (this file)
