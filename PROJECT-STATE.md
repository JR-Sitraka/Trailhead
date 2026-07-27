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
**Upgrade — Layer 1 closing.** Scope in/out decided and priority
order confirmed (2026-07-27). One open scope question remains (golden
benchmark suite — recommendation issued, awaiting confirm). PRD
Upgrade section is written immediately after that confirm.

## Standing project rules (this phase)
- **All repo file placement/commits are Claude Code tasks** — the
  orchestrator supplies full file contents and a task packet every
  round (person's standing instruction, 2026-07-27).
- Same-codebase-continuation qualifier applies to all retrospective §8
  verdicts and promotion recommendations.

## Provisional-items trail (V4.2 — feeds retrospective §8, may not be blank)
- 2026-07-27 — trail opened. No provisional item triggered yet.
- 2026-07-27 — security-reviewer/security-review deliberately not
  triggered: auth deferred to V2/V3. Re-evaluate when observability
  touches API surfaces.

## Upgrade scope — decided IN, priority order CONFIRMED (2026-07-27)
1. **Doc-drift fix** — all docs stating Gemini/1,500-req-day updated
   to the shipped Groq reality (principles #3).
2. **Embedding model swap** — constraints unchanged (zero-spend,
   local, transformers.js). Success measured via retrieval benchmark
   across the 5-repo corpus: known code questions Top-3; filename
   refs no longer systematically outrank implementation; semantic
   questions outperform previous model; no doc-retrieval regression.
   *(Benchmark question below may insert a new item ahead of this —
   baseline must be captured on the current model pre-swap either way.)*
3. **Framework misdetection fix** — no more confident wrong answers;
   "unknown" becomes an allowed output (spec change, touches
   Overview/Export display).
4. **LLM observability, lightweight** — requests made, failures,
   provider status. NO enforcement, NO budgeting.
5. **Screen-reader accessibility** — real NVDA or VoiceOver pass; fix
   discovered issues; document remaining limitations.
6. **Testing closeout** — IMPORT-04, PREPROC-03 exact 500MB boundary;
   close already-implemented Dashboard/Explorer rows with real
   evidence.

## Upgrade scope — decided OUT
Quota enforcement/budgeting; authentication (explicitly deferred to
V2/V3); blueprint V1 items (structural graphs, impact analysis);
carried Group C items (corrupt-ZIP fragility, AnalysisJob ordering,
codeload rate limit, embedding non-determinism, hover-modifier,
context-blending revisit); conversation persistence; LLM query
rewriting; benchmark perf metrics (analysis/indexing runtime, memory)
if the benchmark itself lands — see open question.

## Key decisions
- **ADR-007 (2026-07-27):** Starter Kit V4.2 adopted (renumbered from
  draft 006 — ADRs 001–006 already existed; ADR-006 is the
  architecture-data-model backfill). Kit re-copy committed and
  verified: commit `2515324`, 18 files, clean tree confirmed.
  First real kit update-propagation event; kit CHANGELOG had no V4.2
  entry at adoption — recorded in the ADR for the retrospective.
- All prior decisions unchanged.

## Open questions
- **Golden benchmark suite** (person's proposal, 2026-07-27):
  orchestrator recommendation issued — IN, core metrics only
  (Top-1/Top-3 retrieval, framework detection, symbol resolution;
  runtime/memory deferred), inserted ahead of the embedding swap
  because the swap's "outperforms previous model" criterion requires
  a pre-swap baseline on the current model. Awaiting confirm/adjust.
- Commit `2515324`'s message says "ADR-006" while the file is ADR-007
  — unpushed, amendable; person's call, agent task drafted.
- Framework-review conversation for retrospective findings — still
  separate, unchanged.

## Current blocker
None — awaiting benchmark confirm (then PRD write) and the
message-amend decision.

## Last completed action
V4.2 re-copy + ADR placement verified against commit evidence;
priority order confirmed; benchmark recommendation issued —
2026-07-27.

## Next valid moves
1. Person confirms/adjusts benchmark → PRD Upgrade section written
   into `product-prd.md` (revised in place, history noted), Layer 1
   closes.
2. Optional: amend unpushed commit message via the drafted agent task.
3. Then Layer 2: identify which in-scope items need UX-flow work
   (screen-reader fixes, observability surface) vs. none (doc-fix,
   swap, benchmark).

## Files changed last round
- `PROJECT-STATE.md` (this file)
