# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. **MVP-A and MVP-B
are both fully implemented, extensively real-verified (backend +
live UI), and formally reconciled against testing.md.** This is the
most complete, most rigorously checked state this project has reached.

## Phase
**MVP-B closed.** Every planned feature (Import, Preprocessing,
Symbols, Embeddings, Dashboard, Overview, Explorer, Search, Symbols
UI, Chat, Export) is real, built, and verified — through real API
calls, real database checks, real Playwright browser automation, and
real person click-throughs across all 7 screens. `testing.md` reflects
real, per-criterion evidence for Ask/Chat and Export, not just
aggregate pass counts. One significant, real, well-documented
limitation remains open by deliberate choice, not oversight (see
below) — everything else that was found broken tonight was found and
fixed for real.

## Where everything actually lives
- **Full backend + all 7 frontend screens:** complete, committed,
  real. See `KNOWN-GOOD.md` for the full accumulated record of every
  real bug found and fixed this session — it's long, and worth
  reading in full before picking this project back up.
- **`testing.md`:** now has real, per-criterion Agent-verified status
  for Chat (CHAT-01–10) and Export (EXPORT-01–10), plus new real UI
  verification entries for Overview/Symbols/Search and a real
  keyboard-accessibility pass across all 7 screens.
- **Person-verification:** you've now personally clicked through and
  confirmed all 7 screens directly (Dashboard, Explorer, Export
  earlier; Overview, Symbols, Search, Chat this round) — the one
  verification tier that can never be delegated to an agent
  (`principles.md` #2) is genuinely covered.

## Key decisions
*(Unchanged, plus:)* `NO_EVIDENCE_THRESHOLD` raised 0.7→0.75, based on
one real, documented retrieval data point — not comprehensively
validated across a full eval corpus, but no longer an arbitrary guess
either.

## Open questions — one real, significant item, everything else minor
- **The embedding model (Xenova/all-MiniLM-L6-v2) has no code-semantic
  understanding — a real, confirmed, significant limitation, not
  fixed tonight by design.** Real controlled evidence: for the query
  "what's inside index.js," the model ranks `package.json` (which
  merely mentions the filename) above the actual real content of
  `index.js` itself (cosine distance 0.63 vs 0.90 — surface token
  match beating semantic content match). The 0.75 threshold tune
  applied tonight is a real, honest partial mitigation; it does not
  fix the underlying ranking problem. **A real fix requires a
  code-aware embedding model** (candidates worth researching:
  something in the CodeBERT/code-specific-embedding family), which
  must still satisfy the project's zero-spend/local/transformers.js
  constraints — this needs its own dedicated research session
  (real ADR update, real re-embedding of every existing repository,
  real re-verification), not a tail-end addition. This is the
  **single most important thing to pick up next**, ahead of any other
  open item below.
- Screen-reader-output testing (NVDA/VoiceOver) — real, separate,
  unclosed gap; keyboard-navigation testing (done tonight) explicitly
  does not close this.
- CHAT-09 (malformed history rejection) — structurally UI-untestable,
  permanently Partially-verified by design, not a gap to keep chasing.
- Questions-only context-blending — still deliberately deferred,
  unchanged.
- All smaller prior items unchanged (hover-modifier confirmation,
  AnalysisJob ordering for Reanalyze, corrupt-ZIP string-matching
  fragility, codeload.github.com's separate rate limit,
  cross-call embedding non-determinism).

## Current blocker
None.

## Last completed action
NO_EVIDENCE_THRESHOLD tuned to 0.75 based on real retrieval
investigation; MVP-B formally closed with full testing.md
reconciliation and complete person-verification across all 7 screens
— 2026-07-25.

## Next valid moves
1. **Code-aware embedding model research and swap** — the one real,
   significant open item. Deserves a fresh session, starting with real
   candidate research (not assumption) against the zero-spend/local
   constraint, same discipline as tonight's Gemini→Groq investigation.
2. V1–V3 scoping, if/when you want to extend beyond MVP-B — would need
   its own Layer 1 PM interview against the blueprint's later
   sections, not a continuation of current work.
3. Screen-reader testing, if prioritized.

## Files changed last round
- `PROJECT-STATE.md` (this file)
