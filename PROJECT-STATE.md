# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — ITEM 4 CLOSED. Item 3 (embedding swap) opens next.**

**Hash convention:** as of 2026-07-28, `main` HEAD `670a723`
(includes the real, committed Overview fix + corrected test).

## Item 4 — CLOSED (2026-07-28)
`displayValue` exported and used directly by both the component and
its test — no more tautological local-copy testing. Fallback changed
from `"Not detected"` to `"Unknown"` for all five stack fields. Real
commit `670a723`. Full suite: 28 passed / 4 failed, identical to
baseline failure set, zero new failures. JSON export was already
spec-compliant (no change needed, verified prior round). ADR-010's
re-scope (verify + regression-proof, not fix) is now fully executed —
framework detection scored 1.000 in the baseline, and the one real
display gap found is closed with evidence.

## KNOWN-GOOD entry added (2026-07-28)
`page.tsx` and `check-got.ts` both carry a pre-existing skip-worktree
flag that silently blocks normal git tracking of edits to them. This
round's fix nearly missed being committed because of it. Flag is
NOT cleared (only worked around via `git add -f`) — **future edits to
either file must run `git update-index --no-skip-worktree <path>`
first.** Root cause unknown.

## Process lesson — orchestrator gap, corrected
A prior implementation packet omitted an explicit commit step and
commit-hash reporting requirement, which is very likely why the
skip-worktree issue surfaced as ambiguity instead of a hard stop.
**Every implementation task packet now requires an explicit commit
step and hash in the report, no exceptions** — this round's follow-up
packet included it and produced a clean, verifiable result.

## Coding-agent policy — REFINED (unchanged)
File placement/git handling: always Claude Code. Implementation:
complexity-split (simple → Kilo Code, research/artifact-producing →
Claude Code). Kilo Code commits its own scoped implementation work as
part of the task — confirmed working this round.

## Stray finding — still parked
`scripts/check-got.ts`, uncommitted deletion, `9c21b5f`, item 7. Also
now flagged as skip-worktree-affected (see KNOWN-GOOD entry above) —
relevant context for whoever resolves it.

## Item 2 — CLOSED (unchanged).

## Baseline results — unchanged, still the comparison point for item 3
Semantic Top-1 = 0.000 → known_code Top-1 = 0.250 → TRAP-06 total
displacement, in priority order.

## Key decisions
ADR-010 (fully executed), ADR-008, ADR-007, ADR-005 amended twice.
ADR-009 reserved for the model choice — next up.

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged. New candidate: the orchestrator's own review catching an
unverified/possibly-uncommitted claim before it propagated downstream
— real evidence the review loop functions in both directions
(agent-catches-orchestrator and orchestrator-catches-agent both now
on record this phase).

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — COMPLETE, closed.
**3 swap — OPENING.** ADR-009 reserved; hard targets: semantic Top-1
= 0.000, known_code Top-1 = 0.250, TRAP-06 total displacement.
**4 "Unknown" — CLOSED.** 5 observability — handoff frozen. 6
screen-reader — plan placed. 7 closeout — boxen + got orphaned-state
+ check-got.ts (now with a known skip-worktree complication).

## Open questions
- `scripts/check-got.ts` disposition (item 7).
- Framework-review conversation — separate track.

## Current blocker
None.

## Last completed action
Item 4 verified closed with real evidence; KNOWN-GOOD entry added for
the skip-worktree condition — 2026-07-28.

## Next valid moves
1. Place this round's 2 files.
2. Open item 3: orchestrator does real candidate research (zero-spend,
   local, transformers.js-compatible code-aware embedding models) via
   web search before compiling the research/comparison task — per
   `software-architect.md`'s targeted-search-before-committing rule.

## Files changed last round
- (none placed yet this round — pending)
