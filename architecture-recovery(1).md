# Recovered content — architecture.md's "Stack" section (plus ADR-002 and ADR-004 cross-check)

**Why this file exists:** `docs/07-architecture/architecture.md`
currently collapses its entire Stack section to one pointer note:

> ## Stack
> *(Unchanged — see ADR-002 (MVP-A stack), ADR-003 (ORM choice), ADR-004
> (MVP-B Slice 1 stack) for the actual decisions and reasoning. Slice
> 2a/2b introduce no new infrastructure — Slice 2a explicitly found
> "zero new tables," Slice 2b reuses ADR-004's stack entirely.)*

Checked `git log -- docs/07-architecture/architecture.md` again: same
result as the last recovery — even the earliest committed version
(`a01d86c`) already has this exact placeholder, word for word. Same
root cause as before: the Slice 2b round's full-file rewrite replaced
the cumulative Stack table with a Slice-2b-only note instead of
restating the table beneath it, one round before the ADR-006 backfill
you're now seeing.

**Unlike the Data Model recovery, the two ADR files this section
points to are NOT missing or collapsed** — I read both directly:
`docs/10-decisions/adr-002-mvp-a-stack.md` and `docs/10-decisions/
adr-004-mvp-b-slice1-stack.md` are both fully intact on disk, exactly
as originally written. So this file does two things: (1) reconstructs
the actual Stack *table* from this conversation's transcript (the
table itself, not just the pointer to the ADRs behind it), and (2)
pulls the specific reasoning from ADR-002/004 that the table's "Why"
column depends on, so this one file is self-contained rather than
requiring three files open at once. **Per Sitraka's instruction,
nothing has been changed in `architecture.md`, the two ADR files, or
anywhere else — this is a standalone reconstruction only.**

---

## Stack (reconstructed — last full version, from the Slice 1 architecture pass)

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | Single framework covers dashboard, repo workspace UI, and server logic — no separate frontend/backend split needed at MVP-A's scope. Unchanged for Slice 1 — Ask is another route in the same app, not a new service. |
| Backend | Next.js server actions / route handlers (same app) | MVP-A had no LLM orchestration; Slice 1 changes this (see Embeddings/Generation rows below) — but the orchestration still runs in-process in the same Next.js app, not a separate runtime, per ADR-002's original reasoning and confirmed still valid by Slice 1's compatibility research (ADR-004). |
| Parsing | `web-tree-sitter` (WASM), not `node-tree-sitter` (native bindings) | See ADR-002 — documented native-binding fragility across Node versions/environments. Unchanged since MVP-A. |
| Database | PostgreSQL | Repos, jobs, files (including content), symbols, and (Slice 1) embeddings via `pgvector`. Also serves MVP-A's search (tsvector/GIN full-text index) — no separate search engine or vector database. |
| Data access layer | Drizzle ORM | See ADR-003. Slice 1: Drizzle's native `vector` column type + `cosineDistance` operator (0.36+) used for embedding storage/query. |
| Search backing (keyword) | PostgreSQL full-text search (tsvector) + exact `ILIKE`/index lookups | Unchanged, still Search's backing. |
| Search backing (semantic) | `pgvector` extension on the same Postgres instance | Keeps the "one datastore" theme from the original stack choice — no separate vector database (Pinecone, etc.) for a single-operator, zero-spend project. HNSW index, cosine distance. See ADR-004 for the query-pattern gotcha this must avoid. |
| Embeddings | `@huggingface/transformers` (transformers.js), running in-process in the Next.js server, not a separate service | Runs natively in Node (confirmed, not assumed — ADR-004) — no Python service, no Ollama-style separate process, consistent with this stack's "no extra infrastructure" theme. Model: `Xenova/all-MiniLM-L6-v2` (384-dim, small footprint) — self-hosted, zero marginal cost, satisfies the PRD's zero-spend constraint directly. |
| Generation | Gemini 2.5 Flash, free tier, called through a single internal abstraction (not scattered call sites) | Most generous current free tier (1,500 req/day, no card) — see ADR-004 for the comparison and for why it's wrapped in one swappable interface rather than called directly: free-tier quotas and even model availability have both changed abruptly across providers recently, and a hardcoded call site would mean a provider change touches the whole feature instead of one file. |
| File content storage | Stored directly as a `text` column on the `files` table (not object storage) | Unchanged from MVP-A. |
| Job/worker model | In-process background job (DB-backed `analysis_jobs` table, polled by the UI) — no Redis, no dedicated queue | Unchanged. Slice 1 extends this job's phases (see the Data Model recovery file); still no new infrastructure. |
| Auth | None | Unchanged. |
| State management | Server Components + SWR/React Query for job-status polling | Unchanged. |
| Deployment | Local-only | Unchanged. |
| CI/CD | Not set up | Unchanged. |
| Monitoring | Local console/log output only | Unchanged. |

(Slice 2a and 2b added nothing to this table — Slice 2a's own
architecture pass explicitly found "zero new tables" and reused every
existing stack choice; Slice 2b reuses ADR-004's stack entirely, per
its own architecture pass. Neither round is a separate recovery target
here.)

---

## ADR-002 — MVP-A stack: mono-stack Node/TypeScript, WASM tree-sitter (intact, quoted for context)

**Status:** Accepted · **Date:** 2026-07-19

**Decision:**
1. MVP-A uses a mono-stack Node/TypeScript architecture (Next.js app
   handles both frontend and backend/analysis logic) — no separate
   Python service.
2. Parsing uses `web-tree-sitter` (WASM bindings), not
   `node-tree-sitter` (native bindings).

**Why (the tree-sitter half specifically, since that's what
Sitraka flagged):** a targeted search (`node-tree-sitter native
bindings Vercel serverless deployment issues`, 2026-07-19) found
multiple current, open issues (`tree-sitter/node-tree-sitter #268`,
`tree-sitter/tree-sitter #2867`, `salesforce/agentscript #7`)
documenting native builds failing across Node major versions —
missing prebuilds, "compiled against a different Node.js version,"
C++20-vs-C++17 mismatches on Node 24. Vercel's own knowledge base
independently confirms native-dependency packages are a common,
distinct cause of "works locally, fails when deployed" serverless
failures. `web-tree-sitter` avoids native compilation entirely — same
parsing capability, different binding layer. This is a real,
documented gotcha found *before* committing, exactly the case
`roles/software-architect.md`'s quality standard exists to catch
cheaply rather than debugging after implementation.

**Scope, stated in the ADR itself:** explicitly not a permanent
rejection of Python — scoped to MVP-A, reopenable at MVP-B's
architecture pass if LLM/embedding tooling needs ever favor it. (MVP-B
Slice 1's own architecture pass, per ADR-004 below, confirmed the
mono-stack decision was still the right call rather than silently
inheriting it.)

## ADR-004 — MVP-B Slice 1 stack additions (intact, quoted for context)

**Status:** Accepted · **Date:** 2026-07-20

**Decision:** embeddings via `transformers.js` in-process;
`pgvector` on the existing Postgres instance via Drizzle's native
`vector` column + `cosineDistance`; generation via Gemini 2.5 Flash
free tier behind one internal abstraction.

**The two real gotchas this ADR found and designed around, stated in
its own words:**
1. A documented, real-world-reported bug pattern where querying
   `1 - cosineDistance` (descending) instead of `cosineDistance`
   directly (ascending) silently bypasses the vector index — one
   public report measured 12s vs. 100ms at 2.8M rows from this exact
   mistake.
2. A drizzle-kit issue (GitHub #5647) where `vector` type resolution
   breaks when a table lives in a custom Postgres schema while the
   extension type lives in `public` — avoided by keeping
   `embedding_chunks` in the default `public` schema.

**Real, accepted risks stated in the ADR itself:** free-tier LLM
quotas/model availability can change abruptly (why generation sits
behind an abstraction); Gemini's free tier may train on submitted
data (accepted because this project never processes private repos).

---

## Real divergence found while reconstructing this, not present in the original ADRs — flagged, not fixed

**`KNOWN-GOOD.md` now directly contradicts one specific claim this
Stack table's "Data access layer" row made about Drizzle:** the
original Slice 1 architecture pass's Data Model section said Drizzle's
native `vector` type meant embedding storage/query needed "no raw-SQL
escape hatch... unlike some ORMs." The real, logged implementation
experience (`KNOWN-GOOD.md`, 2026-07-22 entry) says the opposite for
*index creation* specifically: **"drizzle-orm v0.36.0's pg-core has no
vector-index builder (no `vectorIndex`/HNSW helper) — index creation
requires raw SQL alongside the Drizzle-managed schema push, not a
pure-Drizzle path."** This isn't a contradiction of ADR-004's actual
decision (pgvector + Drizzle's `vector` column type for *querying* is
still real and correct, per the same file's EXPLAIN-verified evidence)
— it's specifically the original Stack table overselling how
Drizzle-native the *index* side of this would be. Worth a small
correction to that "Why" column whenever this Stack table gets pasted
back for real, not a re-architecture — the decision holds, the framing
of one sentence about it doesn't quite match what was actually true
during implementation.

---

## What to do with this file

Same as the prior two recovery files: a recovery artifact, not a
canonical spec. If it looks right, the natural next step would be
pasting the Stack table back into `docs/07-architecture/
architecture.md` in place of its current placeholder — with the small
Drizzle/index-builder correction folded in, since that's real,
logged evidence, not a guess. Per instruction, nothing has been
touched — `architecture.md`, both ADR files, `KNOWN-GOOD.md`, and
`PROJECT-STATE.md` are all untouched.
