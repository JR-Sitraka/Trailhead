# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — ITEM 3 CLOSED: HELD (not adopted). Item 5 (observability
implementation) is next per priority order.**

**Hash convention:** as of 2026-07-30, `main` HEAD `a38b881`.

## Item 3 — FINAL: HOLD (person's decision, 2026-07-30)
**MiniLM remains production** (no action needed — `trailhead_dev` was
never touched throughout this entire item's evaluation).
**q8 preserved as the leading code-retrieval candidate**, all
artifacts kept (probes, both throughput measurements, dry run,
reopen, widening, v1.1.0 comparison, Jina@768 snapshot, all
implementation work on `upgrade/embedding-swap-bench` — nothing
deleted). Full evidence and reasoning: ADR-009's "FINAL DECISION"
section.

**Wins retained on record:** known_code Top-3 50.0%→87.5%; trap-rate
25.0%→12.5%; semantic Top-1/Top-3 0.0%/28.6%→14.3%/42.9%; overall
Top-3 improved both manifests. **Held because:** documentation Top-3
regressed under both manifests; documentation Top-1 also regressed at
n=17; the weakness occurs with zero code competing (controls); overall
Top-1 across the full 40-query set went net negative (32.5%→27.5%).
**Mechanism, final:** q8 discriminates less well among dense,
similar documentation generally — code displacement was a symptom,
not the cause (falsified by the widening's own control group).

**Chat-retrieval qualification on record:** file-level Top-1 isn't a
direct measure of Chat's multi-chunk answer quality — noted, but does
not rescue the decision, since criterion 4 (Top-3) failed
independently and Top-1's decline is corroborating, not sole, evidence.

## Follow-up opened — NOT scheduled, separate from Upgrade's 7-item scope
A documentation-retrieval mitigation study is real future work, not
chosen now (path c explicitly deferred — mitigation undesigned,
unbenchmarked). Candidates: lexical/doc-aware reranking, RRF/hybrid,
intent-aware routing, separate/versioned indexes. **Any future
proposal must clear:** all four PRD criteria under v1.1.0 vs. both
models; no Top-1 regression vs. MiniLM; preserved q8 code/semantic/
trap wins; deterministic ranking + rollback; acceptable local
cost. Tracked as a distinct future item, alongside cloud-embedding
scoping and V1 blueprint items — not part of this phase's checklist.

## Coding-agent policy — unchanged
Placement always Claude Code.

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged. Item 3's full arc (hypothesis → falsification → honest
reframe → held decision with a genuinely nuanced qualification, not a
simple yes/no) is now the phase's strongest single candidate for
demonstrating the decision-habits and evenhandedness sections working
under real, inconvenient evidence — flagging explicitly for that
conversation.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — COMPLETE. **3 swap —
CLOSED: HELD.** 4 "Unknown" — CLOSED. **5 observability — NEXT: real
implementation required** (LlmRequestLog table, GET /api/observability
endpoint, wire the real panel into Dashboard replacing the mock
data/cycler, resolve the loading state per the design-handoff's
already-decided rule). 6 screen-reader — plan placed, not executed.
7 closeout — boxen + got orphaned-state + check-got.ts + BATCH_SIZE
length-awareness.

## Open questions
- `scripts/check-got.ts` disposition (item 7).
- Documentation-mitigation study — not scheduled.
- Cloud-embedding scoping — deferred.
- Framework-review conversation — separate track.

## Current blocker
None.

## Last completed action
Item 3 formally closed as HELD, full evidence and reasoning recorded
in ADR-009 and testing.md — 2026-07-30.

## Next valid moves
1. Place ADR-009 final-decision append + testing.md append + this
   file.
2. Open item 5: real observability implementation, per its existing
   feature spec (`docs/08-features/observability.md`) and design
   handoff (`docs/06-components/design-handoff.md`) — both already
   complete from earlier rounds, ready to implement.

## Files changed last round
- (pending this round's placement)
