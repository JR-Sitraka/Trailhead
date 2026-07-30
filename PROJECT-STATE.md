# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 3 widening: 9 candidates + DOC-08 rewrite PROPOSED,
awaiting person approval (gate 2 of 2).**

**Hash convention:** as of 2026-07-30, `main` HEAD `c5e7668`.
Branch `upgrade/embedding-swap-bench` at `c76b463` (unchanged —
proposal task was read-only, nothing written).

## Widening proposal — awaiting approval
**DOC-08 rewrite:** verified via a real reference-count check across
every non-skipped file in `awesome` — `contributing.md` is the ONLY
file serving the dual-pointer role, confirmed by content, not
inference. Caveat flagged by the agent and orchestrator both: the
rewrite trades naturalness for uniqueness — needs explicit sign-off.

**9 new candidates, 17 total documentation queries:**
- `got` (6): DOC-09 `6-timeout.md`, DOC-10 `7-retry.md`, DOC-11
  `8-errors.md` (matched pair vs. KC-05 — tests intent separation),
  DOC-12 `cache.md`, DOC-13 `9-hooks.md`, DOC-14 `typescript.md`
- Trailhead (3): DOC-15 `safe-preprocessing.md` (matched pair vs.
  KC-02), DOC-16 `KNOWN-GOOD.md` (control, no code competitor), DOC-17
  `README.md` (control, no code competitor)
- Two candidates deliberately rejected before proposing
  (`10-instances.md`; the size-limits phrasing for safe-
  preprocessing.md) — same ambiguity-check discipline as the original
  ground-truth gate, applied proactively this time.

**Orchestrator review (2026-07-30), three items for the person's
explicit call:**
1. DOC-08's naturalness/uniqueness tradeoff — needs an explicit yes.
2. **DOC-12 (cache.md) may not have a real in-repo code competitor**
   (caching is implemented by the external `cacheable-request`
   dependency, not by any file in this repo) — likely functions as a
   third control, not a genuine mixed-competition test. Worth
   labeling correctly rather than counting toward the "concentrated
   where code competes" total.
3. **DOC-09/DOC-10 appear to be unlabeled matched pairs** (vs. SEM-07
   `timed-out.ts` and KC-04 `calculate-retry-delay.ts` respectively)
   — same intent-separation structure as DOC-11/DOC-15. Worth
   confirming intentional and labeling consistently — changes the
   real count of matched-pair data points from 2 to potentially 4.

**Jina@768 intactness: CONFIRMED** — all 5 repos, all 768-dim, 4,039
chunks, unchanged since AFTER-SWAP. Cost-bounding assumption holds:
only MiniLM needs re-embedding (~30 min extrapolated), not another
multi-hour run.

**What widening buys, stated honestly (agent's own framing, correct):**
documentation goes 8→17, one query's weight drops 12.5pp→5.9pp,
mixed-repo coverage goes 5-of-8→13-of-17. This makes criterion 4
harder to move by luck; it does NOT make n=17 statistically powerful.
A 1.1.0 run will not be comparable to the committed 1.0.0 baseline —
both stay valid for what they measured.

## Item 3 — REOPENED (unchanged from last round, full reasoning in
ADR-009): q8's three wins (known_code +37.5pp, trap-rate −12.5pp,
semantic Top-1/Top-3 both +14.3pp) stand; criterion 4 needs
confident measurement before a final adoption call.

## Coding-agent policy — unchanged
Placement always Claude Code; this round's work was read-only
proposal (Claude Code, decision-adjacent).

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged. Continuing candidate: the framing-correction propagating
forward unprompted (agent self-flagged the n=17 statistical-power
risk without being asked) — real evidence a correction, once made
explicit, generalizes rather than needing to be repeated each round.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — COMPLETE (v1.0.0).
**3 swap — REOPENED; widening proposal awaiting approval.** 4
"Unknown" — CLOSED. 5 observability — handoff frozen. 6 screen-reader
— plan placed. 7 closeout — boxen + got orphaned-state +
check-got.ts + BATCH_SIZE length-awareness.

## Open questions
- Person's approval on the 9 candidates + DOC-08 rewrite + the three
  review items above.
- Cloud-embedding scoping — deliberately deferred.
- Future scoping candidate: intent-aware ranking / dual embedding
  strategies.
- `scripts/check-got.ts` disposition (item 7).
- Framework-review conversation — separate track.

## Current blocker
The widening approval gate.

## Last completed action
9 candidates + DOC-08 rewrite proposed and reviewed; three items
flagged for explicit person sign-off — 2026-07-30.

## Next valid moves
1. Person approves/edits the widening set.
2. Write approved set into manifest.json as v1.1.0 (queries only —
   symbol ground truth and locked parameters unchanged).
3. Re-embed MiniLM only (~30 min); re-run both models under v1.1.0;
   revised four-criteria comparison → final adoption call.

## Files changed last round
- (branch-only proposal file, not yet placed: 
  benchmark/candidates/proposed-documentation-widening.json)
