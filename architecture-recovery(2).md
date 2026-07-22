# Recovered content — architecture.md's "Symbol" table definition

**Why this file exists:** unlike `EmbeddingChunk`/Slice 2a and the
Stack table (both recovered previously), `architecture.md`'s current
Data Model section **never explicitly restates a `Symbol` table at
all** — it only appears in passing prose, e.g. Slice 2a's placeholder
saying "Export reuses Repository/File/Symbol/EmbeddingChunk entirely."
Checked both git commits that ever touched this file (`a01d86c`,
`f764810`) with `grep -in "symbol"` — same result in both: `Symbol` is
mentioned only as a word inside that one sentence, never as an actual
schema block. **A real `Symbol` table definition did exist, but only
in this conversation's own transcript, in two successive versions —
reconstructed below, in order.** Per Sitraka's instruction, nothing
has been changed in `architecture.md` or anywhere else — this is a
standalone reconstruction only.

**No [Updated] annotations needed this time** — `PROJECT-STATE.md`'s
own "Next valid moves" currently names **"Step C — Symbol extraction
(tree-sitter/web-tree-sitter, per ADR-002)"** as work that hasn't
started yet. So unlike the `File`/`Repository`/`AnalysisJob` recovery
(where real implementation had already diverged from the original
spec), nothing here has been superseded by real code — this is pure
historical reconstruction, and it's also the spec whoever picks up
Step C should actually build against.

---

## Version 1 — original (MVP-A full architecture pass)

```
Symbol
  - id: uuid (pk)
  - fileId: uuid (fk -> File)
  - kind: enum('function','class','interface')
  - name: text
  - startLine: integer
  - endLine: integer
  relationships:
    - belongs to File (and transitively Repository)
```

This was the version written during MVP-A's own full architecture
pass — one row per extracted function/class/interface, tied to the
`File` it lives in (and transitively to `Repository`), with the same
`startLine`/`endLine` line-range convention used everywhere else in
this schema (`File.skipReason`, `EmbeddingChunk`, citations, etc.).

## Version 2 — extended (MVP-B Slice 1 architecture pass, `kind` enum widened)

```
Symbol
  - id: uuid (pk)
  - fileId: uuid (fk -> File)
  - kind: enum('function','class','interface','import','export')
                                       -- extended: import/export
                                       -- added so extracted imports/exports
                                       -- (already in scope per the PRD) have
                                       -- a real display surface via the
                                       -- Symbols screen, rather than being
                                       -- extracted-but-unused
  - name: text
  - startLine: integer
  - endLine: integer
  relationships:
    - belongs to File (and transitively Repository)
```

**Why this changed:** the Symbols screen's `docs/08-features/
symbols.md` feature spec (and its component-spec/screen-review
history) established that structural analysis extracts
imports/exports too, per the PRD's scope — but the original `kind`
enum (function/class/interface only) gave them nowhere to live. Widened
`kind` to include `'import'` and `'export'` so the same table backs
Symbols' Import/Export filter chips directly, rather than inventing a
second, parallel table for the same underlying concept. **This is the
version that superseded Version 1** — the last known-correct spec, and
still the one nothing has diverged from since (Step C hasn't started).

**Direct consumer of this table, worth carrying forward if this gets
pasted back in:** the `EmbeddingChunk` recovery (see
`architecture-recovery.md`) states its chunking strategy follows
`Symbol` boundaries where a file has them — a function/class's
extracted `startLine`/`endLine` becomes one embedding chunk — and
Slice 2a's `REPOSITORY_CONTEXT.md` retrieval heuristic scopes itself to
entry-point files' "most central symbols... where determinable from
`Symbol`/import data." Both of those already assume this table's shape
exists exactly as reconstructed above — this recovery file is what
makes that assumption checkable again, not just implied.

---

## What to do with this file

Same as the prior recoveries: a recovery artifact, not a canonical
spec. If it looks right, the natural next step would be adding a real
`### Symbol` subsection to `docs/07-architecture/architecture.md`'s
Data Model (there currently isn't one at all, not even a placeholder)
using Version 2 above — since that's the one the rest of the spec
(EmbeddingChunk's chunking strategy, Slice 2a's retrieval heuristic,
the Symbols feature) already depends on. Per instruction, nothing has
been touched — `architecture.md`, `PROJECT-STATE.md`, `KNOWN-GOOD.md`,
and every ADR file remain exactly as they were.
