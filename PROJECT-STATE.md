# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 3: v1.1.0 widened comparison COMPLETE. Reopen's
diagnosis CORRECTED. Adoption decision pending — three real paths
presented, none decided.**

**Hash convention:** as of 2026-07-30, `main` HEAD pending this
round's placement. Branch `upgrade/embedding-swap-bench`: `4eb0a42`
(manifest v1.1.0), `a26686e` (Jina run), `3fc9bd2` (MiniLM run +
comparison). `trailhead_bench` currently MiniLM@384, Jina snapshot
verified restorable without re-embedding.

## v1.1.0 results — the diagnosis changed, not just the numbers
3 of 4 criteria still MET (known_code +37.5pp, trap-rate −12.5pp,
semantic both +14.3pp). **Criterion 4 NOT MET, −17.6pp — and Overall
Top-1 is now NET NEGATIVE (32.5%→27.5%), which v1.0.0 did not show.**
Overall Top-3 still positive (60.0%→65.0%).

**Mechanism correction (falsified, not confirmed, by the widening —
real scientific value):** controls with NO code competitor degraded
worst (DOC-16 1→5, DOC-17 23→>50, both displaced entirely by other
docs). Matched pairs, where code competes hardest, IMPROVED
(75%→100% Top-3). This is the opposite of "code outranks
documentation." **Real mechanism: Jina q8 discriminates less well
among dense documentation generally** — code displacement in `got` is
a symptom, not the cause. DOC-08's person-rewritten, unambiguous
question still regressed (3→5) — confirms real behavior, not a
ground-truth artifact.

## Adoption decision — PENDING, three paths presented (2026-07-30)
(a) Adopt, documentation regression now correctly diagnosed and
accepted; elevate intent-aware/hybrid retrieval from speculative to
required near-term follow-up. (b) Hold — net-negative Top-1 across
the whole benchmark is a real regression, not bounded noise. (c)
Scope a documentation-routing mitigation (MiniLM or blended, for
doc-heavy queries) now, before adopting. **Orchestrator did not lean**
— this crosses into product-priorities territory (Top-1 vs. broader
relevance), reserved for the person.

## Item 3 — full evidence chain (for the eventual ADR-009 close)
Environment probe → throughput (corrected methodology) → ADR-009
drafted → dry run (v1.0.0, 3/4 met) → reopen (path b, systematic
concern) → widening approved → v1.1.0 (3/4 met, mechanism corrected,
Top-1 now negative). Every step real, agent-verified, several
self-corrected mid-stream (invalid v1 throughput discarded; wrong
extrapolated hours corrected; wrong mechanism now corrected).

## Coding-agent policy — unchanged
Placement always Claude Code.

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged. Strong new candidate: a hypothesis-driven widening that
falsified its own premise, with the person then reframing the
decision rather than forcing the original conclusion — real evidence
the framework's evenhandedness and decision-habits sections hold
under a genuinely inconvenient result, not just a comfortable one.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — COMPLETE (v1.0.0);
v1.1.0 widening COMPLETE. **3 swap — evidence complete; adoption
decision (a/b/c) pending.** 4 "Unknown" — CLOSED. 5 observability —
handoff frozen. 6 screen-reader — plan placed. 7 closeout — boxen +
got orphaned-state + check-got.ts + BATCH_SIZE length-awareness.

## Open questions
- **The adoption decision (a/b/c)** — this round's live question.
- Cloud-embedding scoping — deferred.
- `scripts/check-got.ts` disposition (item 7).
- Framework-review conversation — separate track. Item 3's full arc
  (hypothesis, falsification, reframe) is now a top candidate.

## Current blocker
The adoption decision.

## Last completed action
v1.1.0 comparison complete; reopen's mechanism diagnosis corrected by
real evidence; three paths presented without a lean — 2026-07-30.

## Next valid moves
1. Place ADR-009 append + this file.
2. Person decides: (a) adopt-with-corrected-exception, (b) hold, or
   (c) scope a documentation-routing mitigation now.
3. Path-dependent next task compiled once the person decides.

## Files changed last round
- (pending this round's placement)
