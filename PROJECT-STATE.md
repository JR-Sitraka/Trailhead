# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 4: verification recorded, placement pending under
the refined policy, fix in flight next.**

**Hash convention:** as of 2026-07-28, `main` HEAD `13430e9`.

## Coding-agent policy — REFINED (ADR-005, second amendment, 2026-07-28)
**Simplified from context-heavy/light to a type-based split:**
- **File placement / git handling: ALWAYS Claude Code**, regardless
  of content complexity — the stakes (hash-chain integrity, append
  discipline, merge-not-rebase, prohibited-scope diffs) live in the
  mechanism, not the material.
- **Implementation work: split by complexity** — simple/mechanical/
  scoped fixes to Kilo Code; research-heavy or artifact-producing work
  to Claude Code.
This replaces the original weight-based rule, which required a
per-task judgment call and was the exact seam where the earlier
misrouting happened (person sent a placement task to Claude Code by
"misread" — under the new rule, that's simply always correct, no
judgment needed).

## Stray finding — uncommitted deletion, still parked
`scripts/check-got.ts` deleted on disk, never committed, traced to
`9c21b5f` (2026-07-25), predates this phase. Left untouched again
this round. Folded into item 7's closeout.

## Item 4 — verification recorded, fix still pending
JSON export verified spec-compliant. Overview gap recorded:
`"Not detected"` → `"Unknown"` for all five null stack fields
(`src/app/repositories/[id]/overview/page.tsx:115`). **Placement of
this round's file goes to Claude Code** (per the refined policy); the
**actual fix still goes to Kilo Code** once placement lands.

## Item 2 — CLOSED (unchanged; ten-hash merge chain, baseline results
recorded in prior rounds and testing.md).

## Baseline results — unchanged, still the comparison point for item 3
Semantic Top-1 = 0.000 → known_code Top-1 = 0.250 → TRAP-06 total
displacement, in priority order.

## Key decisions
ADR-010 (item 4 re-scope), ADR-008, ADR-007, **ADR-005 amended twice**
(mixed policy, then refined to type-based split). ADR-009 reserved.

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged. §8 candidates now include: the checkpoint-discipline
success on the stray deletion, AND the policy self-correction from a
judgment-based rule to a judgment-free one after exactly one
misroute — a real, fast process-improvement loop worth citing.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — COMPLETE, closed.
3 swap — unblocks once item 4's fix lands; ADR-009 reserved.
4 "Unknown" — verification recorded, placement pending, fix pending.
5 observability — handoff frozen. 6 screen-reader — plan placed.
7 closeout — boxen zero-files + got orphaned-state + check-got.ts.

## Open questions
- `scripts/check-got.ts` disposition (item 7).
- Framework-review conversation — separate track.

## Current blocker
None.

## Last completed action
Coding-agent policy refined to a type-based split; task 1 re-addressed
to Claude Code accordingly — 2026-07-28.

## Next valid moves
1. Claude Code places this round's 2 files.
2. Kilo Code runs the Overview fix + test (unchanged packet).
3. Item 3 (swap) research opens on Claude Code.

## Files changed last round
- (prior round's `13430e9` unchanged; this round's files pending
  placement below)
