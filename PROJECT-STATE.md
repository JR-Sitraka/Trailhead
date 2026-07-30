# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 3 dry run COMPLETE on trailhead_bench. Adoption
decision pending the person.** Branch `upgrade/embedding-swap-bench`
holds 10 real commits (4924119 through c76b463) — not yet merged.

**Hash convention:** as of 2026-07-30, `main` HEAD `5626a4b`
(unchanged — dry run is entirely on the feature branch).

## Item 3 — dry-run results (real evidence, 2026-07-30)
**3 of 4 PRD criteria MET decisively:** known_code Top-3 50.0%→87.5%;
trap-outranked-rate 25.0%→12.5%; semantic Top-1/Top-3
0.0%/28.6%→14.3%/42.9% (the headline defect — semantic Top-1 left
zero for the first time; TRAP-06's total displacement is now rank 2).
**Criterion 4 (documentation, no regression) NOT MET, −25.0pp** — but
entirely two queries (DOC-03, DOC-08) crossing the Top-3 cutoff by
one rank each in an 8-query category; Top-1 held steady; reproduced
byte-identical on a second run. n=8 cannot distinguish real
regression from boundary noise.

**PENDING PERSON DECISION:** adopt now (criterion 4 recorded as
inconclusive-at-n=8, widening deferred as a tracked follow-up,
orchestrator's recommendation) vs. widen the documentation category
and re-run before deciding (costs another multi-hour-to-day re-embed,
per the corrected timing finding below).

## Session-recovery validation (2026-07-30)
The interrupted background process from the prior round was correctly
diagnosed before resuming (per `playbooks/session-recovery.md`) —
real DB state verified rather than trusting the log file's own
claims. The interruption became reinforcing SWAP-05 evidence: three
independent real failures (deliberate kill, real OOM, session
interruption) all left the affected repo non-corrupt, others
unaffected — stronger evidence than the single induced case the
original packet required. **First real trigger of this playbook in
the entire implementation phase — worked as designed.**

## Settled corrections (ADR-009 amended, not re-litigated)
- **Batch=1 is now a REQUIREMENT, not a performance default** — q8
  is not batch-invariant (Δ up to 3.45e-2; MiniLM and fp32 are both
  ~1e-7). A batch>1 corpus run would not be comparable to
  singly-embedded queries. Every future run of this model must use
  batch=1.
- **Extrapolated hours were wrong; the 6.3× ratio was not.** Real:
  got alone took 9h24m (not ~3.1h predicted). One file ran faster
  unbatched than batched — padding cost can exceed batching benefit
  for this model.
- **Rollback is whole-database, not per-repository** — one pgvector
  column, one dimension, for the whole DB. Rollback itself proven
  real (3/3 ranks reproduced exactly); the spec's implied granularity
  was overstated, now corrected.
- `EMBEDDING_BATCH_SIZE` added as config (default 32 unchanged) after
  a real OOM (13-chunk batch, 6.5GB request, 1h23m before abort) —
  ADR-009's flagged latent risk was no longer latent. Length-aware
  batching fix remains item 7's unchanged scope.
- Two tooling gaps found: `metrics.ts` has no status filter (verified
  its own gate correctly refuses a half-embedded repo — safe, no fix
  needed); `compare-runs.ts` hardcoded its output filename, silently
  overwriting the committed baseline on rerun — fixed via required
  `--out=` flag.

## Coding-agent policy — unchanged
Placement always Claude Code; implementation split by complexity.
This dry run and its follow-on (promotion to dev, or a widened
re-run) both stay Claude Code — hard-gated, complex.

## Baseline — unchanged, now has a real comparison against it
`BASELINE-2026-07-28T18-02-00-408Z.json` vs.
`AFTER-SWAP-2026-07-30T01-57-15-380Z.json`, both on identical
manifestVersion 1.0.0 and locked parameters.

## Key decisions
ADR-010, ADR-008, ADR-007, ADR-005 amended twice, **ADR-009 amended
with real dry-run results and three methodology/scope corrections.**

## Provisional-items trail (V4.2 — feeds retrospective §8)
- 2026-07-30 — **session-recovery.md TRIGGERED for real, first time
  this phase.** Worked as designed — diagnosis-before-resume turned
  an interruption into reinforcing evidence rather than lost work or
  a false completion claim.
- Prior entries unchanged.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — COMPLETE. **3 swap —
dry run complete, real 3-of-4 result, adoption decision pending.**
4 "Unknown" — CLOSED. 5 observability — handoff frozen. 6
screen-reader — plan placed. 7 closeout — boxen + got orphaned-state
+ check-got.ts + BATCH_SIZE length-awareness fix (now confirmed
non-latent, not just theoretical).

## Open questions
- **Criterion 4 adoption decision** (this round's live question).
- `scripts/check-got.ts` disposition (item 7).
- Framework-review conversation — separate track. Strong candidates
  now: session-recovery validation, the batch-invariance catch, the
  two tooling-gap finds, the corrected extrapolation.

## Current blocker
The adoption decision.

## Last completed action
Dry-run results recorded; three ADR-009 corrections logged; session-
recovery validated — 2026-07-30.

## Next valid moves
1. Place ADR-009 amendment + testing.md append + this file.
2. Person decides: adopt (criterion 4 inconclusive-at-n=8) or widen
   documentation category first.
3. On adopt: promote from trailhead_bench to trailhead_dev for real.

## Files changed last round
- (branch `upgrade/embedding-swap-bench`, 10 commits — not yet
  reflected in docs/ until this round's placement)
