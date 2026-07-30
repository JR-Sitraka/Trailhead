# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 3: adoption framework decided by the person,
CONTINGENT on one read-only review.** Branch
`upgrade/embedding-swap-bench` at `c76b463`, not yet merged.

**Hash convention:** as of 2026-07-30, `main` HEAD `e28dfd6`.

## Item 3 — adoption decision (person, 2026-07-30), pending confirmation
**Path (a): adopt q8 now, with an explicit accepted-exception for
criterion 4** — contingent on a real-evidence review of DOC-03/DOC-08
confirming genuine cutoff-boundary movement (not a systematic
documentation-retrieval failure, not ambiguous ground truth).

**Correction to prior round's framing (person's, adopted):** criterion
4 is recorded as **NOT MET** — the −25pp is a real, observed result on
the approved 8-query benchmark, not "statistically inconclusive." What
is uncertain is generalizability (n=8, Top-1 unchanged), not the
observed result itself. These are different claims and must not be
merged.

**Target adoption record, once the review confirms (exact language,
person's):**
- q8 adopted because three of four criteria were met.
- The two principal product failures were materially improved.
- Criterion 4 was not met on the current benchmark.
- The result's general significance is uncertain because the
  documentation category contains only eight queries and Top-1 was
  unchanged.
- The product owner explicitly accepts this bounded regression risk.
- Widening documentation ground truth is a tracked follow-up required
  before the next embedding-model decision, not a prerequisite for
  this adoption.

**If the review finds more than boundary movement, or a common
systematic failure: STOP, use path (b) instead** (widen the
documentation category before deciding) — not an automatic fallback,
an explicit re-open.

## Review in flight (this round's task)
Read-only inspection of DOC-03 and DOC-08: confirm each correct file
moved Top-3→rank 4 only (not further); record exact before/after rank
and distance; inspect what actually occupies the new Top-3; confirm
no ambiguous ground truth or shared systematic cause. Issued to
Claude Code (decision-gating).

## Cloud-embedding question — raised, deliberately held separate
Person asked whether cloud embedding is viable given hardware limits.
**Answer given: yes, it's a real departure from a standing, recorded
commitment** (README's "runs locally... zero ongoing cost" claim;
ADR-002/003/004; embedding-swap.md's own "constraints unchanged").
Also real: the throughput problem is a UX/wait-time issue, not a
correctness blocker (background, resumable; a single new import would
take proportionally less than the 5-repo corpus). **Held as a
separate, not-yet-scoped, standing-principle-level question** — not
folded into ADR-009, not decided here. Would need its own scoping
interview if pursued (acceptable wait time, real free-tier limits,
whether the README's zero-cost claim changes).

## Settled corrections (retained language, person's exact requirements)
- q8 valid ONLY at batch=1 (not batch-invariant; MiniLM/fp32 are).
- Wrong wall-clock extrapolation REMOVED; the 6.3× ratio RETAINED as
  the durable finding.
- Rollback described as whole-database, not per-repository.
- Repository-completeness status gate (metrics.ts) RETAINED as-is —
  already safe, verified refusing correctly.
- compare-runs.ts's required --out= protection RETAINED.

## Coding-agent policy — unchanged
Placement always Claude Code; implementation/research split by
complexity. This review: Claude Code (decision-gating, becomes
permanent ADR record).

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged; session-recovery.md validation from last round stands as
recorded.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — COMPLETE. **3 swap —
adoption framework set by the person, contingent on this round's
review.** 4 "Unknown" — CLOSED. 5 observability — handoff frozen. 6
screen-reader — plan placed. 7 closeout — boxen + got orphaned-state
+ check-got.ts + BATCH_SIZE length-awareness.

## Open questions
- This round's review outcome (gates path a vs. b).
- Cloud-embedding scoping — deliberately deferred, not scheduled.
- `scripts/check-got.ts` disposition (item 7).
- Framework-review conversation — separate track.

## Current blocker
The review, by design.

## Last completed action
Adoption framework and correction language recorded from the person's
explicit decision; review task issued; cloud-embedding question
answered and deliberately held separate — 2026-07-30.

## Next valid moves
1. Place this file.
2. Claude Code runs the DOC-03/DOC-08 review.
3. On confirm: finalize ADR-009's adoption record in the exact
   language above; promote from trailhead_bench to trailhead_dev.
4. On disconfirm: reopen path (b) — widen documentation ground truth.

## Files changed last round
- (main HEAD e28dfd6 unchanged by this round; this file pending)
