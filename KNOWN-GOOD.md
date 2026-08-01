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
- [2026-07-22] next.config.js: serverComponentsExternalPackages alone
  does NOT externalize Node built-ins for modules reached via
  src/server/poller.ts -> src/instrumentation.ts (web-tree-sitter,
  postgres) — the instrumentation.ts bundle path doesn't inherit
  App-Router server-component externalization the way normal route
  handlers do. A webpack.externals override in next.config.js is
  additionally required. Confirmed via real next build error traces
  before/after.
- [2026-07-22] The original next.config.js had "pg" in
  serverComponentsExternalPackages — dead config, package.json has no
  pg dependency, nothing imports it. Only "postgres" is the real
  driver in use. Corrected.
- [2026-07-22] @huggingface/transformers produced zero next build
  errors on its own (not yet wired into any real code path beyond the
  D1 proof test) — do not add it to externals speculatively; if D2's
  real wiring introduces a build error, diagnose from the real error
  output at that point, same discipline as this fix.
- [2026-07-22] tailwindcss version mismatch: postcss.config.mjs and
  globals.css were already Tailwind v4-correct, but package.json's
  top-level tailwindcss was pinned to ^3.4.0 while @tailwindcss/postcss
  (v4) carried its own nested v4 dependency — PostCSS resolved the
  stale top-level v3 package for `@import "tailwindcss"`, masked
  behind the earlier Node-builtins build failure until that was fixed.
  Fixed by bumping top-level tailwindcss to ^4.0.0 to match. next
  build is now fully green (confirmed: static generation completes,
  zero errors). Lesson: a Tailwind v4 PostCSS config alongside a
  stale v3 top-level install will reproduce this exact failure mode.
- [2026-07-22] @huggingface/transformers + native deps
  (onnxruntime-node, sharp) in next.config.js's webpack.externals: a
  bare string external ("@huggingface/transformers") produces invalid
  unquoted CJS during webpack 5's module-concatenation/scope-hoisting
  pass ("Unexpected character '@'"). Fix: use a function-form external
  returning `commonjs ${request}`, plus
  `optimization.concatenateModules = false` on the server build to
  bypass the scope-hoisting path that triggers it. Different failure
  class than the earlier pure-WASM/JS externals fix (web-tree-sitter,
  postgres) — native addons behave differently under webpack.
- [2026-07-22] Chunk-boundary algorithm (embeddingChunker.ts): symbol
  ranges (function/class/interface only — import/export excluded as
  too thin to embed usefully) become chunks directly; any gap
  (before/between/after symbols, or the entire file if zero
  qualifying symbols) fills with a 30-line fixed window — tunable,
  documented as such, not precisely justified. Applies to ALL
  non-skipped files with content, not just TS/JS — non-TS/JS files go
  entirely through fixed-window chunking.
- [2026-07-22] Batched vs. sequential transformers.js inference
  (real benchmark, 30 chunks): batch ~386ms vs. sequential ~488ms,
  numerically identical to 1e-6. embeddings.ts uses BATCH_SIZE=32.
- [2026-07-22] npx tsc --noEmit run before any next build/dev in a
  session produces spurious TS6053 "file not found" errors for
  .next/types/**/*.ts — these are Next.js's auto-generated route-type
  stub files (tsconfig.json includes them by pattern), not real source
  errors. Confirmed benign: next build's own internal type-check
  passes clean immediately after. Always run build/dev at least once
  before trusting a standalone tsc --noEmit run, especially after
  adding a new API route.
- [2026-07-22] Gemini 3.5 Flash's free tier is either far more
  restricted than documented (real quota: 20 req/day, not 1,500) or
  actively bugged as of this date — corroborated by a live Google AI
  Developer Forum thread (2026-06-19) reporting the identical symptom.
  Reverted generation model to gemini-2.5-flash. Lesson: verify
  third-party free-tier API claims against a real call, same standard
  already applied to this project's own environment assumptions.
- [2026-07-22] CORRECTED: this project's actual Google AI Studio
  project shows a real RPD ceiling of 20 for BOTH gemini-2.5-flash AND
  gemini-3.5-flash (confirmed via the live Rate Limits dashboard, not
  just error payloads) — not the 1,500 RPD documented broadly online.
  This is NOT a 3.5-Flash-specific issue; the earlier revert to 2.5
  Flash did not fix the underlying constraint. Likely cause: Google
  often applies a lower "cold start" quota to unverified/no-billing
  projects than the publicly documented ceiling. A "Set up billing"
  banner is visible directly above the rate-limit table in AI Studio
  — investigate whether enabling billing (without necessarily
  incurring cost, if usage stays within free-tier request pricing)
  raises the real quota. Until resolved, treat 20 req/day as this
  project's actual operating ceiling for real-API testing, not 1,500 —
  budget test rounds accordingly.
- [2026-07-23] GEMINI_API_KEY in .env is now invalid (API_KEY_INVALID,
  confirmed via real error, not quota-related) — a change from earlier
  the same session when it worked. tests/gemini-generation.test.ts is
  a historical proof-of-environment artifact only; Ask/Chat now runs
  on Groq. Not investigated further — doesn't block anything. If ever
  revisited, check whether the key was inadvertently regenerated in
  AI Studio during the earlier rate-limit/billing investigation.
- [2026-07-23] transformers.js/onnxruntime-node's CPU backend is NOT
  bit-exact deterministic across SEPARATE invocations, even though a
  single process/test embedding the same text twice showed
  MAX DIFF: 0 (see the D1 proof, earlier this session). Real
  confirmed case: retrieveChunks's ORDER BY cosine_distance ASC, id
  ASC tiebreaker is correctly deterministic given identical inputs,
  but the QUERY embedding itself varies by tiny floating-point amounts
  between real request calls (likely ONNX Runtime's multi-threaded
  execution changing summation order between runs) — enough to flip
  which of two near-identically-distant chunks ranks first, in an
  artificially-tied test fixture. Not expected to affect real
  retrieval quality (genuine chunks have meaningfully different
  distances, not engineered near-ties) but worth knowing: "the same
  question asked twice" is not guaranteed to retrieve in bit-identical
  order for genuinely close candidates.
- [2026-07-23] Tailwind v4's @theme block uses kebab-case custom
  property names (--color-text-muted), which become kebab-case utility
  classes (text-muted, bg-text-muted) — NOT the camelCase used in the
  original Magic Patterns mocks' v3-style JS configs (textMuted). This
  is correct and intentional, not a naming inconsistency to "fix" —
  CSS custom properties don't support camelCase the way JS object keys
  do. Confirmed consistent end-to-end in WorkspaceHeader.tsx.
- [2026-07-23] As of this entry, zero repositories in trailhead_dev
  have ever reached status='ready' — every 'ready' repository that
  exists anywhere was created via vitest test runs against
  trailhead_test. The full pipeline has never been exercised through
  a real npm run dev session end-to-end. WorkspaceHeader's success/
  analyzing/failed pill colors and real-SHA rendering are unverified
  against real dev-server data as a result.
- [2026-07-23] CONFIRMED (was open gap): a real repository
  (sindresorhus/got, id 0aa69121-92ad-4750-af26-97ccbd3dbf2a) has now
  completed the full pipeline through a real npm run dev session —
  first genuine end-to-end proof outside of vitest. WorkspaceHeader's
  ready/success pill color and real commitSha display both confirmed
  correct via real browser screenshots. One real parse error was hit
  and correctly isolated (source/index.ts skipped, job completed
  anyway) — the first real-world (non-fixture) confirmation that
  Step C's per-file error isolation works as designed.
- [2026-07-24] tests/reanalysis.test.ts's fresh-import analyzing-
  checkpoint test relies on real WASM (web-tree-sitter) + ONNX
  (transformers.js) cold-start latency (900ms+ per real 10-run
  confirmation) comfortably exceeding its 50ms poll window — not a
  deterministic guarantee. The underlying correctness IS guaranteed
  architecturally (poller.ts sets status='analyzing' synchronously
  before any processing begins, confirmed via source read) — only the
  TEST's ability to observe the window is timing-dependent. One rare
  failure (out of many runs across this session) is unreproduced after
  10/10 clean reruns; plausible one-off system I/O caching effect, not
  a logic bug. Future hardening candidate (not urgent): redesign this
  specific test with either a heavier real fixture or a post-hoc
  audit-trail assertion instead of a live poll-timing check — do NOT
  fix by simply raising the timeout, that would mask rather than solve
  the real observability gap.
- [2026-07-24] Dashboard's polling has two independent mechanisms:
  fast poll (5s, only runs while local state has an active repo) and
  baseline poll (30s, runs unconditionally on mount) — the fast poll
  alone can't discover repositories created outside the Dashboard's
  own Add-repository flow (another tab, direct API calls); the
  baseline poll exists specifically to catch those. Both real-verified
  via dev-server request logs, not headless browser automation (which
  hung for 85+ minutes on an earlier attempt — avoid CDP/headless
  Chrome for this kind of check going forward, npm run dev's own
  request logging is sufficient and far more reliable for this
  project's verification needs).
- [2026-07-24] lucide-react 1.0 removed all brand icons (GitHub,
  Facebook, Figma, Slack, etc.) for legal/licensing reasons — GithubIcon
  is not available; use an inline SVG instead. Real, dated change
  (June 2026), not a version mix-up.
- [2026-07-24] Fixed real bug in preprocessing.ts's binary-content
  detection: the on-disk header-read path always passed a full
  Buffer.alloc(16) (zero-initialized) to detectBinaryBySignature(),
  even when fs.readSync returned fewer than 16 bytes for short files —
  the null-byte tail pushed short, genuinely-text files (e.g. an
  11-byte "hello world") over the 30% null-byte threshold, falsely
  flagging them binary_file. Fixed by slicing to the real bytesRead
  count before the check. Real DB check confirmed zero currently-
  imported repositories were affected (bug only manifested on files
  shorter than 16 bytes, rare in practice). Found via Overview's real
  verification round using a test fixture with unrealistically short
  file content — a good reminder that "realistic" test fixtures
  (not just minimal/empty ones) sometimes matter for catching real
  edge-case bugs, not just for readability.
- [2026-07-25] Explorer's earlier verification round used manually
  seeded test data (scripts/seed-explorer-test.ts, since deleted) that
  looked like real pipeline output but wasn't — a hardcoded
  skipReason: "binary_file" on .gitignore, never actually produced by
  preprocessing.ts. Re-verified with a genuine fresh import
  (sindresorhus/got, post binary-detection-fix): real pipeline
  correctly leaves .gitignore (54 bytes, short text) unskipped, and
  correctly skips genuinely binary files (.ai/.png/.sketch). .svg is
  also skipped — via the file-extension list, not content-sniffing,
  a separate and likely intentional behavior (SVGs are commonly
  treated as opaque/binary despite being XML) — not yet explicitly
  confirmed as a deliberate product decision, just noting it's a
  different code path than the bug that was just fixed.
- [2026-07-25] Symbols' zero-symbols empty state genuinely verified
  end-to-end for the first time (openai/DALL-E, a real 5-file Python
  repo, real import → real poller completion → real GET returning
  [] → real "No symbols found" render). A prior attempt this same
  round used a manually-seeded DB row instead of a real import — that
  only proved the frontend renders an empty array correctly, not that
  the real pipeline genuinely produces zero symbols for a real
  non-TS/JS repository. Worth remembering: a "seeded" or "manually
  inserted" test repository proves frontend rendering only, never
  real pipeline behavior — same caution as Explorer's earlier
  seed-explorer-test.ts finding.
- [2026-07-25] PostgreSQL's 'english' tsvector config does NOT split
  camelCase identifiers — "getPayments" tokenizes as one indivisible
  lexeme, so an FTS query for "payments" alone (stemmed to
  'payment':*) returns zero matches. Confirmed via real Postgres
  query, not assumed from architecture.md's stated reasoning. This is
  why Search's exact-substring (ILIKE) pass is load-bearing, not
  redundant with FTS — most real code-search queries (function/
  variable names) will only match via the exact pass, not FTS.
- [2026-07-25] Frontend component testing infrastructure added
  (@testing-library/react, @testing-library/user-event, happy-dom;
  vitest.config.ts extended to include tests/**/*.test.tsx). First
  real usage: tests/search-page.test.tsx, including a genuine race-
  condition proof (stale debounced response resolving after a newer
  one, confirming only the latest result renders). Available for any
  future screen needing real component-level test coverage, not just
  API/dev-server verification.
- [2026-07-25] Chat's inline citation markers: 5/5 real Groq calls
  produced correctly-placed bracket labels in prose. Small sample size
  — treat as a good early signal, not a guaranteed 100% rate long-term.
  The parseInlineCitations() function already degrades gracefully
  (unmatched/malformed brackets render as plain text, not an error) —
  this is the actual safety net, not the prompt's reliability alone.
  Worth revisiting if real usage shows the model skipping markers more
  than occasionally.
- [2026-07-25] REAL, CONFIRMED LIMITATION (affects BOTH Chat and
  Export/context equally): label-range citation validation proves that
  every bracket label in the model's prose maps to a real, retrieved
  EmbeddingChunk — but it does NOT prove that the prose surrounding
  each label is actually grounded in that chunk's content. Confirmed
  via live export/context call against sindresorhus/escape-string-regexp:
  Groq returned a valid `answered` response with in-range citations
  [1] and [3], but the prose contained the phrase "session store"
  which appears nowhere in the retrieved evidence (index.js and
  test.js). Root cause: the prompt contained a hardcoded illustrative
  example `e.g. 'the session store[1]'` (and chat.ts had `e.g.
  'validates tokens against the session store[1]'`) — the model
  echoed example content into unrelated output. Fixed by removing the
  concrete-content examples from both prompts (replaced with a bare
  format instruction, no content-specific example). After the fix,
  three consecutive live calls against the same repo produced
  identical, fully-grounded output with no ungrounded claims.
  Standing product limitation: even with prompt hygiene, the model
  could still inject plausible-sounding but ungrounded prose between
  valid citation labels. Label validation is a mechanical check, not
  a semantic one. This is inherent to the current architecture and
  should be documented honestly anywhere citation behavior is
  described — it is not a bug to be fixed, but a known constraint of
  the approach.
- [2026-07-25] Reanalyze's delete-and-replace logic wiped
  sindresorhus/got's 2,479 embeddings mid-session when it was
  reanalyzed for an unrelated verification — this is correct, expected
  behavior (not a bug), but it's a real illustration that this
  project's dev-database fixture data is NOT stable across rounds.
  A repository confirmed to have real data in one round can lose it
  later if any reanalyze/delete-and-replace-triggering action touches
  it, even indirectly. Don't assume a repository's data still matches
  an earlier round's description — check directly before relying on
  it for verification. openai/DALL-E (7cf3a196, 22 chunks, 11 real
  Python files) is a real, currently-populated fixture as of this
  entry.
- [2026-07-25] Fixed real citation-mislabeling bug affecting BOTH
  Chat and Export: backend citation responses were flattened arrays
  with no label field, and frontends rebuilt the label→citation map
  by ARRAY POSITION (i+1) rather than the model's actual original
  bracket label. When the model cited non-sequential labels (e.g.
  [1] and [3], skipping [2] — a real, observed live scenario), the
  positional remapping silently broke: [3] in the prose would fail to
  resolve (rendering as plain text) or resolve to the wrong citation.
  Fixed by having both chat.ts and export.ts emit an explicit `label`
  field on each citation, and both frontends (AnswerCard.tsx,
  ExportClient.tsx) build the map from that real field instead of
  array position. Found via careful post-hoc review of a real live
  response, not caught by any automated test until this round added
  one. Worth remembering: any array returned to a frontend that gets
  remapped by position, when the array's own membership/order isn't
  guaranteed sequential, is a latent bug class — check for this
  pattern elsewhere if new citation-like features get built.
- [2026-07-25] A hung/interrupted `next build` (e.g. from Claude Code's
  background-task execution taking 46+ minutes) can leave node
  processes running that hold locks on .next/'s build cache — any
  subsequent build attempt then hangs indefinitely with ZERO output,
  even before "Creating an optimized production build..." appears.
  Fix: kill all node processes (Get-Process node | Stop-Process
  -Force) AND delete .next/ before retrying — killing processes alone
  wasn't enough, the stale cache also needed clearing. If a future
  build hangs with no output at all (not just slow), check for stray
  node processes first before assuming a real code problem.
- [2026-07-25] chat.test.ts's citation-label-preservation test was
  flaky (1/5 isolated runs) — not a production bug. retrieveChunks's
  `ORDER BY cosine_distance ASC, id ASC` IS genuinely deterministic
  given fixed row IDs (already proven separately, 10/10). The flake
  was the TEST fixture using identical embeddings for multiple chunks
  (to force a tie), combined with fresh random UUIDs generated on
  every test run — meaning WHICH chunk won the tie varied by run even
  though the tiebreak rule itself never changed. Fixed by giving the
  test's extra file a genuinely distinct embedding instead of relying
  on tie-order. Lesson: any test deliberately constructing identical-
  embedding ties should use fixed/seeded IDs if the test's assertions
  depend on a specific row winning, not just rely on the ordering rule
  being deterministic in the abstract.
- [2026-07-25] CONFIRMED, REAL LIMITATION: Xenova/all-MiniLM-L6-v2
  (ADR-004's embedding model choice) has no code-semantic
  understanding — real controlled test shows it matches surface
  tokens over meaning (query vs literal filename string "./index.js":
  0.26 distance; query vs the actual file's real code content: 0.90).
  This causes real, observed retrieval failures on trivially-
  answerable questions (sindresorhus/escape-string-regexp: "what's
  inside index.js" ranks the real index.js content #10-11, behind
  package.json which merely references the filename). Threshold
  tuning (0.7→0.75, applied same date) is a real but partial
  mitigation — it does not fix the underlying ranking problem. A real
  fix requires a code-aware embedding model, which requires its own
  research pass (must still fit zero-spend/local/transformers.js
  constraints) — deliberately deferred to a dedicated future session,
  not attempted here. This reopens part of ADR-004 (embedding model),
same as tonight's Gemini→Groq swap reopened its generation-model
half.

- [2026-07-28] `src/app/repositories/[id]/overview/page.tsx` (and
  `scripts/check-got.ts`) carry a pre-existing `skip-worktree` (`H`)
  flag — confirmed via `git ls-files -v`. Normal edits/`git add`
  silently do NOT track changes to a skip-worktree file; this is
  what nearly cost item 4's fix (worked around via `git add -f`,
  which stages the change but does NOT clear the flag). **Before
  editing either file again, run
  `git update-index --no-skip-worktree <path>` first** to clear the
  flag properly — don't rely on `-f` a second time. Root cause of why
  the flag was set in the first place is unknown/not investigated.
- [2026-07-30] `npm run db:push` (drizzle-kit push) hangs indefinitely
  in this harness — it blocks on an interactive confirmation prompt
  with no stdin available, producing zero output. **Do not wait it
  out; kill the process tree.** Workaround used successfully: apply
  additive DDL directly (raw SQL) instead of the CLI push, which also
  avoids drizzle-kit's documented HNSW-index-drop risk — index
  verified intact on both trailhead_dev and trailhead_test after the
  workaround. Root cause (why the prompt appears now) not
  investigated.
- [2026-07-31] **RETAINED QA FIXTURES in `trailhead_dev` — DO NOT
  DELETE. These three repository rows look like junk and are not.**
  They are intentional, load-bearing fixtures for the Playwright and
  QA-walkthrough acceptance suites, which run against a real dev
  server and therefore against `trailhead_dev` (not `trailhead_test`).
  Deleting any of them silently breaks acceptance tests that only run
  under a real browser runner, so the breakage would not show up in
  `npx vitest run`.
  - `1daf6a6b-c233-4e6f-85d1-b283c3f9827e` — `sindresorhus/got`.
    The non-ready gate fixture: `NON_READY_REPO` in
    `tests/chat-playwright.test.ts` (CHAT-01) and
    `tests/export-playwright.test.ts` (EXPORT-01). The contract is
    "Chat/Export must reject any repository that is not ready" — ANY
    non-ready status satisfies it. Formerly named `ANALYZING_REPO`;
    renamed 2026-07-31 because orphan reconciliation now moves this
    row to `failed`, and the old name wrongly implied the test needed
    it to be actively analyzing. It has zero files/symbols/chunks and
    no job row — that emptiness IS the fixture, not damage to repair.
  - `c08b0a4d-b85e-4359-a991-efb79f77c66f` — `sindresorhus/got`,
    hand-seeded (note the deliberately fake `commit_sha` `abc1234`
    and its single `source/index.ts` file with 6 real symbols).
    Backs `SYMBOLS_REPO`, `SEARCH_REPO`, AND `EXPLORER_REPO` — all
    three constants in `tests/qa-walkthrough.test.ts` point at this
    one row.
  - `8ab4ce3e-d7a9-4c15-9bfe-2405568db705` —
    `python-only-empty-state-verification`. `FALLBACK_REPO` in
    `tests/export-playwright.test.ts`.

  **Why this entry exists:** the item 7 Group 1 cleanup investigation
  (2026-08-01) examined these rows, read their emptiness and fake SHA
  as leftover pollution, and explicitly proposed deleting all three as
  fixture-set cleanup. That recommendation was wrong. The task's
  mandatory pre-deletion reference check — grep the codebase and test
  suite for the exact ID before deleting anything — caught all three
  and stopped the deletions; they were then permanently cancelled.
  Lesson, and the reason this is recorded rather than just fixed: a
  `trailhead_dev` row being empty, synthetic, or odd-looking is NOT
  evidence that it is unused. Fixtures for the browser-driven suites
  live in the dev database and look exactly like junk. Always run the
  ID reference check before proposing or performing any dev-database
  row deletion.

- [2026-07-30] Running a second `npm run dev` in the same project
  corrupts the shared `.next` build and 500s the ENTIRE app, including
  routes unrelated to whatever change is being tested. Recovery per
  the [2026-07-25] entry (kill tree + delete `.next`). Always confirm
  no other dev server is already running before starting one — check
  for an existing process/port bind, don't assume a clean start.

## Project hard rules

(none yet — entries above are environment facts, not incident-derived
hard rules; nothing has risen to that bar yet)
