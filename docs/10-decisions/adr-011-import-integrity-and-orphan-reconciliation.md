# ADR-011: Import integrity, zero-file guard, and orphan reconciliation

**Status:** Accepted

**Date:** 2026-08-01

**Context:** Upgrade item 7, Group 1 investigated two long-standing
defects — `sindresorhus/boxen` sitting at `ready` with zero files, and
`sindresorhus/got` sitting at `analyzing` with no `AnalysisJob` row.
They were investigated independently rather than assumed to share a
cause, and they do not share one:

- **boxen** was a real pipeline bug. AVA snapshot files
  (`tests/snapshots/**`, `.snap` plus one `.md`) carry NUL bytes behind
  an ASCII header (`AVA Snapshot v3\n`). `detectBinaryBySignature` only
  inspects the first 16 bytes, so they were classified as text and read
  as UTF-8. PostgreSQL `text` cannot store `U+0000` (confirmed: SQLSTATE
  `22021`), and file rows were inserted as one multi-row statement, so a
  single poisoned value failed all 47 rows. The import was not
  transactional, so the already-committed repository and job rows
  survived, and the poller — having no zero-file guard — then marked the
  empty repository `ready`.
- **got** was **not** reachable by any code path. No production code
  deletes `File` or `AnalysisJob` rows except repository cascade, which
  would also have removed the repository row. Its state is the result of
  out-of-band SQL. The exact act was not recoverable from available
  evidence and is recorded as unknown rather than guessed.

**Decision:**

1. **Full-content NUL scan** in `preprocessing.ts` — content containing
   `U+0000` anywhere is reclassified `skipped: true` /
   `skipReason: "binary_file"`, not just content whose first 16 bytes
   look binary. `.snap` added to `BINARY_EXTENSIONS` as belt-and-braces;
   the full-content scan is the durable fix.
2. **Atomic import** — repository, job, and file inserts are wrapped in
   one `db.transaction(...)` in both the GitHub and ZIP branches of
   `POST /api/repositories`. A failing file insert now leaves nothing
   behind instead of an orphaned repo+job.
3. **Zero-file guard in the poller** — a repository with no analyzable
   (`skipped = false`, `content IS NOT NULL`) File rows is marked
   `failed`, not `ready`. `ready` must mean real, queryable content
   exists.
4. **Orphan reconciliation** — a repository in `queued`/`analyzing` with
   no live (`queued`/`running`) job is reconciled to `failed` at the
   start of each poll tick, instead of polling forever in the UI.

**Consequences:**

- **Stated behavior change:** a repository whose files are *all* skipped
  (e.g. an entirely binary repo) now resolves to `failed` rather than
  `ready`-with-nothing. This follows from decision 3 and is deliberate,
  but it is a product-visible semantic change worth confirming.
- Reconciliation takes the same optional scope as `pollOnce`, so tests
  cannot disturb unrelated fixture rows.
- `architecture.md`'s **Reanalysis semantics** section was corrected: it
  claimed `File`/`Symbol`/`EmbeddingChunk` rows are delete-and-replaced
  on a fully successful job. Neither half was true — `File` rows are
  never touched by the poller, and the symbol/chunk delete is
  unconditional and happens before the work. Real File-row
  delete-and-replace remains deliberately unimplemented; that is a
  separate future decision, not silently added here.
- ADR-006's **AnalysisJob lookup ordering** gap is marked **resolved** —
  verified by direct source check that all five job-lookup sites order
  by `desc(createdAt)`. No code change was needed; the entry records
  verification only.
- This is the **third** instance of "the docs describe production
  architecture that was never actually built" (after item 3's
  `BATCH_SIZE` and item 5's generation abstraction). Flagged for the
  phase-close retrospective as a pattern, not three coincidences.
- Verified live against real data, not only in tests: boxen re-imported
  through the fixed code into `trailhead_dev` produced 47 files (13
  skipped, including all 11 `.snap` files and the one NUL-carrying
  `.md`), 65 symbols, 130 embedding chunks, and a real `ready` state.
