# Recovered content — architecture.md's "Slice 1 — EmbeddingChunk" and "Slice 2a — zero new tables" sections

**Why this file exists:** `docs/07-architecture/architecture.md`
currently collapses both of these to one-line placeholders:

> ### Slice 1 — EmbeddingChunk
> *(Unchanged from prior full pass — not re-stated here since no
> cross-check against implemented code has happened yet for this
> table; treat as pending the same real-code verification the base
> tables just received, once Ask/Chat implementation begins.)*
>
> ### Slice 2a — zero new tables
> *(Unchanged — Export reuses Repository/File/Symbol/EmbeddingChunk
> entirely, no new schema.)*

Checked `git log -- docs/07-architecture/architecture.md` (two
commits: `a01d86c`, `f764810`). **Neither commit has the full detail
either** — even the earliest committed version already only carries
the Slice 2b-era Data Model content (the "zero new tables" / turn-
representation / trust-boundary text), not the base
Repository/File/AnalysisJob/Symbol/EmbeddingChunk schema or Slice 2a's
retrieval-strategy/JSON-schema reasoning. So this was never lost by
the ADR-006 backfill specifically — it dropped out of the file one
round earlier than that, when the Slice 2b round's full-file rewrite
replaced the cumulative Data Model section with a Slice-2b-only delta
instead of restating everything beneath it. Reconstructed here from
this conversation's own transcript, at Sitraka's request, **without
touching `architecture.md`, `PROJECT-STATE.md`, or anything else.**

**No [Updated] annotations in this file** — unlike the `testing.md`
recovery, `PROJECT-STATE.md`'s own next-steps note that Slice 1
(EmbeddingChunk, retrieval) and Slice 2a implementation haven't
started yet ("These require Slice 1 Ask/Chat implementation to exist
first"). So this is pure historical reconstruction — nothing here has
since been superseded by real implementation evidence.

---

## Slice 1 — EmbeddingChunk

```
EmbeddingChunk (new, MVP-B Slice 1)
  - id: uuid (pk)
  - fileId: uuid (fk -> File)
  - repositoryId: uuid (fk -> Repository)
  -- Denormalized for query convenience (semantic search filters by
  -- repository first) — same reasoning as Repository's own
  -- denormalized Overview fields: avoids a join through File on
  -- every retrieval query, which is Ask's hot path.
  - startLine: integer
  - endLine: integer
  - embedding: vector(384)
  -- Dimension matches Xenova/all-MiniLM-L6-v2's output. Not stored
  -- as a duplicated content column — see the note below on why.
  - createdAt: timestamp
  relationships:
    - belongs to File (and transitively Repository)
```

**Real design decision, stated with its tradeoff (not silently
assumed), matching the same discipline as MVP-A's file-content-storage
decision:** chunk TEXT is NOT persisted here, only the vector and the
line range. At generation time, the chunk's actual text is re-sliced
from `files.content[startLine:endLine]` rather than read from a
duplicated copy. Tradeoff: one extra read at query time (negligible —
`File.content` is already fetched by ID elsewhere in the app) versus
avoiding a second copy of file content that could silently drift from
the source if a bug ever let them diverge. Single source of truth won
here, consistent with the same reasoning already applied to
`File.content` itself.

**Chunking strategy, stated explicitly:** chunk boundaries follow
existing `Symbol` boundaries where a file has them (a function or
class's extracted line range becomes one chunk) — reuses structural-
analysis work already done, and keeps each chunk a semantically
coherent unit for both embedding quality and citation readability (a
citation pointing at "one whole function" reads better than one
pointing at an arbitrary 20-line window). Files or regions with no
extracted symbols (config files, top-level code outside any symbol)
fall back to a fixed-size line-window chunk. This reuses `Symbol`
extraction rather than building a second, separate chunking pipeline —
no invented scope, per `principles.md` rule 4.

**Real design decision, stated with its tradeoff — pgvector index and
query pattern:** `EmbeddingChunk.embedding` gets an HNSW index with
cosine distance. Queries must use `cosineDistance` directly (ascending
— smallest distance first), **not** `1 - cosineDistance` descending —
a real, documented bug pattern (see ADR-004) where that inverted form
silently bypasses the index entirely, turning a sub-100ms query into a
many-second full scan at scale. Stated here explicitly so
implementation doesn't reproduce a known footgun.

**Reanalysis semantics** (per `ux-user-flows.md`'s "previous analysis
results are superseded"): on a fully successful `AnalysisJob` (both
`parsingCompletedAt` and `embeddingCompletedAt` set), all existing
`File`/`Symbol`/`EmbeddingChunk` rows for that `Repository` are
deleted and replaced by the new job's output, and `Repository`'s
denormalized fields update to match. A job that fails partway does not
trigger this delete-and-replace — whatever phases did complete remain
as the current data.

---

## Slice 2a — zero new tables

**Real, notable finding: Slice 2a requires zero new tables.** Every
one of the three export formats is computed on-demand from data that
already exists (`Repository`'s denormalized fields, `File`, `Symbol`,
`EmbeddingChunk`) — a direct consequence of the PRD's own "no caching/
versioning of past exports" decision. Nothing here needed inventing;
worth stating plainly rather than silently, since it's genuinely
uncommon for a new feature slice to add zero schema.

**REPOSITORY_CONTEXT.md's retrieval strategy, stated explicitly (a
real design decision, not left to be discovered at implementation
time):** unlike Ask and task-packet, REPOSITORY_CONTEXT.md has no
task-specific query to retrieve against — it needs repo-wide evidence.
Retrieval is scoped to `EmbeddingChunk`s belonging to files marked
`category = 'entrypoint'` plus their most central symbols (functions/
classes with the most cross-references, where determinable from
`Symbol`/import data) — a heuristic, not a hard rule, and one this
project's own precedent (Ask's unfixed `no_evidence` threshold) says
is fine to leave tunable rather than locked here.

**JSON export schema, stated explicitly (drawn only from fields that
already exist — no new backend concepts invented for this):**
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
  },                                -- summary only; full list already
                                     -- available via GET /symbols
  notAnalyzed: [ { path, reason } ] -- File.skipped or embeddingSkipped
}
```

**Real, honest gap flagged, not silently patched:** MVP-A's Overview
mock had a "Modules & packages" section (`app`/`lib`/`components`/
`server` grouping), but that was always a hardcoded UI list, never
backed by a real data-model concept — `testing.md`'s `OVERVIEW-01` row
already notes this. JSON's schema above deliberately does **not**
include a `modules` field, rather than inventing one now just to
match Overview's mock visually. If "modules" becomes a real product
need, that's a new data-model decision for whoever raises it, not
something to retrofit invisibly into this export schema.

**A note worth flagging given the real MVP-A backfill that has since
happened:** the JSON schema above references `File.category` (used
for `entryPoints`/`configFiles`) and `File.embeddingSkipped` (used for
`notAnalyzed`) — but the ADR-006 backfill's *real, implemented* `File`
schema (see `architecture.md`'s current MVP-A base section) only has
`id, repositoryId, path, size, language, skipped, skipReason` — no
`category` column and no `embeddingSkipped` column exist in the actual
database. **This is a real, unresolved divergence between this
original Slice 2a spec and the real implemented schema**, not
something to quietly paper over when Slice 2a implementation
eventually starts — either the real `File` table needs these columns
added, or this JSON schema needs to be re-derived from what actually
exists. Not fixed here; flagged for whoever picks up Slice 2a next.

---

## What to do with this file

Same as `testing-recovery.md`: this is a recovery artifact, not a
canonical spec. If it looks right, the natural next step would be
pasting the relevant parts back into `docs/07-architecture/
architecture.md` in place of its current two placeholder lines — but
per Sitraka's explicit instruction, that hasn't been done here;
`architecture.md` itself is untouched.
