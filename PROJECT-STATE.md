# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 3 (embedding swap): environment check PASSED,
throughput needs a real measurement before ADR-009 is drafted.**

**Hash convention:** as of 2026-07-28, `main` HEAD `2564ad6`
(unchanged by the probe — scratch-only, nothing tracked/committed).

## Item 3 — candidate research, real evidence so far
**Candidate: `jinaai/jina-embeddings-v2-base-code`** (161M params,
JinaBERT, trained on GitHub code + 150M code/docstring QA pairs, 30
languages).

**Environment probe (2026-07-28) — PASSES, real evidence:**
- Loads and runs under this project's exact
  `@huggingface/transformers@4.2.0` — no `trust_remote_code` error on
  the ONNX path (the main Jina-family compatibility risk, confirmed
  not applicable here).
- Output dimension: **768, confirmed** — matches documented value.
  **Real pgvector migration required** (384 → 768), as
  `embedding-swap.md` anticipated.
- **Correctness sanity check — strong, clean separation:** related
  pairs scored 0.4230–0.5570, unrelated pairs 0.0551–0.1144. Notably,
  `retrieveChunks` (Drizzle SQL) and `generateEmbeddings`
  (transformers.js loop) scored 0.5570 despite almost no shared
  surface tokens — exactly the semantic discrimination the baseline's
  MiniLM lacks (semantic Top-1 = 0.000).

**Throughput — NOT YET TRUSTWORTHY, real gap flagged:**
Single cold run: 12.2s for 4 batched snippets, vs. current model's
~386ms for 30 chunks (KNOWN-GOOD 2026-07-22) — roughly two orders of
magnitude slower per item. **This number is confounded** (JIT/
first-inference warmup + unquantized fp32 + single sample) and must
NOT be treated as the real comparison. **A proper steady-state,
warm-cache, batch throughput measurement is required before ADR-009
drafts anything** — measured, not estimated, per
`software-architect.md`'s own quality standard.

**Also still open (real gaps, not blockers for the environment check
itself):** whether a quantized ONNX variant (q8/q4) exists and its
speed/quality tradeoff; tokenizer max-length vs. this project's
30-line chunk windows (embedding-swap.md's own flagged Edge Case,
untested).

## Coding-agent policy — unchanged (type-based split)
Placement always Claude Code; implementation split by complexity.
This round's probe and the next throughput task are both
decision-gating research → Claude Code.

## Baseline results — unchanged, still the comparison point
Semantic Top-1 = 0.000 → known_code Top-1 = 0.250 → TRAP-06 total
displacement, in priority order.

## Key decisions
ADR-010, ADR-008, ADR-007, ADR-005 amended twice. **ADR-009 still
NOT drafted** — deliberately, until throughput is measured properly.

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged; `session-recovery.md` still untriggered across the entire
implementation phase.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — COMPLETE. **3 swap —
candidate cleared on correctness; throughput measurement in flight;
ADR-009 pending.** 4 "Unknown" — CLOSED. 5 observability — handoff
frozen. 6 screen-reader — plan placed. 7 closeout — boxen + got
orphaned-state + check-got.ts.

## Open questions
- Throughput at real batch scale (next task).
- Quantized variant availability/tradeoff.
- Tokenizer max-length vs. chunk window size.
- `scripts/check-got.ts` disposition (item 7).
- Framework-review conversation — separate track.

## Current blocker
None — throughput measurement is the next concrete step.

## Last completed action
Environment probe passed with real correctness evidence; throughput
number correctly flagged as unreliable pending a real measurement —
2026-07-28.

## Next valid moves
1. Place this file.
2. Claude Code: proper steady-state throughput benchmark (warm cache,
   quantized-variant check, real batch size, tokenizer/chunk-length
   check) — same candidate, cleaner measurement.
3. Only then: draft ADR-009 with real numbers on both axes
   (correctness AND throughput).

## Files changed last round
- (none — probe was scratch-only, nothing tracked)
