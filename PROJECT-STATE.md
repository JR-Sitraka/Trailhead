# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B are
both fully planned end-to-end (all 9 layers, all of MVP-B's three
slices). `RETROSPECTIVE.md` now covers both close points — MVP-A's
original retrospective plus a new MVP-B retrospective appended below
it. Zero implementation code exists anywhere in the project.

## Phase
**MVP-B planning + retrospective complete.** This is the real
session-boundary point flagged over the last several rounds — every
planning deliverable this session set out to produce now exists.

## Where everything actually lives — read these, don't re-derive them
- **Product → Testing (all of MVP-A + MVP-B):** unchanged from last
  round — see prior `PROJECT-STATE.md` history for the full layer-by-
  layer account.
- **Retrospective (new this round):** `RETROSPECTIVE.md` — now two
  parts in one file: the original MVP-A retrospective (unchanged) plus
  a new MVP-B retrospective appended below it (divided by a `---`).
  The MVP-B section explicitly cross-references MVP-A's findings (the
  Magic Patterns credit-exhaustion gap recurring a second and third
  time, this time across Ask/Export/Chat) — kept in the same file
  deliberately, not overwritten, since the new section's own reasoning
  depends on the old one still being readable.
- Real findings from the MVP-B retrospective worth carrying forward:
  two more rounds of real compliance deviations caught by the
  self-run `design-review` pass (Ask and Export's first builds, 4 each,
  same discipline working twice); a genuine spec-vs-mock drift
  (Search's "no matches" copy went a full round unapplied); three
  separate WorkspaceHeader cross-screen retrofit sweeps, newly named
  as a real, recurring pattern with no home in the kit yet; and the
  credit-exhaustion gap now confirmed three times within this one
  project (still correctly held per the two-project promotion rule —
  a second *project* is the actual bar, not a third occurrence in this
  one).

## Key decisions across all of MVP-B (not re-litigate without cause)
*(Unchanged — see prior round. Full detail lives in the PRD/UX/design/
architecture/feature docs directly, not restated here.)*

## Known open items (real, not blocking)
- Shared Gemini quota (Ask/Chat + Export) — still the most urgent
  unmeasured operational risk in the project, unchanged from last
  round.
- Symbols/Search screens (MVP-A) — still agent-verified only, never
  person-verified.
- Symbols' zero-symbols empty state, client-side-vs-server-side kind
  filtering — carried over, unchanged.
- Screen-reader behavior across Ask/Chat/Export's citation and form
  patterns — Unverified throughout.
- Ask/Chat/reanalysis race condition — accepted, unhandled.
- `/export/context`'s deterministic-fallback correctness — needs a
  dedicated test.
- Questions-only context-blending — real candidate for revisiting with
  evidence.
- `docs/10-decisions/adr-tool-setup.md` (ADR-005) — worth a quick
  re-check that it still reflects the full MVP-B scope now planned,
  not just Slice 1, before implementation actually starts.
- **New from this round's retrospective:** the "cross-screen retrofit
  sweep" pattern (adding/renaming a shared header element requires
  auditing every other screen using it) has recurred three times this
  session with no home in any role/playbook — worth real
  consideration at a framework-review conversation, per
  `RETROSPECTIVE.md`'s own ranking of it as a near-term candidate even
  before a second project confirms it.

## Current blocker
None.

## Last completed action
`RETROSPECTIVE.md` extended with the MVP-B retrospective (appended
below the existing MVP-A section) — 2026-07-20.

## Next valid moves
Both of this session's major planning deliverables (MVP-B's full spec,
and the retrospective covering it) are now done. Three real options,
same fork as before the retrospective was written, still not defaulted
into:
1. **Begin implementation** — of MVP-A, Slice 1, Slice 2a, and/or
   Slice 2b. `AGENTS.md`/`KNOWN-GOOD.md` are in place (ADR-005), worth
   a quick check that ADR-005 still fits the now-fully-planned MVP-B
   before starting.
2. **Transition to a new session** for whatever comes after MVP-B
   (V1-V3) — this file and both retrospective sections are written to
   be genuinely self-sufficient for that handoff, per the PRD's own
   session-boundary constraint.
3. Stay in this session and continue some other direction the person
   has in mind — nothing about the planning work forces an immediate
   choice between 1 and 2.

## Files changed last round
- `RETROSPECTIVE.md` (MVP-B retrospective appended)
- `PROJECT-STATE.md` (this file)
