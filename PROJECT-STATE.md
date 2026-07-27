# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — Layer 8, batch 2 placed.** Feature specs now exist for
items 2 (benchmark) and 3 (swap), joining item 5 (observability).
Remaining Layer 8: item 4's "Unknown"-state amendments to the
existing Overview/Export specs + the consolidated architecture.md
full-pass update — both need current-file relays (requested in this
round's task).

## Approval gates passed
- 2026-07-27 — Dashboard observability panel: human visual approval,
  all four states. Artifact `cfe1be53…`.

## Standing project rules (this phase)
- All repo file placement/commits are Claude Code tasks, full packet
  every round.
- Same-codebase-continuation qualifier on §8 verdicts/promotions.

## Provisional-items trail (V4.2 — feeds retrospective §8)
- Unchanged from last round (security-reviewer not triggered;
  design-handoff/visual-parity scheduled; credit-exhaustion nuance).

## Upgrade scope — FINAL (product-prd.md)
1 doc-drift → 2 benchmark (SPEC DONE) → 3 swap (SPEC DONE; hard
dependency on BENCH-04 baseline; ADR-008 will record the runtime
model choice) → 4 "Unknown" (amendments pending relays) → 5
observability (design + spec done) → 6 screen-reader → 7 testing
closeout.

## Key decisions
- Benchmark manifest/versioning model; quota-free runs (retrieval
  only, zero LLM calls); jitter measured not assumed (carries the
  known embedding non-determinism honestly).
- Swap: dimension migration flagged to architecture full pass;
  rollback must be exercised once for real (SWAP-06); an honest
  no-candidate-fits outcome is a legitimate ADR-008 result.
- All prior decisions unchanged.

## Open questions
- None blocking. Framework-review conversation — separate track.

## Current blocker
None — awaiting relays (Overview/Export feature specs +
architecture.md) for Layer 8's final batch.

## Last completed action
Benchmark + swap feature specs drafted; relay task issued —
2026-07-27.

## Next valid moves
1. Place files; relay the three requested docs.
2. Next round: item 4 amendments in place + consolidated
   architecture.md full-pass update (counter table, benchmark
   artifacts, dimension-migration note) + testing.md additions —
   closing Layers 8/9. Then implementation packets begin:
   design-handoff for the panel first.

## Files changed last round
- `docs/08-features/benchmark.md` (new)
- `docs/08-features/embedding-swap.md` (new)
- `PROJECT-STATE.md` (this file)
