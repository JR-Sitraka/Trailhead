# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — ADR-009 DRAFTED: candidate selected, migration scoped.
Implementation (schema migration + re-embed + BENCH-04 comparison) is
next.**

**Hash convention:** as of 2026-07-28, `main` HEAD `d2b97a9`.

## Item 3 — candidate selected (ADR-009, 2026-07-28)
**`jinaai/jina-embeddings-v2-base-code`, quantized (q8), dim 768.**
- Environment: passes, no compatibility errors, real correctness
  separation (related 0.42-0.56, unrelated 0.06-0.11).
- Throughput (corrected methodology, v1 discarded as invalid —
  OOM-driven padding to a 3,918-char outlier mislabeled as compute):
  **6.3× slower than current, like-for-like on the same machine.**
  q8 matches fp32 quality at half the cost — q8 selected.
- Tokenizer/truncation Edge Case CLOSED: 8192 max length vs. observed
  max 1,098 tokens, zero truncation.
- **Ratio (6.3×) is the durable decision basis; measured wall-clock
  hours are machine-dependent** (this dev machine measured ~34×
  slower than KNOWN-GOOD's historical figure even on the CURRENT
  model — memory-constrained: 7.4GB RAM, 3.3GB free, 4 CPUs).
- **BENCH-04's post-swap comparison is still the actual quality
  gate** — ADR-009 establishes viability to implement, not a
  retrieval-quality verdict.

## Latent risk found incidentally (item 7)
`src/server/services/embeddings.ts`'s `BATCH_SIZE=32` has no
length-awareness; survives today only via per-file batching keeping
batches small. A file with 30+ long chunks in one batch could
reproduce the throughput task's v1 OOM on constrained hardware.
Independent of the swap; folded into item 7, not fixed now.

## Coding-agent policy — unchanged (type-based split)
Placement always Claude Code; implementation split by complexity.
Schema migration + re-embed implementation is complex/hard-gated →
Claude Code.

## Baseline results — unchanged, still the comparison point (SWAP-04)
Semantic Top-1 = 0.000 → known_code Top-1 = 0.250 → TRAP-06 total
displacement, in priority order.

## Key decisions
ADR-010, ADR-008, ADR-007, ADR-005 amended twice, **ADR-009 drafted
(embedding model choice).**

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged. New candidate: the throughput task's own self-correction
(discarding an invalid, scary v1 number rather than reporting it) is
strong evidence for the verification-tiers discipline actually
preventing bad decisions, not just documenting them after the fact.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — COMPLETE. **3 swap —
ADR-009 drafted; migration + re-embed + SWAP-04 comparison next.**
4 "Unknown" — CLOSED. 5 observability — handoff frozen. 6
screen-reader — plan placed. 7 closeout — boxen + got orphaned-state
+ check-got.ts + BATCH_SIZE latent risk.

## Open questions
- Migration sequencing: dry-run on `trailhead_bench` first (cheap,
  4,039 chunks, ~3.1h on this machine) before touching
  `trailhead_dev`? Recommend yes — orchestrator will propose this
  explicitly next round.
- `scripts/check-got.ts` disposition (item 7).
- Framework-review conversation — separate track.

## Current blocker
None.

## Last completed action
ADR-009 drafted from two rounds of real, gated evidence (environment
probe + corrected throughput measurement) — 2026-07-28.

## Next valid moves
1. Place ADR-009 + embedding-swap.md amendment + this file.
2. Claude Code: pgvector schema migration (384→768) + q8 model
   integration, dry-run against `trailhead_bench` first, THEN
   `trailhead_dev` — with real rollback exercised once (SWAP-06).
3. BENCH-04 post-swap comparison against the committed baseline.

## Files changed last round
- `PROJECT-STATE.md` (main, `d2b97a9` — probe-flagged version)
