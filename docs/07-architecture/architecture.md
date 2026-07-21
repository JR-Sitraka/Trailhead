# Technical Architecture — Repository Intelligence Platform (MVP-A + MVP-B Slice 1 + Slice 2a + Slice 2b)

**Pass status:** MVP-A, Slice 1, Slice 2a — full pass. Slice 2b — full
pass. **Data Model / API Contracts backfilled 2026-07-21 (ADR-006)** —
the MVP-A base Repository/File/AnalysisJob schema and
POST/GET /api/repositories contract were implemented and tested before
ever being written into this file; this pass adds the real, verified
content that was previously just a section header.

## Stack

*(Unchanged — see ADR-002 (MVP-A stack), ADR-003 (ORM choice), ADR-004
(MVP-B Slice 1 stack) for the actual decisions and reasoning. Slice
2a/2b introduce no new infrastructure — Slice 2a explicitly found
"zero new tables," Slice 2b reuses ADR-004's stack entirely.)*

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

**Known gap — AnalysisJob lookup ordering (not yet fixed, tracked in
ADR-006):** `GET /api/repositories` and `GET /api/repositories/:id`
both attach a repository's `AnalysisJob` via a lookup with no
`ORDER BY createdAt` — harmless today since no code path creates more
than one `AnalysisJob` per repository, but will pick an arbitrary job
once Reanalyze exists and creates a second row. Must be fixed as part
of implementing Reanalyze, not assumed correct at that point.

### Slice 1 — EmbeddingChunk

*(Unchanged from prior full pass — not re-stated here since no
cross-check against implemented code has happened yet for this table;
treat as pending the same real-code verification the base tables just
received, once Ask/Chat implementation begins.)*

### Slice 2a — zero new tables

*(Unchanged — Export reuses Repository/File/Symbol/EmbeddingChunk
entirely, no new schema.)*

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
