# ADR-003: Data access layer — Drizzle ORM, not Prisma

**Status:** Accepted

**Date:** 2026-07-19

**Context:** The full architecture pass requires a concrete Data
Model, which requires deciding how the app actually talks to
PostgreSQL. This is a real stack-pairing decision (Next.js + ORM),
triggering `roles/software-architect.md`'s required targeted-search
standard before finalizing.

**Targeted search performed:** `Drizzle ORM vs Prisma Next.js 2026
known issues local Postgres` (2026-07-19). Findings:
- Prisma's query engine has a documented history of friction in
  non-standard Node runtimes — its Rust-compiled engine (and, in
  Prisma 7, a WASM query compiler) has needed workarounds or version
  downgrades in edge/serverless environments. Multiple current sources
  confirm this is an ongoing, not fully resolved, class of issue.
- Drizzle has no native/compiled query engine — it's a thin
  TypeScript layer generating SQL directly, with no equivalent
  binary-compatibility surface to break.
- Both are confirmed production-ready and work fine with plain
  PostgreSQL + Next.js for the common case that doesn't hit those
  edges.

**This directly parallels ADR-002's reasoning** (rejecting
`node-tree-sitter`'s native bindings in favor of `web-tree-sitter`'s
WASM-only, no-native-compilation approach) — the theme across this
project's stack choices is preferring tools with no native-binary
compatibility surface, since that surface is exactly where real,
recurring breakage has been found each time it's been checked.

**Decision:** Use **Drizzle ORM** for all PostgreSQL access
(schema definition, migrations via Drizzle Kit, queries).

**Consequences:**
- Schema is defined in TypeScript (`schema.ts`), migrations generated
  via Drizzle Kit — no separate schema DSL to learn (unlike Prisma's
  `.prisma` files).
- Query style is SQL-like/explicit rather than Prisma's higher-level
  abstraction — a reasonable fit for a solo builder who wants direct
  visibility into what's actually querying the database, and for this
  product's search/FTS-heavy queries which benefit from being close
  to real SQL.
- MVP-A's local-only deployment means the edge-portability argument
  for Drizzle doesn't bite yet — but the native-binary-avoidance
  argument (this ADR's actual reasoning) applies regardless of
  deployment target, so this isn't a decision that only makes sense
  today and needs revisiting later.
- `docs/07-architecture/architecture.md`'s Stack table and Data Model
  section reflect this directly.
