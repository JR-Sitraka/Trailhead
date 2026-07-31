# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 5: mechanical parity CLEAN, awaiting the person's
live visual confirmation (last step before close).**

**Hash convention:** as of 2026-07-30, `main` HEAD `a66a744`
(pending this round's placement). Branch `upgrade/observability` @
`a25bb2b`, unchanged by the parity review (comparison-only).

## Practical note — approaching weekly usage limit
Person flagged a Claude Code weekly usage-limit banner (resets Sat
Aug 1). **Pacing recommendation:** route smaller mechanical steps to
Kilo Code from here through items 6-7's closeout, reserving Claude
Code for genuinely complex/decision-gating work — consistent with the
existing type-based policy, just applied more conservatively given
the real constraint.

## Item 5 — visual parity: CLEAN (2026-07-30), one independent Fail
Full evidence:
`docs/09-testing/parity-reports/observability-panel-parity-2026-07-30.md`.
Token equivalence confirmed (6 name-only remaps, zero value
differences). All four states reached and compared at all three
canonical viewports by real means (real Chat turn, real zero-day
window, real credential failure, real table-unavailable — the same
proven techniques as OBS-02/04/05). Zero interactive elements/tab
stops confirmed across all 12 captures.

**One Fail, independent of this work:** Inter font not applied
project-wide (`Dashboard.tsx`'s `font-sans` resolves an undefined
`--font-sans` token; Tailwind's system stack silently wins). Affects
every screen, not just this panel. **Recommendation: does not block
item 5's close; tracked under item 7.** Confirm or override.

**Outstanding: human live visual confirmation** — the playbook's own
requirement; agent evidence is Agent-verified (computed styles + DOM
geometry, since screenshot capture failed this session), not
Live-verified. Dev server was left running at `localhost:3000`
showing real state (3/1/Groq·Operational) for this purpose.

## KNOWN-GOOD entry added
Running a second `npm run dev` corrupts the shared `.next` build and
500s the whole app — always confirm no dev server is already running
before starting one.

## Coding-agent policy — refined pacing given usage limit
Placement always Claude Code; implementation split by complexity —
unchanged in principle, applied more conservatively toward Kilo Code
for the remainder of this phase given the real usage-limit constraint.

## Provisional-items trail (V4.2 — feeds retrospective §8)
- 2026-07-30 — `visual-parity-review.md` TRIGGERED and used for the
  first time this phase (item 5's panel) — clean result, real
  evidence, one honestly-labeled Unverified item (screenshot capture
  failure) handled per the playbook's own "Unverified doesn't block
  the human pass" rule.
- Prior entries unchanged.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — COMPLETE. 3 swap —
CLOSED: HELD. 4 "Unknown" — CLOSED. **5 observability — mechanical
parity clean; awaiting live confirmation to formally close.** 6
screen-reader — plan placed, not executed. **7 closeout — now
carries: boxen zero-files, got orphaned-state, check-got.ts,
embeddings.ts BATCH_SIZE length-unawareness, AND the Inter
font-resolution defect (project-wide).**

## Open questions
- **Person's live visual confirmation** — this round's real ask.
- Inter defect: confirm item-7 routing (or override).
- `scripts/check-got.ts` disposition (item 7).
- Documentation-mitigation study, cloud-embedding scoping — deferred.
- Framework-review conversation — separate track.

## Current blocker
The live visual confirmation (by design, per the playbook).

## Last completed action
Visual parity evidence committed as a real report; KNOWN-GOOD entry
added; Inter defect routed to item 7 (pending confirm) — 2026-07-30.

## Next valid moves
1. Person looks at localhost:3000, confirms the panel visually.
2. Place this round's four files.
3. On confirm: item 5 formally closes. Item 6 (screen-reader) opens
   next — likely a good candidate to route mostly through Kilo Code
   given the usage-limit constraint, reserving Claude Code for any
   real defects found during the pass.

## Files changed last round
- (pending this round's placement)
