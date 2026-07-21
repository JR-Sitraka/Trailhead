# ADR-004: MVP-B Slice 1 stack additions (embeddings, vector storage, generation)

**Status:** Accepted

**Date:** 2026-07-20

**Context:** MVP-B Slice 1 introduces this project's first
LLM-dependent work — semantic retrieval and grounded-answer generation
for the Ask screen. The PRD locks a zero-spend cost constraint (Slice
1 Constraints section) but deliberately left the exact
embedding/LLM/vector-storage mechanism to this architecture pass.
Per `roles/software-architect.md`'s quality standard, a targeted
search for known compatibility issues was run before finalizing any
new stack pairing — not assumed safe by default.

**Decision:**
- **Embeddings:** `@huggingface/transformers` (transformers.js),
  running in-process in the existing Next.js server — not a separate
  service. Confirmed directly (search, 2026-07-20) that this library
  runs natively in Node.js server-side, not just the browser, and that
  Node/browser code paths are functionally equivalent. Model:
  `Xenova/all-MiniLM-L6-v2` (384-dim) — small, well-documented,
  self-hosted, zero marginal cost.
- **Vector storage:** `pgvector` extension on the existing PostgreSQL
  instance, queried through Drizzle's native `vector` column type and
  `cosineDistance` operator (0.36+). Two real gotchas found and
  designed around, not discovered later:
  1. A documented, real-world-reported bug pattern where querying
     `1 - cosineDistance` (descending) instead of `cosineDistance`
     directly (ascending) silently bypasses the vector index — one
     public report measured 12s vs. 100ms at 2.8M rows from this exact
     mistake. `architecture.md`'s Data Model section states the
     correct pattern explicitly.
  2. A drizzle-kit issue (GitHub #5647, opened 2026-04-15, still
     relevant as of this search) where `vector` type resolution breaks
     specifically when a table lives in a custom Postgres schema
     while the extension type lives in `public`. Avoided by keeping
     `embedding_chunks` in the default `public` schema — consistent
     with the rest of this project's schema anyway, so no real
     constraint imposed by avoiding this.
- **Generation:** Gemini 2.5 Flash, free tier (1,500 requests/day, no
  credit card, confirmed current as of 2026-07-20 search — multiple
  independent sources agree on this figure as of June 2026), called
  through one internal abstraction rather than direct call sites at
  each usage point.

**Consequences:**
- No new running service is introduced — embeddings run in-process,
  vector storage is the same Postgres instance, generation is an
  outbound API call like any other. The "single mono-stack Next.js
  app, no extra infrastructure" theme established in ADR-002 holds
  through this pass.
- **Real, accepted risk:** free-tier LLM quotas and even model
  availability have both changed abruptly for other providers within
  roughly the past year (one provider's free model catalog reportedly
  collapsed from ~12 models to 2 within months; another provider cut
  its free quota 50-80% in a prior period) — this is why generation is
  behind an abstraction rather than called directly. If Gemini's free
  tier changes materially, that's a one-file swap, not a
  re-architecture — but it IS a real, live risk to the zero-spend
  constraint holding indefinitely, not a solved problem.
- **Real, accepted tradeoff:** Gemini's free tier may use submitted
  data for model training (Google's stated policy, turned off once
  billing is enabled). Accepted specifically because this project
  never processes private repositories (locked in the PRD's Explicitly
  Out of Scope, both MVP-A and Slice 1) — would need re-evaluation
  before any future phase that does.
- `EmbeddingChunk`'s dimension (384) is tied to the chosen model — a
  future model swap that changes output dimensionality is a schema
  migration, not just a config change. Acceptable now; worth flagging
  if a higher-quality embedding model is ever considered for Slice 2
  or beyond.
