# Known-Good State & Project Hard Rules — Trailhead

Referenced from `AGENTS.md`: required context on every implementation
task. Two sections, both append-only in spirit — entries get
corrected, not silently deleted.

## Known-good state

- [2026-07-21] PostgreSQL 17 installed via
  `winget install --id PostgreSQL.PostgreSQL.17 --exact` on Windows —
  silent/unattended mode sets NO superuser password by default. Must
  be set manually post-install: temporarily set
  `host all all 127.0.0.1/32` and `host all all ::1/128` to `trust` in
  `C:\Program Files\PostgreSQL\17\data\pg_hba.conf`, restart the
  `postgresql-x64-17` service, connect with no password,
  `ALTER USER postgres WITH PASSWORD '...'`, then revert both lines to
  `scram-sha-256` and restart again.
- [2026-07-21] When editing that file via `notepad` from PowerShell,
  must use `Start-Process notepad <path> -Wait` — bare
  `notepad <path>` does not block the shell, so a `Restart-Service`
  issued right after reads the OLD file, not the edit. Caused a real
  failed connection loop this session before being caught.
- [2026-07-21] Local PostgreSQL 17 service name:
  `postgresql-x64-17` (confirm via `Get-Service -Name "*postgres*"` if
  this differs on a future machine/install).
- [2026-07-21] Local databases created: `trailhead_dev`,
  `trailhead_test`.
- [2026-07-21] adm-zip: `entry.header.attr` holds the ZIP external
  file-attributes field; compression method `99` means AES encryption
  (`AES_ENCRYPT`), NOT a symlink marker — do not reuse that check
  pattern for anything else in this codebase.
- [2026-07-21] adm-zip's `addFile()` normalizes/strips path-traversal
  segments in entry names and always sets file type `S_IFREG` — it
  cannot natively construct raw traversal or symlink test fixtures.
  Override `entry.entryName` / `entry.attr` directly after `addFile()`
  to produce real test bytes (see `tests/preprocessing.test.ts` and
  `tests/repositories.route.test.ts` for the working pattern).
- [2026-07-21] GitHub API: authenticated (GITHUB_TOKEN) rate limit
  confirmed at 5,000 req/hour via live x-ratelimit-limit header;
  unauthenticated fallback remains 60/hour when the token is unset.
- [2026-07-21] GitHub API returns identical 404 for nonexistent repos
  AND private repos the token has no access to — intentional on
  GitHub's side, confirmed via their own docs, not fixable from our
  side. Only repos the token DOES have access to can be positively
  identified as private (via a real 200 + `private: true`).
- [2026-07-21] GITHUB_TOKEN in use is a fine-grained PAT scoped to
  Contents:Read-only + Metadata:Read-only — no repository-write scope.
  Cannot be used to programmatically create test repos.
- [2026-07-21] Private-repo route test depends on the real personal
  repo JR-Sitraka/Test remaining private and accessible to the token —
  a real external dependency, not a synthetic fixture. Fragile if that
  repo is ever renamed, deleted, or made public. Consider replacing
  with a dedicated throwaway fixture repo when convenient.
- [2026-07-21] AdmZip throws a plain Error (not a distinct error class)
  for malformed archives, with message text like "ADM-ZIP: Invalid or
  unsupported zip format. No END header found" — route.ts currently
  catches this via string-matching "ADM-ZIP" in the message. This is
  fragile: only tested against one specific corruption case (random
  bytes / missing END header). Other malformed-ZIP scenarios may throw
  differently-worded messages that wouldn't match and would still
  produce a 500. Consider hardening to catch any non-SecurityError
  error during parsing as a 400, rather than string-matching.
- [2026-07-21] GET /api/repositories and GET /api/repositories/:id
  both attach a repository's AnalysisJob via an unordered lookup (no
  ORDER BY createdAt). Currently harmless — no code path creates more
  than one AnalysisJob per repository yet — but will silently attach
  an arbitrary job, not the latest, once Reanalyze exists. Must be
  fixed as part of implementing Reanalyze, not assumed already correct
  at that point. Tracked in ADR-006.
- [2026-07-22] pgvector 0.8.5 compiled natively for PostgreSQL 17 on
  Windows. MUST use the "x64 Native Tools Command Prompt for VS 2022"
  — the generic "Developer Command Prompt" produces a real build
  failure (`tupmacs.h` case-value C2196 errors), not just a warning.
  Build steps: set PGROOT to the PG17 install dir, clone pgvector at a
  tagged release (v0.8.5 used here), `nmake /F Makefile.win`, `nmake /F
  Makefile.win install` (may need an elevated/Administrator instance
  of that same Native Tools prompt if install fails with Access is
  denied). Extension still needs `CREATE EXTENSION vector;` run inside
  each target database (trailhead_dev, trailhead_test) — compiling and
  installing the library files is necessary but not sufficient.
- [2026-07-22] pgvector HNSW cosine-distance gotcha empirically
  confirmed, not just documented: `ORDER BY embedding <=> vec ASC`
  produces a real Index Scan; `ORDER BY 1 - (embedding <=> vec) DESC`
  falls back to a Seq Scan even with `enable_seqscan = OFF` forced
  (planner cost `10000000000` — a hard refusal, not a preference).
  Verification technique for small test datasets: force
  `enable_seqscan = OFF` before EXPLAIN, since Postgres's planner
  otherwise reasonably prefers a seq scan on tiny tables regardless of
  index correctness — without that control, a correct-pattern test
  could pass for the wrong reason.
- [2026-07-22] drizzle-orm v0.36.0's pg-core has no vector-index
  builder (no `vectorIndex`/HNSW helper) — index creation requires raw
  SQL alongside the Drizzle-managed schema push, not a pure-Drizzle
  path.
- [2026-07-22] CONFIRMED FIXED (was pending): Next.js 14's
  instrumentation.ts hook requires
  `experimental.instrumentationHook: true` in next.config.js. Missing
  originally — poller never started at real boot despite a passing
  unit test (which bypassed the real boot path via direct pollOnce()
  calls). Fixed and verified via real dev server output: startup log
  appeared before any request, and a real AnalysisJob row transitioned
  queued→running with updated_at matching the poller's own tick log
  timestamp. Lesson: "runs automatically at startup" claims need a
  real running server as evidence, not just a direct function-call
  test — this project has now hit this exact gap once.
- [2026-07-22] `tests/poller.test.ts` mutates all other queued
  `AnalysisJob` rows in `trailhead_test` to `'failed'` as a side effect
  of achieving test isolation — a real test-hygiene smell, not yet
  fixed. Could cause a confusing, misattributed failure in an
  unrelated test in a future round.
- [2026-07-22] `drizzle-kit push` drops the manually-created HNSW
  index on `embedding_chunks.embedding` on every run — drizzle-kit
  doesn't track manually-created indexes. [status pending fix this
  round]
- [2026-07-22] GitHub zipball downloads (codeload.github.com) don't
  carry the GITHUB_TOKEN Authorization header — cross-origin redirect
  from api.github.com strips it per standard Fetch redirect behavior.
  Not a functional problem currently (zipball is only ever fetched for
  already-confirmed-non-private repos), but codeload.github.com has
  its own separate, unauthenticated rate limit distinct from the
  5,000/hour on api.github.com — worth knowing if repeated-import
  testing ever hits an unexplained failure.
- [2026-07-22] REAL, CONFIRMED BUG (found + fixed this session):
  src/server/db/index.ts's connectionString selection had no context
  check — `TEST_DATABASE_URL || DATABASE_URL` unconditionally
  preferred the test DB, meaning the REAL dev server (npm run dev),
  not just the test suite, was connecting to trailhead_test the
  entire time both were set in .env. Fixed via
  `const isTestEnv = !!process.env.VITEST` (Vitest's own documented
  env var, confirmed via their docs) — only vitest gets
  TEST_DATABASE_URL priority; the real dev server now correctly uses
  DATABASE_URL. Verified both directions with real running processes,
  not just logic review: a real dev server run inserted a row
  confirmed present in trailhead_dev and absent from trailhead_test;
  a real test suite run (32/32) confirmed test routing unaffected.
  20 contaminated rows (manual dev-server imports that had silently
  landed in trailhead_test during the bug window, identified by
  timestamp falling outside any known automated test-run window) were
  deleted with cascade verified clean. Lesson: an unconditional `||`
  fallback between environment-specific config values is a real risk
  pattern — this is the second time this session a "should differ by
  context" assumption turned out to have no actual context check
  behind it (see also: instrumentationHook).
- [2026-07-22] web-tree-sitter's official docs are browser-first and
  suggest /public + locateFile setup — misleading for this project's
  actual usage (100% server-side, route handlers/poller, never
  browser). In Node.js, Language.load() reads WASM directly from the
  filesystem via fs/promises — no /public copy, no locateFile, no
  Next.js config needed. Confirmed via reading web-tree-sitter.js's
  own source (Language.load), not docs. Third instance this session of
  "docs/intuition don't match this project's actual runtime context"
  (see also: instrumentationHook, DB routing) — worth treating as a
  standing pattern, not three unrelated coincidences.
- [2026-07-22] tree-sitter-typescript grammar node types confirmed via
  real parsing, not assumed: function_declaration, class_declaration,
  abstract_class_declaration, interface_declaration for top-level
  definitions; lexical_declaration + arrow_function/function_expression
  for top-level fn assignments; method_definition and
  abstract_method_signature for class bodies. export_statement carries
  `declaration` for named/default-declaration exports but NOT for
  `export default <expr>` (function_expression, class, identifier,
  literals — no declaration field). `export { foo }` uses `export_clause`
  (no declaration field). `import_statement` carries `import_clause`
  only when bindings exist; side-effect-only imports (`import 'x'`) and
  empty-brace imports (`import {} from 'x'`) have no import_clause.
  `childForFieldName("name")` works on declarations/methods; namespace_import
  requires manual child iteration. `anonymous_default_export_class`
  produces a bare `class` node (not `class_declaration`) after the
  `default` keyword in export_statement. `internal_module` (not `module`)
  is the top-level node for `namespace Foo {}`.
- [2026-07-22] Grammar file selection and JS/JSX handling decision:
  `.ts`, `.mts`, `.cts` → tree-sitter-typescript (TS grammar);
  `.tsx` → tree-sitter-tsx (same package, separate wasm);
  `.js`, `.mjs`, `.cjs` → tree-sitter-javascript (already present in
  node_modules; confirmed correct because TS grammar would mis-parse
  plain JS with type-only syntax as errors);
  `.jsx` → tree-sitter-tsx (tree-sitter-javascript 0.x lacks JSX
  grammar support; tsx grammar is the only available JSX-capable
  option). Tradeoff rejected: using TS grammar as a JS-superset
  approximation for plain .js files — too many false syntax errors in
  practice. Keeping the extra dependency (tree-sitter-javascript) is
  the correct call.
- [2026-07-22] web-tree-sitter `Parser.parse()` does NOT throw on
  syntactically invalid input — it returns a tree with
  `tree.rootNode.hasError === true` and ERROR nodes in the tree.
  Parse failures in the poller are handled by checking `hasError`,
  logging a warning, and returning zero symbols for that file. This
  satisfies the "catch-and-continue" requirement without relying on
  try/catch around parse().

## Project hard rules

(none yet — entries above are environment facts, not incident-derived
hard rules; nothing has risen to that bar yet)
