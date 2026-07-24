# ADR-004: MVP-B Slice 1 stack additions (embeddings, vector storage, generation)

**Status:** Accepted

**Date:** 2026-07-20

**Update (2026-07-22):** Generation model switched from Gemini 2.5
Flash to **Gemini 3.5 Flash**. Reasoning: 2.5 Flash is scheduled for
retirement October 16, 2026 — described by current sources as "a
migration target, not a foundation." Confirmed directly (search,
2026-07-22, cross-referencing multiple sources including a direct
citation of Google's own pricing page) that 3.5 Flash carries the
same free-tier shape (15 RPM / 1,500 RPD, no card required) — this
is not a cost or quota tradeoff, purely a longevity improvement.
3.5 Flash also reports better coding/agentic benchmark performance
than 2.5 Flash, a secondary but real benefit given Ask's evidence-
citation task shares some character with agentic/structured-output
work. No other part of ADR-004's reasoning (in-process transformers.js
embeddings, pgvector, single internal generation abstraction so a
future model swap stays a config change) is affected — this
confirms that abstraction's value directly, since this is exactly
the kind of swap it was built to make cheap.

**Update (2026-07-22, third):** REVERTING the 2026-07-22 switch to
Gemini 3.5 Flash, back to **Gemini 2.5 Flash**. What happened: the
switch was reasoned entirely from search-aggregated claims that 3.5
Flash carried the same free-tier shape as 2.5 Flash (15 RPM/1,500
RPD). Real API calls proved this wrong — the actual quota-exceeded
error payload showed `"quotaValue":"20"` (20 requests/day), and this
was independently corroborated by a dated Google AI Developer Forum
thread (June 19, 2026) reporting the identical symptom from other
developers, with the same account's Gemini 2.5 Flash calls continuing
to work normally throughout. This is the second time this session a
confident, multi-source search claim didn't hold up against a real
API call — the lesson from `instrumentationHook`/DB-routing/
web-tree-sitter's Node-vs-browser behavior generalizes to third-party
API claims too, not just this project's own code.

Real alternatives were researched before reverting (not just falling
back by default): Groq (Llama 3.3 70B, ~1,000 RPD/30 RPM, fastest
inference, OpenAI-compatible) and OpenRouter (multi-provider routing,
hedges against any single provider's free-tier volatility) were both
real, viable candidates. Groq specifically was set aside for now, not
rejected outright — its quality/instruction-following on Ask's strict
evidence-grounded citation task is unverified, versus reverting to a
model already confirmed correct end-to-end (the JSON-parsing fix was
proven against a real, successful Gemini call before quota hit).
Revisit if Gemini's free tier becomes unreliable again before this
project's actual completion.

**Consequence:** `gemini-3.5-flash` reverts to `gemini-2.5-flash` as
the model ID string throughout `chat.ts` and its tests. No other
code/architecture change — the swap is exactly as cheap as ADR-004's
original "one internal abstraction" design intended it to be.

**Update (2026-07-22, fourth):** Switching generation provider from
Gemini entirely to **Groq (llama-3.3-70b-versatile)**. Root cause: the
actual Google AI Studio account backing this project has a real RPD
ceiling of 20 for ALL Gemini Flash models (confirmed via the live
Rate Limits dashboard, not just error payloads) — not the 1,500
documented broadly, and not specific to 3.5 Flash as first suspected.
The path to raising it (enabling billing) is blocked by a known,
currently-unresolved Google-side bug (error OR_BACR2_44), reported by
multiple developers on Google's own forums over several months with
no fix timeline. 20 req/day is not workable for iterative development
— this project alone exhausted it multiple times in a single evening
of test runs.

Groq chosen over OpenRouter for this switch: directly confirmed
higher, real free-tier ceiling (~1,000 RPD / 30 RPM, OpenAI-compatible
request format), no additional provider-routing layer needed, and
`chat.ts`'s existing structure (single internal abstraction, JSON
response parsing already implemented) ports over with a client swap,
not a redesign — again validating ADR-004's original "swap should be
a config change" design goal. Real tradeoff, stated honestly: an
open-weight model (Llama 3.3 70B) versus a proprietary frontier model
— instruction-following quality on Ask's strict evidence-grounded
citation task is being verified for real in this switch, not assumed
equivalent.

**Consequence:** @google/genai and GEMINI_API_KEY are no longer used
by chat.ts. groq-sdk + GROQ_API_KEY replace them. Prior real Gemini
verification evidence (JSON-parsing fix, citation validation, off_topic
handling) remains valid as proof the surrounding pipeline logic is
correct — only the generation-call layer itself changes.

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
