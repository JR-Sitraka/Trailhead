# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 3 REOPENED (path b). Widening the documentation
category before any adoption decision.** Branch
`upgrade/embedding-swap-bench` at `c76b463`.

**Hash convention:** as of 2026-07-30, `main` HEAD `e28dfd6` (pending
this round's placement).

## Item 3 — REOPENED (2026-07-30), full reasoning in ADR-009
Read-only review found a SYSTEMATIC CONCERN, not boundary noise:
DOC-03 shows a real word-sense error (URL authority ≠ certificate
authority) plus a scoring artifact (true rank is 5, not 4, when
scored on the answer-bearing chunk); DOC-04 independently confirms
the same code-over-docs mechanism; category-wide pattern is 4 down /
2 up-by-one / 2 flat, concentrated specifically in `got` — the
corpus's one repo with both substantial code and substantial docs.
DOC-08's ground truth was also genuinely ambiguous (the declining
reason for the alternative no longer holds) — **rewrite adopted**:
*"Which file directs contributors to both the new-list guidelines
and the instructions for creating their own list?"* → `contributing.md`.

**q8's three wins are NOT retracted** — known_code +37.5pp, trap-rate
−12.5pp, semantic Top-1/Top-3 both +14.3pp remain real. The reopen is
about measuring the documentation tradeoff with confidence, not about
doubting the wins.

## Cost clarification — the reopen is cheap, not another 9-hour ordeal
`trailhead_bench` already holds Jina@768 for all 5 repos — NOT
touched again. Only MiniLM needs re-embedding (destroyed by the
dimension migration) — measured rate on this machine extrapolates to
**~30 minutes for the full corpus**, not hours. Query embedding and
comparison runs are fast regardless of corpus size.

## Widening plan — two-gate discipline (same as original ground truth)
1. **This round:** Claude Code proposes new documentation-category
   candidates, concentrated in `got` and Trailhead (the corpus's two
   genuinely mixed repos — `awesome`/`escape-string-regexp`/`DALL-E`
   are not mixed in the relevant sense). Also content-verifies the
   DOC-08 rewrite. Read-only, nothing written to the manifest.
2. **Next round:** person reviews/approves candidates, same gate
   discipline as the original 31-query ground truth.
3. **Then:** manifestVersion bump, MiniLM re-embed (~30 min), both-
   model comparison re-run under the new manifest.

## Coding-agent policy — unchanged
Placement always Claude Code; this proposal task is research/
decision-adjacent → Claude Code.

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged. Strong new candidate: the person's own gate discipline
(defining disqualifying conditions in advance, then honoring a
disconfirming result rather than rationalizing around it) — real
evidence of the framework's decision-habits section working exactly
as designed under genuine stakes.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — COMPLETE (v1.0.0);
**widening in progress toward v1.1.0.** **3 swap — REOPENED, path b in
progress.** 4 "Unknown" — CLOSED. 5 observability — handoff frozen.
6 screen-reader — plan placed. 7 closeout — boxen + got orphaned-
state + check-got.ts + BATCH_SIZE length-awareness.

## Open questions
- Widened candidate approval (next round).
- Cloud-embedding scoping — still deliberately deferred.
- Future scoping candidate: intent-aware ranking / dual embedding
  strategies (logged, not decided).
- `scripts/check-got.ts` disposition (item 7).
- Framework-review conversation — separate track.

## Current blocker
None — proposal task in flight.

## Last completed action
Item 3 formally reopened with full reasoning; DOC-08 rewrite adopted;
cost-bounding clarification recorded; widening plan set — 2026-07-30.

## Next valid moves
1. Place ADR-009 reopen append + this file.
2. Claude Code proposes widened documentation candidates + verifies
   DOC-08 rewrite content-match.
3. Person approves → version bump → MiniLM re-embed → re-run →
   revised four-criteria verdict.

## Files changed last round
- (pending this round's placement)
