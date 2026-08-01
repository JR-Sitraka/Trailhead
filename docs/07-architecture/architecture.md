# Technical Architecture — Repository Intelligence Platform (MVP-A + MVP-B Slice 1 + Slice 2a + Slice 2b)

**Pass status:** MVP-A, Slice 1, Slice 2a — full pass. Slice 2b — full
pass. **Data Model / API Contracts backfilled 2026-07-21 (ADR-006)** —
the MVP-A base Repository/File/AnalysisJob schema and
POST/GET /api/repositories contract were implemented and tested before
ever being written into this file; this pass adds the real, verified
content that was previously just a section header.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | Single framework covers dashboard, repo workspace UI, and server logic — no separate frontend/backend split needed at MVP-A's scope. Unchanged for Slice 1 — Ask is another route in the same app, not a new service. |
| Backend | Next.js server actions / route handlers (same app) | Orchestration runs in-process in the same Next.js app, not a separate runtime, per ADR-002's original reasoning and confirmed still valid by Slice 1's compatibility research (ADR-004). |
| Parsing | `web-tree-sitter` (WASM), not `node-tree-sitter` (native bindings) | See ADR-002 — documented native-binding fragility across Node versions/environments. Unchanged since MVP-A. |
| Database | PostgreSQL | Repos, jobs, files (including content), symbols, and (Slice 1) embeddings via `pgvector`. Also serves MVP-A's search (tsvector/GIN full-text index) — no separate search engine or vector database. |
| Data access layer | Drizzle ORM | See ADR-003. Slice 1: Drizzle's native `vector` column type + `cosineDistance` operator used for embedding storage/query. **Correction, logged during real implementation (KNOWN-GOOD.md, 2026-07-22):** Drizzle's native `vector` type covers querying, but has no HNSW/vector-index builder — index creation requires raw SQL alongside the Drizzle-managed schema push, not a pure-Drizzle path as originally framed here. |
| Search backing (keyword) | PostgreSQL full-text search (tsvector) + exact `ILIKE`/index lookups | Unchanged, still Search's backing. |
| Search backing (semantic) | `pgvector` extension on the same Postgres instance | Keeps the "one datastore" theme — no separate vector database for a single-operator, zero-spend project. HNSW index, cosine distance. See ADR-004 for the query-pattern gotcha this must avoid — empirically confirmed via real EXPLAIN evidence during implementation (KNOWN-GOOD.md, 2026-07-22). |
| Embeddings | `@huggingface/transformers` (transformers.js), in-process in the Next.js server | Runs natively in Node (confirmed, ADR-004) — no Python service, no separate process. Model: `Xenova/all-MiniLM-L6-v2` (384-dim), self-hosted, zero marginal cost. |
| Generation | Groq (`llama-3.3-70b-versatile`), free tier, behind one internal abstraction | Switched from Gemini during MVP-B implementation (see KNOWN-GOOD.md / RETROSPECTIVE.md). Limits and constraint-shape note: this file's Upgrade section (2026-07-27), which supersedes stale quota references elsewhere. |
| File content storage | `text` column on the `files` table (not object storage) | Unchanged from MVP-A. Real persistence confirmed during implementation (2026-07-22) — this was a real gap found and fixed, not assumed working from this decision alone; see architecture.md's MVP-A base Data Model section. |
| Job/worker model | In-process background job (DB-backed `analysis_jobs` table, polled by the UI) — no Redis, no dedicated queue | Unchanged. Implemented as a simple in-process poller (`FOR UPDATE SKIP LOCKED`, 10s interval) via Next.js's instrumentation.ts hook — confirmed working via real server-boot verification (KNOWN-GOOD.md, 2026-07-22). |
| Auth | None | Unchanged. |
| State management | Server Components + SWR/React Query for job-status polling | Unchanged. |
| Deployment | Local-only | Unchanged. |
| CI/CD | Not set up | Unchanged. |
| Monitoring | Local console/log output only | Unchanged. |

## Data Model

### Repository, File, AnalysisJob (MVP-A base — backfilled 2026-07-21 from implemented, tested schema; see ADR-006)

```
Repository
  id: uuid, primary key, default random
  name: varchar(255), not null
    — GitHub source: "{owner}/{repo}"
    — ZIP source: uploaded filename with a trailing ".zip" stripped
  status: enum('queued', 'analyzing', 'ready', 'failed'), not null, default 'queued'
  source: enum('github', 'zip'), not null
  sourceUrl: text, nullable — null for zip; the GitHub URL string for github
  commitSha: varchar(64), nullable at the schema level (always null for
    zip-sourced rows), but as of 2026-07-21 NEVER null for a
    successfully created GitHub-sourced row — see "commitSha
    integrity" below.
  createdAt: timestamp with timezone, not null, default now
  updatedAt: timestamp with timezone, not null, default now
  relationships: has many File (cascade delete), has many AnalysisJob (cascade delete)

File
  id: uuid, primary key, default random
  repositoryId: uuid, not null, FK -> Repository.id, cascade delete
  path: text, not null
  size: integer, not null
  language: varchar(64), nullable
  skipped: boolean, not null, default false
  skipReason: text, nullable

AnalysisJob
  id: uuid, primary key, default random
  repositoryId: uuid, not null, FK -> Repository.id, cascade delete
  status: enum('queued', 'running', 'completed', 'failed'), not null, default 'queued'
  truncated: boolean, not null, default false
  createdAt: timestamp with timezone, not null, default now
  updatedAt: timestamp with timezone, not null, default now
```

**commitSha integrity (real fix, 2026-07-21):** a GitHub-sourced import
fails outright (`502`) if the HEAD-commit lookup fails, even when the
repository itself was confirmed to exist — a `Repository` row is never
created with a missing commit identity. This was NOT the original
behavior (the first implementation silently allowed `commitSha: null`
on this specific failure); corrected after a direct spec-vs-code
cross-check found the contradiction with this file's own stated
business rule. See ADR-006.

**~~Known gap~~ — AnalysisJob lookup ordering: RESOLVED (verified
2026-08-01, item 7 Group 1).** This was tracked in ADR-006 as an
unfixed gap: `GET /api/repositories` and `GET /api/repositories/:id`
attached a repository's `AnalysisJob` via a lookup with no
`ORDER BY createdAt`, which would pick an arbitrary job once Reanalyze
created a second row. It has since been fixed and is now confirmed by
direct source check — every job-lookup site orders by
`desc(analysisJobs.createdAt)`: `GET /api/repositories` (sorts all jobs
desc, then takes the first per repository), `GET`/`DELETE
/api/repositories/:id`, `POST /api/repositories/:id/reanalyze`, and the
Overview page's server-side query. No code change was needed this
round — this entry records the verification, not a new fix.

### Symbol (MVP-A base — spec recovered 2026-07-22, implementation not yet started — see Step C in PROJECT-STATE.md)

```
Symbol
  - id: uuid (pk)
  - fileId: uuid (fk -> File)
  - kind: enum('function', 'class', 'interface', 'import', 'export')
  - name: text
  - startLine: integer
  - endLine: integer
  relationships:
    - belongs to File (and transitively Repository)
```

**Widened `kind` enum, stated with its reasoning:** the original
MVP-A pass scoped `kind` to `function`/`class`/`interface` only. The
Symbols feature spec (`symbols.md`) requires imports/exports to be
extracted and independently filterable — the enum was widened to
`import`/`export` so the same table backs those filter chips directly,
rather than inventing a second, parallel table for the same underlying
concept.

**Direct consumers of this table's shape, worth keeping in sync if it
ever changes:** `EmbeddingChunk`'s chunking strategy (below) follows
`Symbol` boundaries where a file has them; Slice 2a's
REPOSITORY_CONTEXT.md retrieval heuristic scopes itself to entry-point
files' "most central symbols... where determinable from Symbol/import
data."

### Slice 1 — EmbeddingChunk

```
EmbeddingChunk (new, MVP-B Slice 1)
  - id: uuid (pk)
  - fileId: uuid (fk -> File)
  - repositoryId: uuid (fk -> Repository)
  -- Denormalized for query convenience (semantic search filters by
  -- repository first) — avoids a join through File on every
  -- retrieval query, which is Ask's hot path.
  - startLine: integer
  - endLine: integer
  - embedding: vector(384)
  -- Dimension matches Xenova/all-MiniLM-L6-v2's output.
  - createdAt: timestamp
  relationships:
    - belongs to File (and transitively Repository)
```

**Real design decision, stated with its tradeoff:** chunk TEXT is NOT
persisted here, only the vector and the line range. At generation
time, the chunk's actual text is re-sliced from
`files.content[startLine:endLine]` rather than read from a duplicated
copy — single source of truth over a marginal read-time cost.

**Chunking strategy:** chunk boundaries follow existing `Symbol`
boundaries where a file has them (a function or class's extracted line
range becomes one chunk). Files or regions with no extracted symbols
fall back to a fixed-size line-window chunk.

**pgvector index and query pattern — real, documented footgun:**
`EmbeddingChunk.embedding` gets an HNSW index with cosine distance.
Queries must use `cosineDistance` directly (ascending — smallest
distance first), **not** `1 - cosineDistance` descending — the
inverted form silently bypasses the index entirely (see ADR-004 for
the original reasoning; empirically confirmed via real EXPLAIN
evidence during implementation, KNOWN-GOOD.md 2026-07-22).

**Reanalysis semantics — CORRECTED 2026-08-01 (item 7, Group 1). The
text below now describes what the poller actually does; the previous
version described behavior that was never built.**

At the start of every analysis run, `runAnalysisPhases` deletes that
`Repository`'s existing `Symbol` and `EmbeddingChunk` rows and replaces
them with the new job's output. **`File` rows are NOT deleted or
replaced** — they are written once at import time by
`POST /api/repositories` and are never re-derived by the poller.
`Repository`'s denormalized stack fields are recomputed on every run.

The delete is unconditional and happens *before* the work, not after a
success check, so a job that fails partway has already cleared the old
symbols and chunks — it does not preserve them.

*Previously this section claimed all `File`/`Symbol`/`EmbeddingChunk`
rows were "deleted and replaced" only "on a fully successful
`AnalysisJob`". Neither half was true: `File` rows were never in scope,
and the delete is not conditional on success. `poller.ts`'s own inline
comment already said reanalysis was not implemented, contradicting this
file. Corrected per principles.md #3 — code and docs disagreeing is a
bug in the docs. Real File-row delete-and-replace remains deliberately
unimplemented and is a separate future decision, not silently added
here.*

### Slice 2a — zero new tables

**Real, notable finding: Slice 2a requires zero new tables.** Every
export format is computed on-demand from data that already exists.

**REPOSITORY_CONTEXT.md's retrieval strategy:** scoped to
`EmbeddingChunk`s belonging to files marked `category = 'entrypoint'`
plus their most central symbols — a heuristic, tunable rather than
locked, same precedent as Ask's no-evidence threshold.

**JSON export schema:**
```
{
  repository: { name, path, source, currentCommitSha, lastAnalyzedAt },
  stack: { primaryLanguage, framework, packageManager, buildTool,
           testFrameworkSummary },
  entryPoints: [ { path } ],        -- File.category = 'entrypoint'
  configFiles: [ { path } ],        -- File.category = 'config'
  symbols: {
    count: number,
    byKind: { function, class, interface, import, export }
  },
  notAnalyzed: [ { path, reason } ] -- File.skipped or embeddingSkipped
}
```

**Real, honest gap:** does NOT include a `modules` field — MVP-A's
Overview mock's "Modules & packages" section was always a hardcoded UI
list, never a real data-model concept. Not retrofitted here.

**Note:** this schema references `File.embeddingSkipped`, which does
not exist in the real, implemented `File` table (confirmed via
ADR-006's backfill: `id, repositoryId, path, size, language, skipped,
skipReason, content, category`). Unresolved — either the real `File`
table needs this column added, or this JSON schema needs re-deriving
from what actually exists. Flagged for whoever implements Slice 2a,
not fixed here.

### Slice 2b — zero new tables, no server-side conversation state

**Real, notable finding, consistent with Slice 2a: Slice 2b requires
zero new tables.** Per the locked "no persistence" decision, chat
conversation state is **not stored server-side at all** — it lives
entirely in client-side state (the browser) for the duration of the
tab being open, and is sent in full with every request. The server
never knows a "conversation" exists as a durable concept; each request
is stateless, consistent with the rest of this API (no auth, no
sessions, anywhere).

**Turn representation, sent by the client with every request (a
real, stated shape, not left implicit):**

```
{
  question: string,
  answer: string | null,  -- null for a turn that failed
                           -- (no_evidence/off_topic/generation
                           -- failure) — never a fabricated string
  citations: [{ fileId, path, startLine, endLine }]  -- empty if answer is null
}
```

**Trust boundary, stated explicitly rather than silently accepted:**
since conversation history is client-supplied on every request, a
client could in principle submit fabricated history (fake prior
answers/citations). **Accepted as a low-priority risk** given this
project's existing threat model — no auth, single local operator,
same trust boundary already implicit in every other endpoint. Not
worth building server-side history validation against a source of
truth that doesn't exist (since nothing is persisted server-side to
validate against in the first place).

## API / Interface Contracts

### POST /api/repositories, GET /api/repositories, GET /api/repositories/:id (MVP-A base — backfilled 2026-07-21 from implemented, tested route code; see ADR-006)

```
POST /api/repositories
  request: multipart/form-data
    source: 'github' | 'zip' (required)
    — if source='github': url (string, required), branch (string, optional)
    — if source='zip': file (binary, required)
  response (201): the created Repository row
    — zip: row is re-selected after File rows are inserted, so the
      response reflects final state
    — github: returned directly from the insert
  errors:
    400 — malformed/missing form fields (not multipart, missing source,
      missing url/file for the given source)
    400 — invalid GitHub URL format (doesn't match github.com/<owner>/<repo>)
    400 — GitHub repo not found (also covers a private repo the server's
      GitHub token has no access to — GitHub returns an identical 404
      for both cases by design; not distinguishable from our side,
      confirmed against GitHub's own documented behavior)
    400 — GitHub repo confirmed private (only reachable when the
      server's GITHUB_TOKEN has read access to the repo and its
      response includes `private: true`)
    502 — GitHub HEAD-commit lookup fails after repo existence is
      confirmed (an import is never allowed to succeed with a
      missing commit identity — see Data Model above)
    413 — ZIP buffer exceeds 150MB, checked before any parsing
    400 — ZIP is not a valid archive (AdmZip parse failure — currently
      caught via string-matching the library's own error message;
      known fragility, see KNOWN-GOOD.md)
    422 — ZIP fails safety validation (SecurityError: path traversal,
      unsafe symlink, zero files after filtering, or oversized
      with zero files indexed)
    500 — any other unexpected error

GET /api/repositories
  response (200): array of Repository rows, ordered by createdAt desc,
    each with an embedded `analysisJob` field (see the AnalysisJob
    ordering gap noted in Data Model above)

GET /api/repositories/:id
  response (200): single Repository row with embedded `analysisJob`
    (same ordering caveat)
  errors: 404 — repository does not exist
```

**Authentication note (GitHub calls):** requests to the GitHub API use
`Authorization: Bearer ${GITHUB_TOKEN}` when that env var is set
(5,000 req/hour), falling back to unauthenticated calls when it's not
(60 req/hour). This is a server-operator credential, not a per-user
credential — consistent with this project's no-auth, single-operator
model.

### POST /api/repositories/:id/chat (Slice 2b)

```
POST /api/repositories/:id/chat (renamed from /ask — Slice 2b)
  request: {
    question: string,
    history: [ { question, answer, citations } ]  -- prior turns, per
                                                     -- the shape above;
                                                     -- empty array for
                                                     -- the first turn
                                                     -- (functionally
                                                     -- identical to
                                                     -- Ask's old
                                                     -- single-turn
                                                     -- behavior)
  }
  response: (unchanged shape from Ask) {
    status: 'answered' | 'no_evidence' | 'off_topic',
    answer?: string,
    citations?: [...]
  }
  errors: 400 (empty/over-length question), 404, 409 (not Ready),
          502 (generation call fails)
  -- Retrieval: the embedding query is the current question
     concatenated with the last 1-2 turns' QUESTIONS ONLY (not
     answers) from the supplied history — "heuristic context
     blending," confirmed decision this round. Answer-blending (or a
     citation-only middle ground) was considered and deliberately
     deferred, not built preemptively — documented as a real
     candidate improvement, not a rejected idea, revisit if real
     conversations show questions-only retrieval missing follow-ups
     too often (see Explicitly rejected alternatives below).
  -- Generation: the FULL supplied history (all turns, not windowed)
     is included in the prompt context, regardless of how many turns
     that is — per the locked "full history, every turn" decision.
     This is a different scope than retrieval's blended query above —
     worth being explicit that these are two separate mechanisms with
     different scopes, not the same blending applied twice.
  -- Citation validation: applied per-turn, using that turn's own
     freshly-retrieved evidence — unchanged rule from Ask, no
     cross-turn validation logic needed.
```

**Naming note:** `/api/repositories/:id/ask` is renamed to `/chat`,
matching the tab rename — since nothing has been implemented yet,
there's no real migration concern; this is a clean rename, not a
versioned/deprecated-alongside-new-endpoint situation.

## System-wide Non-Functional Requirements

*(Prior NFRs unchanged.)* **Slice 2b addition:** the shared Gemini
quota risk (already flagged in Slice 2a) sharpens further here — a
single active chat session could consume several generation requests
in quick succession (one per turn), on top of whatever Export/Ask-as-
first-turn usage is also happening. Still no in-app enforcement,
consistent with the accepted-risk posture already on record — but
worth measuring directly once real implementation and real
conversations exist, more urgently than before.

## Explicitly rejected alternatives

*(Prior rejections unchanged.)*

**Slice 2b:**
- **Server-side conversation persistence/sessions** (a new table, a
  session concept). Rejected — no product requirement calls for it
  (PRD's explicit "no persistence" exclusion), and it would be the
  first stateful, persisted feature in a project that's been
  consistently ephemeral-by-default everywhere else (Ask, Export).
- **A separate `/chat` endpoint alongside a still-existing `/ask`.**
  Rejected — the product decision was explicit that Chat evolves Ask,
  not duplicates it; the architecture should mirror that exactly, not
  introduce two endpoints doing near-identical jobs.
- **LLM-based query rewriting for retrieval context.** Rejected —
  doubles LLM calls per turn against an already-strained shared quota,
  for a benefit not yet demonstrated as necessary.
- **Blending prior answers (or their citations) into the retrieval
  query.** Considered directly, real merit acknowledged (the
  "verifySession"/"PaymentsRepository" example specifically requires
  answer content, not just question content, to retrieve precisely) —
  but deliberately deferred, not built now, since embedding cost isn't
  the real constraint here (retrieval is free/local) and the actual
  constraint is unproven query-noise risk versus a real, working
  simpler default. A genuine candidate for revisiting with real
  evidence, not a rejected idea.
- **Server-side validation of client-supplied conversation history
  against a source of truth.** Rejected — no source of truth exists to
  validate against, since nothing is persisted server-side; accepted
  as a low-priority trust-boundary gap consistent with this project's
  existing no-auth threat model.

---

# Upgrade phase — full-pass additions (2026-07-27)

*(Everything above this section is preserved as written. Where an
Upgrade correction supersedes earlier text, it is stated here with a
date rather than silently rewritten — except the Generation stack
row, corrected in place per principles #3 since it described a
provider the shipped system does not use.)*

## Provider correction (Upgrade item 1 — doc-drift fix)
The shipped generation provider is **Groq
(`llama-3.3-70b-versatile`, free tier)** — switched from Gemini
during MVP-B implementation (see RETROSPECTIVE.md, implementation
section, and KNOWN-GOOD.md). Verified against Groq's published
limits (checked 2026-07-27; treat response headers as the runtime
source of truth): ~30 requests/min, **1,000 requests/day**, ~12K
tokens/min, **100K tokens/day** for this model. Every reference to
"Gemini" or "1,500 req/day" elsewhere in this file and in feature
specs is historical; this section supersedes them.

**Constraint-shape change, flagged not buried:** the original
"full conversation history every turn" decision was justified by
Gemini being request-count-limited, not token-metered. **Groq has a
real daily token ceiling (100K TPD), so that justification no longer
holds as stated.** Decision (2026-07-27): behavior unchanged — full
history remains — but the honest constraint is now on record, the
observability counters (below) exist to measure real consumption,
and windowing remains a deferred-pending-real-evidence candidate,
same status as answer-blending.

## Data Model — Upgrade additions

### LlmRequestLog (new — Upgrade item 5)
```
LlmRequestLog
  id: uuid (pk)
  createdAt: timestamp with timezone, not null, default now
  outcome: enum('success', 'failure'), not null
  provider: varchar(64), not null   -- from config at call time
```
Written by the shared generation abstraction on every generation
call (Chat turns, Export's REPOSITORY_CONTEXT.md — the abstraction
is the single choke point, so no path can bypass it). A failed write
is logged and swallowed — counting never breaks generation
(observability.md's NFR). No FK to Repository — metrics are global
by design.

### Embedding dimension (pending Upgrade item 3 / ADR-008)
`EmbeddingChunk.embedding` is `vector(384)` today, matching
`Xenova/all-MiniLM-L6-v2`. The model swap may change this dimension:
that is a real schema migration (column alter + full re-embed of
every repository; no mixed-model state ever queryable — see
embedding-swap.md). The exact dimension lands in ADR-008 with the
model choice; nothing changes in this file until then.

### Benchmark artifacts (Upgrade item 2 — zero new tables)
The benchmark suite is repo-local scripts + committed artifacts
(corpus manifest with pinned SHAs, ground-truth set, per-run
reports). It runs against the test database and makes zero LLM
calls. Consistent with Slices 2a/2b's zero-new-tables pattern.

## API — Upgrade addition

```
GET /api/observability
  response (200): {
    requests: number,      -- today, UTC day
    failures: number,      -- today, UTC day
    providerStatus: 'operational' | 'erroring' | 'unknown',
    providerName: string
  }
  errors: 500 only. No parameters, no auth (consistent project-wide),
  read-only, derived entirely from LlmRequestLog + config.
```
Status derivation: latest request's outcome today; `unknown` when no
request has been observed today. No synthetic health-check call is
ever made (it would spend quota to measure quota).

## System-wide NFRs — Upgrade restatement
The shared-quota risk is restated against the real provider: Chat +
Export share Groq's 1,000 req/day AND 100K tokens/day. Still no
in-app enforcement (explicit Upgrade exclusion) — but the risk is now
**measurable** via the observability counters instead of purely
accepted. The testing.md NFR row is updated to match.

## Explicitly rejected alternatives — Upgrade additions
- **Synthetic provider health checks.** Rejected — spends real quota
  to ask about quota; status derives from observed outcomes only.
- **Per-repository metrics scoping.** Rejected — the constrained
  resource is global; scoping would add joins and imply a precision
  the data doesn't need.
- **Counting local embedding calls.** Rejected — free and local; the
  panel measures exactly the constrained resource (recorded
  2026-07-27).

---

# Item 5 implementation correction (2026-07-30) — spec premise was false

**Both `observability.md` and this file's Upgrade section described a
"shared generation abstraction — single choke point" as already
existing.** It did not. Real trace: `chat.ts` and `export.ts` each
held an independent `new Groq(...)` + `ai.chat.completions.create(...)`
call — two duplicated sites, no choke point. **Real fix:**
`src/server/services/generation.ts` created as the actual single
choke point; both callers now route through it (`generateJson`).
`groq-sdk` now has exactly one import site in `src/`. Each caller's
error semantics preserved (Chat→502, Export→deterministic fallback),
confirmed by existing tests passing unchanged.

This corrects prior documentation, which asserted the abstraction as
settled fact when it was not (principles.md #3 — spec vs. code
disagreement is a bug in the docs). Item 3's `embeddings.ts`
`BATCH_SIZE` finding was a similar case; this is now the second
instance of "the docs describe production architecture that was
never actually built" — worth flagging together for the retrospective.

**Second correction:** the Dashboard/ObservabilityPanel work approved
via Magic Patterns (design-handoff, `component-specs.md`) was never
actually ported into the real codebase — `Dashboard.tsx` contained no
panel, no mock, no cycler, prior to this task. It has now been
ported for real, without the mock scaffolding (which never shipped,
so nothing needed removing — only excluding).
