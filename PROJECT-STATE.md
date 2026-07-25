# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. **All MVP-A and
MVP-B Slice 1/2a/2b screens are now real, complete, and end-to-end
verified.** This is the first point in the project where every
approved screen has moved from Magic Patterns mock to working code.

## Phase
**Full application complete: backend pipeline + all 7 frontend
screens.** Import → preprocessing → symbols → embeddings → ready,
Ask/Chat (Groq), Symbols API, Search (real FTS+GIN), Export (all
three formats), Reanalyze/Delete — all real, all tested, all wired to
real UI. Every screen ported directly from its approved Magic
Patterns source, not reinvented.

## Where everything actually lives
- **Dashboard, Overview, Explorer, Symbols, Search, Chat, Export:**
  all real, all committed, all real-verified against live data.
- **Real backend gaps discovered and closed along the way** (not
  deferred): Dashboard's Delete/Reanalyze endpoints, Overview's Stack/
  Testing detection, Symbols' zero-symbols empty state (genuine e2e
  proof), Explorer's per-file content endpoint + a real binary-
  detection bug fix, Search's entire FTS+GIN backend (built from
  scratch), Chat's inline citation markers, Export's full three-format
  backend (JSON/Task-Packet/Context+fallback).
- **Two real, cross-cutting bugs found and fixed this session,
  affecting both Chat and Export:** prompt-example leakage causing a
  hallucinated claim ("session store"), and a citation label-mismatch
  bug from positional array remapping. Both fixed with real tests.
- **KNOWN-GOOD.md** carries the full accumulated knowledge from this
  entire implementation arc.

## Key decisions
*(Unchanged, plus:)* Citations are now returned with an explicit
`label` field (not positionally inferred) across both Chat and
Export — a real, load-bearing correctness fix.

## Open questions
- Person-verification: most of tonight's work is Agent-verified, not
  yet independently clicked-through by a human in a real browser
  session — worth a real pass at some point, though the evidence
  standard throughout has been unusually rigorous (real API calls,
  real DB checks, real multi-run reproducibility tests).
- The architectural limitation Export's investigation surfaced —
  label-range citation validation proves citation TARGETS are real,
  not that surrounding PROSE is fully grounded — remains real and
  unsolved (see KNOWN-GOOD.md). Worth real user-facing framing at some
  point (e.g. a UI note about groundedness limits) if this becomes a
  priority.
- All prior smaller open items unchanged: hover-modifier visual
  confirmation, Search's static FILE_TYPES list (deliberate
  simplification), Symbols' File Explorer cross-link (deliberately
  deferred), embedding cross-call non-determinism, reanalysis.test.ts
  timing fragility, repo cleanup, GEMINI_API_KEY now fully retired in
  favor of Groq (gemini-generation.test.ts kept as historical proof
  artifact only).

## Current blocker
None.

## Last completed action
Export's citation label-mismatch bug fixed and verified (same root
cause as, and fixed alongside, an identical bug in Chat) — closing out
all 7 frontend screens as genuinely complete — 2026-07-25.

## Next valid moves
1. **Person-verification pass** — click through the real running app
   as an actual user, now that everything exists to click through.
2. Cross-screen navigation polish (Symbols→Explorer, Search→Explorer
   jump-to-line links were explicitly deferred throughout tonight —
   now that Explorer's real per-file content view exists, wiring these
   real navigational links is cheap, real, and valuable).
3. MVP-B remaining scope beyond what's built (if any — recommend a
   fresh review of the full PRD against what's now real, given how
   much emerged organically tonight beyond the original plan).

## Files changed last round
- `KNOWN-GOOD.md` (citation label-mismatch bug documented)
- `PROJECT-STATE.md` (this file)
