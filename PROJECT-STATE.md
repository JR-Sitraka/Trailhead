# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — ITEM 5 CLOSED. Branch merge in flight this round. Item 6
(screen-reader pass) opens next.**

**Hash convention:** as of 2026-07-30, `main` HEAD `d32d4a2` (pre-
merge). Branch `upgrade/observability` HEAD `9a9ff95` (corrected —
`scripts/check-got.ts` restored to unstaged-deletion state, amend
verified byte-identical to its pre-existing content). Merge base:
`a66a744`.

## Standing rule reaffirmed (2026-07-30) — placement is ALWAYS
## Claude Code, no exceptions for usage-limit pressure
Last round the orchestrator deviated from this rule (routed a
placement task to Kilo Code to conserve Claude Code usage) — the
person overrode this explicitly: **maintain the rule regardless of
usage limits.** This round's three-file conflict (KNOWN-GOOD.md,
PROJECT-STATE.md, testing.md independently diverged on `main` and the
branch) is itself real evidence for why placement discipline matters
regardless of file "routineness" — the rule is not relaxed going
forward.

## Merge reconciliation — three files, both sides real, both kept
`main`'s `d32d4a2` and the branch's `9a9ff95` each extended
`KNOWN-GOOD.md`, `PROJECT-STATE.md`, and `testing.md` independently
from the same base — genuine `CONFLICT (content)`, confirmed via a
dry-run merge (`--no-commit --no-ff`, then aborted). **Resolved by
the orchestrator writing the fully-reconciled content directly**
(both sides authored by the same orchestrator across rounds, so no
information is lost either way) rather than asking an agent to
interpret conflict markers on prose documents:
- `KNOWN-GOOD.md`: both dated entries kept (db:push hang;
  second-dev-server `.next` corruption).
- `testing.md`: both blocks kept in sequence (OBS-01–06 implementation
  status; OBS-07 visual parity + Inter defect + item 5 closed).
- `PROJECT-STATE.md`: this file — supersedes both prior versions.

## Item 5 — CLOSED (2026-07-30)
All acceptance criteria (OBS-01 through OBS-07) real-verified.
**Human visual confirmation given explicitly** ("Visual approval,
it's a yes.") — the playbook's own requirement satisfied, not
inferred from an artifact existing. One independent defect found
(Inter font-resolution, project-wide) — routed to item 7, not
blocking. Full evidence:
`docs/09-testing/parity-reports/observability-panel-parity-2026-07-30.md`.

## `scripts/check-got.ts` — remediation confirmed, still parked
Corrected via commit amend on the branch tip (`667bdf1`→`9a9ff95`):
`git checkout <parent> -- scripts/check-got.ts` to restore tracked
content, amend to remove the deletion from the tree, then re-delete
in the working directory — restoring the exact unstaged-deletion
state that has persisted since `9c21b5f` (2026-07-25). Verified
byte-identical to pre-`667bdf1` content. **Disposition remains
item 7's, unchanged.**

## Coding-agent policy — reaffirmed, no exceptions
Placement: **always Claude Code, unconditionally** — usage-limit
pressure does not override this. Implementation: complexity-split
(simple → Kilo Code, research/hard-gated → Claude Code) — unchanged,
still applies to implementation work specifically, not placement.

## Provisional-items trail (V4.2 — feeds retrospective §8)
- 2026-07-30 — `visual-parity-review.md`: clean result, human
  confirmed explicitly.
- New candidate: a policy deviation (Kilo for placement) caused a
  real, traceable problem within one round of being adopted — strong,
  fast evidence for the framework's own rule, worth citing plainly.
- Prior entries unchanged.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — COMPLETE. 3 swap —
CLOSED: HELD. 4 "Unknown" — CLOSED. **5 observability — CLOSED.**
6 screen-reader — NEXT. 7 closeout — boxen, got orphaned-state,
check-got.ts, embeddings.ts BATCH_SIZE, Inter font-resolution defect.

## Open questions
- `scripts/check-got.ts`, boxen, got orphaned-state, BATCH_SIZE,
  Inter defect — all item 7, unscheduled.
- Documentation-mitigation study, cloud-embedding scoping — deferred.
- Framework-review conversation — separate track. Strong new
  candidates this phase: item 3's full falsification arc, the
  spec-drift findings (generation abstraction, panel never ported),
  and this round's placement-policy deviation-and-correction.

## Current blocker
None — merge is this round's task.

## Last completed action
Merge conflict reconciled by direct authorship (not agent conflict
resolution); item 5 formally closed with explicit human approval;
placement policy reaffirmed without exception — 2026-07-30.

## Next valid moves
1. Claude Code executes the merge with the reconciled file contents
   provided (below).
2. Open item 6: screen-reader pass — real NVDA or VoiceOver testing
   across all 7 screens plus the new observability panel, per
   `testing.md`'s existing plan rows.

## Files changed last round
- (merge in flight this round — see task below)
