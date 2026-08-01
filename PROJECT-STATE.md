# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 7, Group 1 CLOSED. Groups 2-3 (already-diagnosed
scoped fixes) opening next.**

**Hash convention:** as of 2026-07-31, `main` HEAD `b0dab84`
(unchanged — Group 1's work is on `upgrade/item7-closeout`, not yet
merged). Branch commits: `1f5b19f`, `6b86504`, `fb88852`.

## Item 7 — status
| Group | Scope | Status |
|---|---|---|
| 0 | check-got.ts | ✅ CLOSED (committed as intentional cleanup) |
| 1 | boxen + got | ✅ CLOSED — full detail in testing.md |
| 2 | embeddings.ts BATCH_SIZE | Opening next |
| 3 | Inter font-resolution | Opening next |
| 4 | IMPORT-04 + PREPROC-03 | Queued |
| 5 | Remaining testing.md rows | Queued |

## Group 1 — closed, key facts
Two independent real defects fixed for boxen (NUL-byte binary
misdetection + non-transactional import + missing zero-file guard);
got's exposure fixed via poller reconciliation (root cause — an
out-of-band deletion — honestly could not be recovered). Both
live-verified on the real dev server, not just tested. Deletion gate
caught the investigation's own wrong recommendation (3 of 4 proposed
deletions were active QA fixtures) — only the genuine dead row was
removed. `architecture.md` corrected (third instance of the
docs-describe-unbuilt-architecture pattern); ADR-011 added; ADR-006's
ordering gap marked resolved. Two test-quality gaps logged, not fixed
(EXPORT-01 timing fragility, CHAT-01's weak assertion) — future work,
not blocking.

## Coding-agent policy — unchanged
Placement always Claude Code. Groups 2-3 are already fully diagnosed,
scoped fixes with no investigation needed — good Kilo Code candidates
under the standing complexity-split rule.

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged. Strong new candidates: the deletion-gate catching a wrong
recommendation before it executed (real evidence the safety
discipline works, not just documents itself); the third
docs-vs-code-drift instance, now a confirmed pattern across three
separate items.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — COMPLETE. 3 swap —
CLOSED: HELD. 4 "Unknown" — CLOSED. 5 observability — CLOSED, merged.
6 screen-reader — CLOSED, merged. **7 closeout — Groups 0-1 closed,
2-3 opening, 4-5 queued.**

## Open questions
- Groups 2-3's task routing (Kilo Code proposed, awaiting confirm).
- Item 7's eventual branch merge timing.
- Documentation-mitigation study, cloud-embedding scoping — deferred.
- Framework-review conversation — separate track, now with three
  confirmed instances of one systemic pattern to address structurally.

## Current blocker
None.

## Last completed action
Group 1 formally closed with real hashes and full evidence — 2026-07-31.

## Next valid moves
1. Place this round's two files.
2. Groups 2-3: BATCH_SIZE length-awareness + Inter font-resolution,
   both already diagnosed — task packets next.
3. Groups 4-5: original PRD closeout verification.
4. On item 7's close: entire Upgrade phase complete.

## Files changed last round
- (pending this round's placement)
