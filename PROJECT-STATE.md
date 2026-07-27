# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B
fully implemented, verified, publicly released at
`github.com/JR-Sitraka/Trailhead`. This phase is the **Trailhead
Upgrade** — project 2 on the Starter Kit, now V4.2 (ADR-007), same
codebase.

## Phase
**Upgrade — Layer 1 scope interview: in/out decisions made
(2026-07-27), priority order pending confirmation.** PRD write follows
the priority confirmation.

## Standing project rules (this phase)
- **All repo file placement/commits are Claude Code tasks** — the
  orchestrator supplies full file contents and a task packet every
  round; nothing is left as a manual copy-paste job for the person
  (person's explicit standing instruction, 2026-07-27).
- Same-codebase-continuation qualifier applies to all retrospective §8
  verdicts and promotion recommendations.

## Provisional-items trail (V4.2 — feeds retrospective §8, may not be blank)
- 2026-07-27 — trail opened. No provisional item triggered yet.
- 2026-07-27 — `roles/security-reviewer.md` + `playbooks/security-review.md`
  **deliberately not triggered**: auth explicitly deferred to V2/V3;
  no upgrade scope item touches auth/sensitive-input surfaces so far.
  Re-evaluate if observability work touches API surfaces.

## Upgrade scope — decided IN (2026-07-27 interview)
1. **Embedding model swap** — constraints unchanged (zero-spend,
   local, transformers.js). Success = retrieval benchmark across the
   existing 5-repo corpus: known code questions retrieve relevant
   implementation files in Top-3; filename references no longer
   systematically outrank implementation; semantic questions
   outperform the previous model; no measurable regression on
   documentation retrieval.
2. **Framework misdetection fix** — success = detection no longer
   produces confident wrong answers; "unknown" becomes an allowed
   output (real spec change, touches Overview/Export display).
3. **Screen-reader accessibility** — real NVDA or VoiceOver pass;
   discovered issues fixed; remaining limitations documented.
4. **Doc-drift fix** — all docs stating Gemini/1,500-req-day updated
   to the shipped Groq reality (principles #3; mandatory regardless).
5. **LLM observability, lightweight** — requests made, failures,
   provider status. Explicitly NO enforcement, NO budgeting.
6. **Testing closeout** — IMPORT-04 (real multi-branch detection),
   PREPROC-03 exact 500MB boundary; Dashboard/Explorer rows closed
   with real evidence where already implemented.

## Upgrade scope — decided OUT
Quota enforcement/budgeting; authentication (deferred explicitly to
V2/V3); blueprint V1 items (structural graphs, impact analysis —
still non-binding); all carried Group C items (corrupt-ZIP
string-matching fragility, AnalysisJob ordering, codeload rate limit,
embedding cross-call non-determinism, hover-modifier confirmation,
questions-only context-blending revisit — no real-usage evidence has
triggered it); conversation persistence; LLM query rewriting.

## Key decisions
- **ADR-007 (2026-07-27):** Starter Kit V4.2 adopted. First real kit
  update-propagation event; kit CHANGELOG had no V4.2 entry at
  adoption — recorded for the retrospective.
- All prior decisions unchanged.

## Open questions
- **Priority order of the six in-scope items** — orchestrator
  recommendation issued (doc-fix → embedding swap → misdetection →
  observability → screen-reader → testing closeout, reasoned from the
  recorded biggest-unknown-first precedent, MVP-B §1); awaiting the
  person's confirm/reorder.
- ADR numbering: confirmed 007 is the next sequential number (Claude
  Code verified in the placement task; the kit's own adr-006 slot was
  already taken by `adr-006-backfill-architecture-data-model.md`).
- Framework-review conversation for retrospective findings — still
  separate, unchanged.

## Current blocker
None — awaiting priority-order confirmation.

## Last completed action
Scope interview in/out decisions recorded; standing file-handling
rule recorded; Claude Code placement + V4.2 re-copy task packet
issued — 2026-07-27.

## Next valid moves
1. Person confirms/reorders priority → PRD Upgrade section written
   into `product-prd.md` (revised in place, history noted).
2. Claude Code runs the placement + kit re-copy task packet.

## Files changed last round
- `PROJECT-STATE.md` (this file)
- `docs/10-decisions/adr-007-adopt-starter-kit-v4.2.md` (new — content
  unchanged from previous round's draft except ADR number, renamed
  from 006 to 007 to avoid collision with the existing
  `adr-006-backfill-architecture-data-model.md`)
