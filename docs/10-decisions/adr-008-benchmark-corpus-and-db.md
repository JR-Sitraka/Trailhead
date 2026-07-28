# ADR-008: Benchmark corpus instantiation and dedicated bench database

**Status:** Accepted

**Date:** 2026-07-28

**Context:** Benchmark stage A stopped at its discovery gate with a
real finding: the "5-repo corpus" referenced across seven doc
locations (PRD, benchmark.md, ask.md, testing.md) **was never
instantiated** — an aspirational construct that became "true" through
repetition. The shipped no-evidence threshold was tuned against one
repo only (chat.ts's own comment admits it). Additionally,
benchmark.md required running against `trailhead_test`, which
KNOWN-GOOD documents as routinely churned by vitest fixtures — a
spec-vs-reality conflict for a fixed baseline. Per principles #3,
the spec is corrected, not worked around.

**Decision:**
1. **The corpus is now enumerated** (pinned SHAs recorded in
   `benchmark/manifest.json` at setup): Trailhead itself (framework
   signal), `sindresorhus/got` (the misdetection class, finding #7's
   exact repo), `sindresorhus/escape-string-regexp` (threshold-tuning
   continuity), `openai/DALL-E` (Python/mixed), `sindresorhus/awesome`
   (documentation-heavy, protects the no-regression criterion). Each
   is verified importable under project limits before being pinned.
2. **A dedicated `trailhead_bench` database** (Postgres + pgvector,
   `BENCH_DATABASE_URL`) hosts the corpus — not `trailhead_test`,
   whose fixture churn would put the baseline on unstable ground.
   benchmark.md amended accordingly.
3. **ADR renumbering:** the embedding-model-choice ADR pre-reserved
   as "ADR-008" in embedding-swap.md becomes **ADR-009** (this
   decision landed first); embedding-swap.md amended.

**Consequences:** benchmark.md and embedding-swap.md carry dated
amendments; setup adds one database + env var; the `boxen`
zero-files-yet-completed defect discovered during the same
investigation is logged in testing.md and folded into Upgrade item 7
(deliberately not chased now — scope discipline). The corpus-never-
instantiated finding is flagged for the phase retrospective as a
notable failure class (docs asserting an artifact into existence).
