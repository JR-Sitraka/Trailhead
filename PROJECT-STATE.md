# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B are
both fully planned end-to-end. Backend implementation has made major
progress; frontend remains entirely unbuilt.

## Phase
**MVP-A's analysis pipeline (import → ready) plus a first real MVP-B
feature (Ask/Chat) are both genuinely complete on the backend.** The
Symbols API endpoint is also done. Everything is real, tested, and
committed. **No frontend UI exists anywhere in this project** — every
screen so far is a Magic Patterns mock, never built as real Next.js
UI or wired to any of these real, working APIs.

## Where everything actually lives
- **Steps A–D2 (import, preprocessing, symbol extraction, embeddings,
  Repository.status='ready'):** all closed, all committed, all real.
- **Ask/Chat (Slice 1, first real MVP-B feature):** fully implemented
  — retrieval, citation-label validation, generation. Originally built
  against Gemini; switched to **Groq (llama-3.3-70b-versatile)**
  tonight after discovering this project's actual Google account has
  a real 20 req/day ceiling on all Gemini Flash models (not the 1,500
  documented broadly), blocked from raising via a known,
  currently-unresolved Google billing bug (OR_BACR2_44). Groq proven
  working end-to-end with real API calls, real citation resolution,
  and a real deterministic-ordering fix for a genuine (if narrow)
  retrieval tiebreaker bug.
- **GET /api/repositories/:id/symbols:** done, server-side kind
  filtering verified via direct DB comparison, zero-symbols case
  handled correctly.
- **KNOWN-GOOD.md** carries the full accumulated environment/
  implementation knowledge from tonight's entire arc — required
  reading before any further backend work.

## Key decisions
*(Unchanged, plus:)* Generation provider is now Groq, not Gemini — see
ADR-004's fourth addendum for full reasoning. `retrieveChunks` uses
`ORDER BY cosine_distance ASC, id ASC` for deterministic tiebreaking.

## Open questions
- **Frontend is entirely unbuilt** — this is the largest real gap in
  the project right now, not a minor item. Every screen exists only
  as a Magic Patterns mock from early in the project; none are wired
  to any real backend endpoint.
- `tests/gemini-generation.test.ts` is a historical proof-of-
  environment artifact only — GEMINI_API_KEY is now genuinely invalid
  (confirmed real API_KEY_INVALID error, not quota-related); not
  investigated further since Ask/Chat no longer depends on it.
- All prior open items unchanged: Symbols/Search person-verification,
  Symbols' zero-symbols empty state (now backend-verified, still
  needs real UI verification once frontend exists), screen-reader
  behavior across Ask/Chat/Export, `/export/context` fallback-
  correctness test, questions-only context-blending, cross-screen
  retrofit sweep pattern, repo cleanup (stray zip fixtures /
  tsconfig.tsbuildinfo), branch-selector logic, corrupt-ZIP catch's
  string-matching fragility, AnalysisJob lookup ordering (deferred to
  Reanalyze), codeload.github.com's separate rate limit, embedding
  cross-call non-determinism (see KNOWN-GOOD.md, not expected to
  affect real usage).

## Current blocker
None.

## Last completed action
GET /api/repositories/:id/symbols implemented and verified; embedding
non-determinism finding logged — 2026-07-23.

## Next valid moves
1. **Export (Slice 2a)** — reuses Ask's retrieval/generation
   machinery directly, now proven on Groq.
2. **Start real frontend implementation** — the largest, most
   visible gap. Every backend endpoint built tonight has zero UI.
3. Opportunistically: everything in Open questions above.

## Files changed last round
- `KNOWN-GOOD.md` (embedding non-determinism finding)
- `PROJECT-STATE.md` (this file)
