# Test Plan — Trailhead (MVP-A + MVP-B Slice 1 + Slice 2a + Slice 2b)

Per `docs/09-testing/testing.template.md`: status uses the four
verification tiers from `playbooks/verification-tiers.md`.

**Read this before the tables below:** MVP-A screens are UI prototypes
with real click-through evidence for interaction patterns
("Partially verified"). **Ask/Chat and Export are static visual
references, not interactive prototypes** — zero UI-interaction-pattern
evidence to even partially credit. Every Ask/Chat and Export
acceptance criterion is **Not yet tested**, a genuinely weaker starting
point than MVP-A's rows, stated explicitly throughout.

---

## Feature: Repository Import

| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| Valid public GitHub URL creates `Repository` (status `queued`) + matching `AnalysisJob` | IMPORT-01 | Automated | **Agent-verified** (2026-07-21) — real HTTP call to a live, stable public repo (`octocat/Hello-World`) through the actual route handler; real `Repository` (`status='queued'`, correct `source`/`sourceUrl`) and `AnalysisJob` (`status='queued'`) rows confirmed in `trailhead_test`. Re-confirmed passing after the later `commitSha` integrity fix. |
| Valid ZIP under 150MB does the same | IMPORT-02 | Automated | **Agent-verified** (2026-07-21) — real clean-ZIP upload through the route, real `Repository`+`AnalysisJob` rows confirmed via direct DB query, not just the HTTP response body. |
| Invalid URL / private repo / oversized ZIP / invalid ZIP rejected correctly, no `Repository` row created | IMPORT-03 | Automated | **Agent-verified** (2026-07-21) — each sub-case has independent real evidence: malformed URL → 400 (real request); private repo → 400 with a distinct message (real request against a real private repo the server's token has access to, `private: true` detected); nonexistent/inaccessible-private repo → 400 (real 404 from live GitHub — confirmed structurally indistinguishable from a private repo with no token access, per GitHub's own documented behavior, not a gap); oversized ZIP → 413 (real 151MB buffer); corrupt/invalid ZIP → 400 (real corrupted bytes, and a real code defect fixed along the way — the route previously let this fall through to an unhandled 500). **Known fragility, not blocking:** the corrupt-ZIP catch matches on a specific error-message substring rather than error type — see `KNOWN-GOOD.md`. |
| Branch selector appears only when GitHub repo has >1 branch | IMPORT-04 | Manual | Partially verified — the Dashboard mock's Add Repository modal shows a branch dropdown appearing after a valid-looking URL is typed (UI pattern confirmed); real multi-branch detection against an actual GitHub repo untested. Deferred — needs UI, not yet built (see `PROJECT-STATE.md`'s open items). |

## Feature: Safe Preprocessing

| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| ZIP with path-traversal entry rejected outright, no partial data persisted | PREPROC-01 | Automated | **Agent-verified** (2026-07-21) — real ZIP bytes with a genuine traversal entry (constructed by overriding `entry.entryName` post-`addFile()`, since adm-zip's own API normalizes traversal attempts away before you can test against it), run through the full `POST /api/repositories` pipeline. Real `422`, real DB check confirming no row created. |
| ZIP with symlink pointing outside archive root rejected outright | PREPROC-02 | Automated | **Agent-verified** (2026-07-21) — a real, non-obvious defect was found and fixed here: the original detection checked ZIP compression method `99`, which actually means AES encryption, not a symlink marker. Corrected to check the real external-attributes field (`entry.header.attr`, Unix `S_IFLNK` bit). Verified with a real symlink entry constructed via genuine external-attribute bytes, confirmed by reading back the actual buffer — not a synthetic header object. |
| Repository at exact size/file-count limits imports successfully; one file over any limit triggers correct behavior | PREPROC-03 | Automated | **Partially verified** — real boundary tests exist for the 5,000-file count limit specifically (5,000-file ZIP → `truncated: false`; 5,001-file ZIP → `truncated: true`, both real executions) and the 1MB per-file parse ceiling (real 2MB test file → correctly skipped, not rejected). The 150MB compressed ZIP limit was tested with a real 151MB buffer (over, not exactly at, the boundary). **Not yet tested: the exact 500MB unpacked-size boundary** — no round has constructed a real archive landing precisely at that limit. Don't round this up to fully Agent-verified until that specific case is exercised. |
| No repository code ever executed, no dependencies installed, under any input (incl. malicious `postinstall`) | PREPROC-04 | Automated | **Agent-verified** (2026-07-21) — real test constructs a ZIP containing a malicious `postinstall` script (`package.json`), `install.sh`, and a `Makefile`; confirms all three are extracted as inert plaintext with zero execution paths exercised. Passed in every full-suite run since it was added. |

## Feature: Repository Dashboard

| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| All imported repositories appear with correct status, SHA, relative time | DASH-01 | Manual | Partially verified — mock renders these fields correctly for its fixed fake dataset; real data from a real import pipeline untested. |
| Status filter + text filter narrow the list correctly, individually and combined | DASH-02 | Manual | Partially verified — filtering logic confirmed functional against mock's fixed dataset; behavior at real scale (hundreds of repos) untested. |
| Reanalyze with no active job succeeds; with an active job returns 409, UI reflects it clearly | DASH-03 | Automated + Manual | Not yet tested — mock's Reanalyze always "succeeds" instantly with no concept of an already-running job, so the 409 path has never been exercised even in prototype form. |
| Delete requires confirmation; cancelling changes nothing; confirming removes the repository | DASH-04 | Manual | Partially verified — this is the one criterion with the most real prototype evidence: direct confirmation that cancel-leaves-list-unchanged and confirm-actually-removes-it via click-through. Real persistence (`DELETE` actually hitting a database) untested. |
| Zero-repositories and zero-filter-results are visually and textually distinct states | DASH-05 | Manual | Partially verified — both states confirmed present and distinct in the mock. |

## Feature: Repository Overview

| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| All six sections render correctly for a typical Next.js/TS repository | OVERVIEW-01 | Manual | Partially verified — mock renders all six sections correctly for its one fixed fake repository; real detection logic across varied real repos untested. |
| "Not analyzed" section accurately lists every skipped file and its real reason | OVERVIEW-02 | Automated + Manual | Not yet tested — mock hardcodes two example skip reasons; real skip-detection logic (1MB limit, unsupported syntax) never runs. |
| Repository with no skips shows an appropriately absent "Not analyzed" section | OVERVIEW-03 | Manual | Not yet tested — mock always shows skips, this state was never built or demonstrated. |
| No LLM-generated text appears anywhere on this screen | OVERVIEW-04 | Manual | Partially verified — mock's copy is visibly template/fact-based, consistent with the requirement; this is a design-intent check more than a hard test, worth a real review pass once LLM-adjacent code exists nearby to make sure nothing leaks across. |

## Feature: File Explorer

| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| Full file tree renders, expand/collapse works for every folder | EXPLORER-01 | Manual | Partially verified — confirmed interactively in the mock for its fixed tree structure. |
| Selecting a non-skipped file shows real content with accurate line numbers | EXPLORER-02 | Manual | Partially verified — confirmed for the mock's one populated file (`src/app/page.tsx`); real tree-sitter-parsed line accuracy across arbitrary files untested. |
| Selecting a skipped file shows its specific skip reason, not a generic message | EXPLORER-03 | Manual | Partially verified — confirmed for the mock's one example (`prisma-client.ts`, 1MB limit reason); other skip-reason variants (unsupported syntax) not demonstrated interactively. |
| Every file in the repository has a tree entry, including skipped ones | EXPLORER-04 | Automated | Not yet tested — true against the mock's fixed tree by construction, not a real guarantee against arbitrary real repositories yet. |

## Feature: Symbols

| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| Every function/class/interface/import/export tree-sitter can extract appears with correct kind, name, file:line | SYMBOLS-01 | Automated | Not yet tested — mock's 14 symbols are hardcoded, not extracted by real `web-tree-sitter`. |
| Kind filtering (incl. Import/Export) returns correct subset, server-side | SYMBOLS-02 | Automated | Not yet tested — **known spec mismatch, not just "untested":** the mock filters client-side against a fixed array; the real spec requires server-side filtering (`architecture.md`). Confirming client-side filter *logic* works (which was done) doesn't validate the server-side requirement at all — different mechanism, not just a different environment. |
| Repository with zero extracted symbols shows the required empty state | SYMBOLS-03 | Manual | Not yet tested — flagged as an honest gap since this screen was first built, still true; no real or mock zero-symbol case has ever been exercised. |

## Feature: Search

| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| Query matching known content returns correct, ranked results with accurate path/line | SEARCH-01 | Automated | Not yet tested — mock's matching is a simple case-insensitive substring check against 9 hardcoded entries, not real Postgres `tsquery`/`ts_rank`. |
| File-type and path filters narrow results, individually and combined with a query | SEARCH-02 | Manual | Partially verified — confirmed functional in the mock against its fixed dataset. |
| Non-matching query shows the real zero-results state with the required reminder text, including the Ask pointer | SEARCH-03 | Manual | Partially verified — confirmed genuinely reachable and shows the required copy (updated MVP-B Slice 1 to point toward Ask; the mock reflects this update). |
| Skipped files never appear in results under any query | SEARCH-04 | Automated | Not yet tested — mock's dataset has no concept of a "skipped" file at all, so this has never been exercised even in prototype form. |
| Empty query shows the prompt state, not an API call or error | SEARCH-05 | Manual | Partially verified — confirmed in the mock. |
| Query with over 50 matches returns exactly 50, ranked highest-first | SEARCH-06 | Automated | Code-reviewed only — the `.slice(0, 50)` cap is present in the mock's source and was re-read to confirm it's there, but the mock's 9-entry dataset can never actually trigger it; the cap has literally never fired, not once, even in prototype form. |

---

## NFR verification (Repository Import/Safe Preprocessing-related rows)

| Budget (from architecture.md) | Measured value | Status |
|---|---|---|
| `files.repositoryId`/`symbols.fileId`/`analysis_jobs.repositoryId` b-tree indexes present | — | Not yet tested — a real database exists now (`trailhead_dev`/`trailhead_test`), so this is genuinely checkable; hasn't been checked yet. |
| `files.contentSearchVector` GIN index present | — | Not yet tested — same as above. |
| Repository size/count limits enforced (150MB/500MB/5,000 files/1MB) | — | Partially verified — see `PREPROC-03` above; 5,000-file and 1MB-per-file boundaries confirmed real, 500MB unpacked boundary still untested. |
| `AnalysisJob` 30-minute timeout → `failed` | — | Not yet tested — added to the spec, never built or exercised in any form. |
| Search result cap at 50 | — | Code-reviewed only — see `SEARCH-06` above. |
| Authorization-per-endpoint | N/A | Not applicable — no auth in MVP-A, per `architecture.md`; not a gap, a scope decision. |

## Known coverage gaps

- **Security-critical `PREPROC-01`, `PREPROC-02`, and `PREPROC-04` are now genuinely Agent-verified with real evidence** — a real, meaningful state change from earlier in this project, worth stating plainly rather than under- or over-selling it. `PREPROC-03` remains Partially verified specifically on the 500MB unpacked boundary.
- **Symbols' kind filtering (`SYMBOLS-02`) is a genuine spec mismatch, not just an untested item** — worth remembering specifically when implementation reaches Symbols, so "the mock already does this" isn't mistaken for "this is already solved."
- **Symbols' zero-symbols empty state (`SYMBOLS-03`) has been an open gap since that screen was first built** and remains one — worth a deliberate check the first time a real zero-symbol repository exists.
- **Every "Partially verified" row above (Dashboard/Overview/Explorer/Symbols/Search) is still UI-interaction-pattern evidence from a prototype with in-memory fake data** — real, but a narrow slice of what each acceptance criterion actually requires. Don't let this table read as more progress than it represents outside of Import/Preprocessing.

## Feature: Chat (MVP-B Slice 1 + 2b)

`ASK-01` through `ASK-10` remain the baseline — Chat's first turn is
required to behave identically. Additive rows below.

| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| Chat unreachable (409-equivalent) for non-ready repo | CHAT-01 | Automated | **Agent-verified** (2026-07-25) — real Playwright nav to a non-ready repo's /chat route, confirmed real 404. |
| Fresh conversation's first turn matches ASK-01–10 | CHAT-02 | Automated | **Agent-verified** — real question submitted, real no_evidence UI state observed. |
| Follow-up retrieval query built from current + prior questions only | CHAT-03 | Automated | **Agent-verified** — real second-turn request intercepted, confirmed real history array present with prior turn's real question/answer/citations shape. |
| Follow-up generation includes full prior history | CHAT-04 | Automated | **Agent-verified** — same real intercepted request confirms full history object present, distinct mechanism from CHAT-03 per the original design. |
| Turn N failure leaves turns 1..N-1 intact | CHAT-05 | Automated | **Agent-verified** — real forced 502 on turn 2, confirmed turn 1's real rendered state unchanged before and after. |
| Failed turn shows real question, null answer, no fabrication | CHAT-06 | Automated | **Agent-verified** — real failed-turn UI confirmed showing the question with no fabricated prose. |
| "New conversation" clears thread | CHAT-07 | Manual→Automated | **Agent-verified** — real click, real thread-count transition 1→0 confirmed. |
| Reload loses conversation (correct behavior) | CHAT-08 | Manual→Automated | **Agent-verified** — real reload, real confirmation conversation is gone (inverted pass condition correctly checked). |
| Malformed history rejected 400 | CHAT-09 | Automated | **Partially verified** — real 400 confirmed at the API level (direct call). Real UI-level gap, not a bug: ChatClient's React state can never construct a malformed history object through real user interaction, so this path is structurally unreachable from the UI. Server-side protection is real; UI can't exercise it. Accepted as a real, permanent limitation of black-box UI testing for this specific criterion. |
| Empty/over-500-char question rejected | CHAT-10 | Automated | **Agent-verified** — empty: real disabled submit button confirmed. Over-limit: real 400 + real UI error state confirmed. |

## Feature: Export (MVP-B Slice 2a)

| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| Export unreachable for non-ready repo | EXPORT-01 | Automated | **Agent-verified** (2026-07-25) — real nav to analyzing repo, real error state UI confirmed. |
| JSON schema matches real repository data, no modules field | EXPORT-02 | Automated | **Agent-verified** — real rendered JSON cross-checked against real DB state. |
| REPOSITORY_CONTEXT.md citations resolve to real file/line data | EXPORT-03 | Automated | **Agent-verified** — real citation link clicked, confirmed real navigation to Explorer with correct file. |
| Deterministic fallback fires and is visually distinct | EXPORT-04 | Automated | **Agent-verified** — real zero-entrypoint repo triggered real fallback, real muted-note UI confirmed distinct from error state. |
| Fallback substantively equivalent to JSON export | EXPORT-05 | Automated | **Agent-verified** — real cross-check confirms matching repo name/stack facts between fallback prose and JSON for the same repository. |
| Task-Packet real ranked results, real content | EXPORT-06 | Automated | **Agent-verified** — real task submitted, real file paths/content confirmed in rendered results. |
| Empty/over-1000-char task rejected | EXPORT-07 | Automated | **Agent-verified** — real disabled-button + real UI error text confirmed for both cases. |
| All three formats independently generatable | EXPORT-08 | Automated | **Agent-verified** — real concurrent generation confirmed non-interfering via real state captions. |
| UI and API paths produce identical results | EXPORT-09 | Automated | **Agent-verified** — real byte-identical comparison between rendered UI text and direct API response. |
| Download/Copy work for real | EXPORT-10 | Automated | **Agent-verified** — real browser download event and real clipboard write both confirmed. |

## Feature: Repository Overview / Symbols / Search — real UI verification (2026-07-25)

*(Backend-level criteria for these three features were already closed in
earlier rounds — see prior testing.md history. This entry closes the
real UI-rendering gap that remained.)*

| Acceptance criterion | Type | Status |
|---|---|---|
| Overview: all sections render with real data, honest empty/absent states | Automated | **Agent-verified** — real walkthrough against openai/DALL-E, all sections + correct null/absent handling confirmed. |
| Symbols: kind filtering real server-side, aria-pressed correct | Automated | **Agent-verified** — real chip clicks, real aria-pressed transitions confirmed across all 5 kinds + All. |
| Search: real debounced results, real empty/zero-results states | Automated | **Agent-verified** — real typed query, real debounce, real prompt state, real zero-results copy all confirmed. |

## Accessibility — keyboard navigation (2026-07-25)

| Check | Status |
|---|---|
| Keyboard-only Tab/Enter/Escape navigation, all 7 screens | **Agent-verified** — real focus order, real focus visibility, real Enter-activation confirmed across Dashboard/Overview/Explorer/Symbols/Search/Export/Chat. |
| Modal Escape-to-close (AddRepositoryModal, ConfirmDeleteModal) | **Agent-verified** — real bug found (AddRepositoryModal never had an Escape handler, a regression against this project's own original requirement) and real-fixed; both modals now confirmed closing on Escape via real Playwright test. |
| **Full screen-reader-output testing (NVDA/VoiceOver announcement correctness)** | **Not yet tested** — explicitly NOT closed by keyboard-navigation testing. Real, separate, unclosed gap. Specifically unverified: aria-live behavior for Search/Symbols/Chat loading states, heading structure beyond visible labels, dynamic-update announcement timing. |

---

## NFR verification

*(All prior rows unchanged.)*

| Budget (from architecture.md) | Measured value | Status |
|---|---|---|
| Shared Gemini free-tier quota (1,500 req/day) under combined Ask/Chat + Export load, specifically accounting for chat's multi-request-per-session pattern (MVP-B Slice 2b) | — | Not yet tested — this is now the most urgent unmeasured risk in the whole project: a single active conversation can consume several requests in quick succession, on top of Export's own usage, against a quota with no in-app enforcement anywhere |

## Known coverage gaps

*(All prior gaps unchanged.)*

- **`CHAT-05` is the real proof of Slice 2b's central design decision**
  (turn-level failure independence), same relationship `EXPORT-04` has
  to Slice 2a's deterministic-fallback decision — not routine coverage.
- **Questions-only context blending (`CHAT-03`) is a real, open
  question, not a settled fact** — `architecture.md` and `chat.md` both
  name this as a deliberate default that could underperform on
  answer-dependent follow-ups; real conversation data, not this test
  plan, is what will actually settle whether it needs revisiting.
- **The shared Gemini quota risk is now the single most pressing
  unmeasured NFR across the entire project** — three features (Ask/
  Chat, Export's REPOSITORY_CONTEXT.md, and now chat's per-turn
  pattern specifically) all draw from the same 1,500 req/day budget
  with zero in-app enforcement. Worth genuinely prioritizing once
  implementation begins, not treated as one line among many.

## Known coverage gaps (additions, 2026-07-25)

- **CHAT-09 has a structural UI-testing ceiling**, not a bug — malformed history can only ever be tested at the API level, never through real black-box UI interaction, since the client never constructs malformed state. Worth documenting permanently, not re-attempting with more elaborate automation.
- **Screen-reader-output testing remains the single largest unclosed
  verification gap across the whole project.** Keyboard-navigation
  testing tonight closed real, meaningful ground (focus order, Escape
  handling, a real regression found and fixed) but is explicitly not
  the same claim.

---

# Upgrade phase additions (2026-07-27)

## Feature: LLM Observability (Upgrade item 5)
| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| Successful Chat turn increments today's requests by exactly 1 | OBS-01 | Automated | Not yet tested |
| Failed generation increments requests+failures, status → erroring | OBS-02 | Automated | Not yet tested |
| Export REPOSITORY_CONTEXT.md generation counted (shared abstraction) | OBS-03 | Automated | Not yet tested |
| Zero requests today → 0/0/unknown, panel true zeros (not unavailable) | OBS-04 | Automated | Not yet tested |
| Metrics store unreachable → panel unavailable AND Chat still succeeds | OBS-05 | Automated (failure-path) | Not yet tested |
| Status reflects latest outcome (success after failure → operational) | OBS-06 | Automated | Not yet tested |
| Rendered panel matches approved artifact | OBS-07 | Manual (visual parity) | Not yet tested |

## Feature: Golden Benchmark Suite (Upgrade item 2)
| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| Full run end-to-end on all 5 corpus repos, well-formed report | BENCH-01 | Automated | Not yet tested |
| Manifest validation fails fast on broken inputs | BENCH-02 | Automated (failure-path) | Not yet tested |
| Four query categories, person-verified ground truth | BENCH-03 | Manual | Not yet tested |
| Baseline report on current model committed BEFORE swap work | BENCH-04 | Manual gate | Not yet tested |
| Run-to-run jitter measured and characterized | BENCH-05 | Automated | Not yet tested |
| Framework-detection + symbol-resolution metrics vs ground truth | BENCH-06 | Automated | Not yet tested |

## Feature: Embedding Model Swap (Upgrade item 3)
| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| ADR-008 records candidates, constraint fit, known-issues searches, decision | SWAP-01 | Manual | Not yet tested |
| Dimension/config mismatch fails loudly (negative test) | SWAP-02 | Automated (failure-path) | Not yet tested |
| All repos re-embedded, no queryable mixed-model state | SWAP-03 | Automated | Not yet tested |
| Post-swap benchmark vs baseline, per-criterion verdicts | SWAP-04 | Automated + Manual verdict | Not yet tested |
| Mid-run re-embed failure: affected repo non-queryable-not-corrupt, others untouched | SWAP-05 | Automated (failure-path) | Not yet tested |
| Rollback exercised once for real | SWAP-06 | Manual | Not yet tested |

## Feature: "Unknown" detection state (Upgrade item 4)
| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| Low-evidence repo shows "Unknown", not a guess (real misdetection-class repo) | OVERVIEW-U1 | Automated + Manual | Not yet tested |
| Strong-evidence repo still detects correctly (no over-correction) | OVERVIEW-U2 | Automated (benchmark metric) | Not yet tested |
| JSON export: `framework: null` for Unknown | EXPORT-U1 | Automated | Not yet tested |
| REPOSITORY_CONTEXT.md states non-detection, both paths | EXPORT-U2 | Automated | Not yet tested |

## Screen-reader pass (Upgrade item 6) — plan
| Check | Type | Status |
|---|---|---|
| aria-live behavior: Search/Symbols/Chat loading states (NVDA or VoiceOver, real output) | Manual | Not yet tested |
| Heading structure beyond visible labels, all 7 screens + Overview's section headings semantics | Manual | Not yet tested |
| Dynamic-update announcement timing (Chat turns, job-status polling) | Manual | Not yet tested |
| ObservabilityPanel: announced sensibly, never in tab order | Manual | Not yet tested |
| Discovered issues fixed; remaining limitations documented in README | Manual gate | Not yet tested |

## Testing closeout (Upgrade item 7) — carried targets
*(IMPORT-04 and PREPROC-03's exact-500MB boundary rows above remain
the targets; Dashboard/Explorer planning-era rows to be closed with
real evidence where the functionality shipped — statuses updated in
place when done.)*

## NFR verification — Upgrade restatement
| Budget (from architecture.md, Upgrade section) | Measured value | Status |
|---|---|---|
| Groq free tier: 1,000 req/day AND 100K tokens/day shared across Chat + Export (supersedes the stale Gemini/1,500 row above — provider corrected 2026-07-27) | — | Not yet tested — now MEASURABLE via OBS counters once implemented; measure under real combined load |

## Known coverage gaps (addition, 2026-07-28)

- **`boxen` zero-files defect (found incidentally by benchmark stage
  A's corpus investigation, Agent-verified via real SQL):**
  `sindresorhus/boxen` sits at repository `ready` + job `completed`
  with **zero files, symbols, and chunks** — a "successful" analysis
  that produced nothing, which should be impossible. Root cause not
  yet diagnosed (deliberate scope call, ADR-008). **Folded into
  Upgrade item 7's closeout**: diagnose, fix or explain, and add a
  regression criterion when touched. Related open observation: `got`
  orphaned at `analyzing` with no job row (KNOWN-GOOD 2026-07-25) —
  possibly the same reanalysis-lifecycle neighborhood; check both
  together.

---

# Baseline results recorded (2026-07-28) — supersedes "Not yet tested" rows

BENCH-01/02/07: unchanged from stage A (all passed real execution/
failure-path tests). **BENCH-03/04/05/06 now COMPLETE**, committed
baseline `benchmark/reports/BASELINE-2026-07-28T18-02-00-408Z.json`
(manifestVersion 1.0.0, Xenova/all-MiniLM-L6-v2, 384-dim):

| Criterion | Status | Result |
|---|---|---|
| BENCH-03 (ground truth verified) | ✅ Person-verified | 31 queries + 26 symbols, both approved 2026-07-28 |
| BENCH-04 (baseline committed) | ✅ Agent-verified | Overall Top-1 0.258 / Top-3 0.581 — see category table below |
| BENCH-05 (jitter characterized) | ✅ Agent-verified | Zero movement across 2 runs (31/31 identical) — stated as practical stability for this set, NOT a determinism proof (KNOWN-GOOD 2026-07-23: query-embedding drift is real, only visible on near-ties) |
| BENCH-06 (detection + symbols) | ✅ Agent-verified | Framework 1.000 (5/5, nulls scored under ADR-010); Symbols 1.000 (26/26); DALL-E/awesome report as no-data, not 0% |

**Baseline category table** (the comparison point for item 3):
| Category | Top-1 | Top-3 |
|---|---|---|
| known_code | 0.250 | 0.500 |
| filename_trap | 0.375 | 0.750 |
| semantic | **0.000** | 0.286 |
| documentation | 0.375 | 0.750 |

**What item 3 has to beat, in priority order:**
1. Semantic Top-1 = 0.000 (sharpest evidence of the MiniLM limitation)
2. known_code Top-1 = 0.250 (direct lookup questions still fail 3/4)
3. TRAP-06 total displacement (`export.md` rank 1, `export.ts`
   outside top 50) — criterion 2's exact target

**Noise floor for post-swap comparison:** treat ±1 rank differences
on near-tied candidates as possible embedding noise, not signal —
rest verdicts on category-level movement, per BENCH-05's honest
N=2 caveat.

---

# Embedding swap dry-run results (2026-07-30) — trailhead_bench only

| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| SWAP-01 (ADR records candidates/fit/decision) | ADR-009 + this amendment | Manual | ✅ Agent-verified, done |
| SWAP-02 (dimension mismatch fails loudly) | 9/9 real cases | Automated (failure-path) | ✅ Agent-verified |
| SWAP-03 (all repos re-embedded, no mixed-model state) | Real DB check, 4,039 chunks | Automated | ✅ Agent-verified |
| SWAP-04 (post-swap vs. baseline, per-criterion verdicts) | 3 MET / 1 NOT MET (see ADR-009 amendment) | Automated + Manual verdict | ✅ Agent-verified; **adoption decision pending person** |
| SWAP-05 (induced failure: non-corrupt, others unaffected) | 3 real independent failures, identical outcome each time | Automated (failure-path) | ✅ Agent-verified — exceeds original requirement |
| SWAP-06 (rollback exercised for real) | Real revert + re-embed + verify + restore | Manual | ✅ Agent-verified — scope corrected (whole-DB, not per-repo; see ADR-009 amendment) |

**Not yet done, correctly scoped out of this dry run:** promotion to
`trailhead_dev`; app-boot-path validation wiring (fires at embedding-
runtime init currently, not `instrumentation.ts`); a live 409 check
against a running dev server (traced via code, not observed live —
Code-reviewed tier, stated as such).

---

# Item 3 — FINAL STATUS (2026-07-30)

All SWAP-01 through SWAP-06 gates **passed** (verified, unchanged from
prior rounds) — the swap CAN be executed safely, cleanly, and with
working rollback. That finding stands regardless of the product
decision below; do not read "held" as "gates failed."

**SWAP-04 (per-criterion PRD comparison) — final: PRODUCT DECISION
IS HOLD.** 3 of 4 criteria MET decisively (known_code, trap-rate,
semantic) under both manifest v1.0.0 and the widened v1.1.0. Criterion
4 (documentation, no regression) NOT MET under both manifests, with a
widened-run finding (overall Top-1 net negative) that was not visible
at the original sample size. Full reasoning and the person's decision:
`docs/10-decisions/adr-009-embedding-model-choice.md`, "FINAL DECISION
(2026-07-30)." **MiniLM remains production; q8 is preserved as the
leading code-retrieval candidate, not discarded.**

**Real cost/value note for the retrospective:** this item consumed
substantially more evidence-gathering than originally scoped (probe,
throughput ×2, dry run, reopen, widening, v1.1.0 comparison — roughly
10+ real rounds and real re-embed hours). The alternative — adopting
on the n=8 dry-run result alone — would have shipped a documentation-
retrieval regression to production, discovered only via real user
complaints rather than a controlled benchmark. The rigor cost real
time; the alternative would have cost real product quality silently.

---

# Item 5 — implementation status (2026-07-30)

| Criterion | Evidence | Tier |
|---|---|---|
| OBS-01 | Real Groq call, real DB row; also a real end-to-end dev-server Chat turn (0→1, operational) | Real-verified |
| OBS-02 | Real corrupted credential, real rejection, requests+failures both +1, status erroring | Real-verified |
| OBS-03 | Real `generateContextSummary` call with `generatedVia: "llm"` (proves it reached the provider) counted identically | Real-verified |
| OBS-04 | Real zero-state: `{requests:0, failures:0, providerStatus:"unknown"}`; real panel rendered true zeros, not the unavailable state | Real-verified |
| OBS-05 | Real induced failure (table renamed away, real Postgres 42P01), Chat still succeeded, recovery confirmed after restore | Real-verified |
| OBS-06 | Success-after-failure → operational, prior failure still counted | Real-verified |

Both call sites (Chat, Export) confirmed routed through the single
real choke point (`generateJson` in the newly-created
`generation.ts`) — traced, not assumed. Mock scaffolding
(`DEMO_STATES`, cycler) confirmed absent from shipped code via grep
and live DOM inspection (zero focusable elements on the panel).

**Regression check:** 281 passed / 4 failed, identical failure set to
`main` baseline (3 pre-existing Gemini-key failures, 1 pre-existing
timing flake, both KNOWN-GOOD-documented) — nothing touched by this
work broke anything.

---

# OBS-07 — visual parity, real evidence (2026-07-30)

Full evidence report:
[`docs/09-testing/parity-reports/observability-panel-parity-2026-07-30.md`](./parity-reports/observability-panel-parity-2026-07-30.md)

**Verdict: clean parity on every dimension the panel controls**
(structure, hierarchy, tokens, spacing, all four states, responsive
wrap). One Fail found — pre-existing, project-wide Inter font-
resolution defect, independent of this work, tracked separately
below rather than blocking this item.

| Check | Status |
|---|---|
| OBS-07 (rendered panel matches approved artifact) | ✅ Agent-verified AND Live-verified — person confirmed the running panel visually, 2026-07-30 |

## New coverage gap — Inter font-resolution defect (project-wide)
`Dashboard.tsx`'s root `font-sans` class resolves `--font-sans`,
which `globals.css`'s `@theme` never defines — Tailwind v4's system
font stack silently overrides `next/font`'s Inter, on every screen
(confirmed: h1, h2, repository-list header, and this panel all
affected identically). Not caused by any Upgrade-phase work. **Folded
into item 7's closeout**, alongside boxen, got's orphaned state,
`scripts/check-got.ts`, and `embeddings.ts`'s `BATCH_SIZE`
length-unawareness.

## Item 5 — CLOSED (2026-07-30)
All acceptance criteria (OBS-01 through OBS-07) real-verified; human
visual confirmation given. Merged into `main`.

---

# Item 6 — screen-reader pass, IN PROGRESS (2026-07-31)

**Tier: Live-verified** — real NVDA session, person's own hands and
ears, Speech Viewer transcripts captured. This is the highest
verification tier this project uses.

| Scenario | Screen | Finding | Status |
|---|---|---|---|
| 1 | Dashboard orientation | Landmarks/headings present and sensible; observability panel announced as one coherent region, never focusable — clean | ✅ Live-verified, no defect |
| 2 | Dashboard | **Status (Ready/Analyzing/Failed) never announced** when tabbing through a repository row | ❌ Real defect |
| 3 | Add Repository modal | **Tab escapes the modal into the browser's own toolbar/address bar** — no real focus trap | ❌ Real defect (WCAG AA) |
| 4 | Delete confirmation modal | **Same Tab-escape as Scenario 3** — likely shared root cause | ❌ Real defect (WCAG AA) |
| 5 | Observability panel | Confirmed non-interactive (Tab never lands on it); announced correctly via landmark navigation | ✅ Live-verified, no defect |
| 6 | Overview | **Zero of the six fact sections register as real headings** via H navigation | ❌ Real defect |
| 7 | Search | **No automatic announcement of loading or result count** — confirmed via retry, not just first-attempt silence | ❌ Real defect |
| 8 | Chat (no-evidence path) | **No-evidence response announces nothing at all** — most severe finding; a screen-reader user gets zero indication anything happened | ❌ Real defect |
| 8 (retry) | Chat (successful-answer path) | Pending — retry with a known-answerable question in flight | ⏳ Not yet tested |
| 9-11 | Explorer, Symbols, Export | Not yet audited | ⏳ Scenarios prepared, pending |

**Aside, logged but out of item 6's scope:** two Chat questions
against a real repository ("which files are in this project," "what's
inside index.js") both returned no-evidence despite reading as
reasonable questions — possible real retrieval-quality gap, not an
accessibility finding. Flagged for a separate look, not investigated
here.

**Fixes not yet scoped or applied** — audit continuing per the
person's choice before batching fixes.

---

# Item 6 — audit COMPLETE, 7 real defects confirmed (2026-07-31)

**Tier: Live-verified** throughout — real NVDA session, Speech Viewer
transcripts.

| # | Scenario | Screen | Finding |
|---|---|---|---|
| 1 | 2 | Dashboard | Status (Ready/Analyzing/Failed) never announced |
| 2 | 3 | Add Repository modal | Tab escapes into browser chrome — no real focus trap |
| 3 | 4 | Delete confirmation modal | Same escape as #2 — likely shared root cause |
| 4 | 6 | Overview | Zero of six fact sections register as real headings |
| 5 | 7 | Search | No automatic announcement of loading/result count |
| 6 | 8 (both original + retry) | Chat | **Silent on response regardless of outcome** — confirmed on both the no-evidence path and a real successful answer. Most severe finding: a screen-reader user gets zero indication Chat ever responded. |
| 7 | 9 | Explorer | Opening a file announces nothing — no content-loaded confirmation |

**Clean, no defect:**
- Scenario 1: Dashboard landmarks/headings
- Scenario 5: observability panel (non-interactive, announced correctly)
- Scenario 10: Symbols filter chips correctly announce toggle state
  (`pressed`/`not pressed`)
- Scenario 11: Export's three format sections are real headings

**Synthesis — defects 5, 6, 7 are likely ONE root cause, not three.**
Search results, Chat responses, and Explorer file-open are all async
content updates with zero announcement — the signature of a missing
or broken `aria-live` pattern applied inconsistently across the app's
dynamic-update points, not three isolated oversights. Proposed as a
single investigation, not three separate fixes.

**Proposed fix grouping (pending person confirmation):**
- Group A: modal focus trap (defects 2, 3)
- Group B: missing aria-live on async content updates (defects 5, 6, 7)
- Group C: two scoped, unrelated fixes (defects 1, 4)

**Aside, still out of scope:** the Chat retrieval-quality question
from the original Scenario 8 (reasonable questions returning
no-evidence) — flagged separately, not investigated here.

---

# Group B — aria-live fix, real evidence (2026-08-01)

**Root cause confirmed exactly as synthesized above, not three separate
causes:** `grep -r "aria-live" src/` returned zero matches anywhere in
the app before this fix. Search, Chat, and Explorer each had a
different call site but the identical underlying gap — no live region
existed at all, so React's DOM mutations on async completion were
structurally invisible to assistive tech regardless of correct
`polite` vs `assertive` choice (moot question — there was no region to
configure).

| # | Screen | Fix | Live-verified in real browser against real repository data (`sindresorhus/escape-string-regexp`) |
|---|---|---|---|
| 5 | Search | `aria-live="polite"` region renders "N result(s) found." / "No matches found." once loading completes | ✅ typed `function` → region read `"2 results found."`; typed a non-matching query → region read `"No matches found."` |
| 6 | Chat | Each turn's response area (covers generating/answered/no_evidence/off_topic/failed) wrapped in one `aria-live="polite"` region | ✅ **both paths independently confirmed**, not just one: a real no-evidence question produced a region reading "No relevant evidence found…"; a real answerable question (`What does the escapeStringRegexp function do?`) produced a region containing the real generated answer text |
| 7 | Explorer | `aria-live="polite"` region announces `Viewing [path]` once content loads, or the skip reason for skipped files | ✅ clicked `index.js` → region read `"Viewing index.js"` |

**What a screen-reader user now hears, in plain terms** (re-runnable
against these same three NVDA scenarios):
- **Search:** typing a query that matches something is followed, once
  results load, by NVDA speaking the result count aloud with no extra
  action needed; a non-matching query is followed by "No matches
  found."
- **Chat:** after asking a question, NVDA speaks "Thinking…" and then
  speaks whatever arrives next automatically — either the answer text
  itself or "No relevant evidence found" plus its explanation — the
  user is never left wondering if anything happened.
- **Explorer:** clicking a file in the tree is followed by NVDA saying
  "Viewing" plus the file's path once its content is loaded; selecting
  a skipped file announces the specific skip reason instead.

**Tests:** 6 new automated tests added (2 per screen — Search:
result-count + zero-results; Chat: no-evidence + answered; Explorer:
content-loaded + skip-reason), each asserting the live region exists
in the DOM *and* holds the correct text after the async state
transition, not merely that the text appears somewhere on the page.
Real execution: `npx vitest run tests/search-page.test.tsx
tests/chat-client.test.tsx tests/explorer-client.test.tsx` — 22/22
passed.

**Full regression suite:** `npx vitest run` — 287 passed / 4 failed.
The 4 failures are the same pre-existing, previously-documented set
(3 invalid-Gemini-key tests in `gemini-generation.test.ts`, 1 known
timing flake in `reanalysis.test.ts`) — identical failure set to the
baseline recorded after item 5, confirming nothing this change touched
broke anything. The 5 Playwright-authored `*-playwright.test.ts` /
`qa-walkthrough.test.ts` / `screenshot-test.test.ts` files fail to
*load* under the vitest runner (pre-existing config mismatch, not a
new issue — they require `npx playwright test` instead).

**Commit:** `e9f73cc` on branch `upgrade/a11y-live-regions`.

Defects 5, 6, 7 (Group B) — **closed**. Remaining item 6 groups
(A: modal focus trap; C: defects 1 and 4) are separate, not addressed
by this change.

---

# Group A — modal focus trap fix, real evidence (2026-08-01)

**Root cause confirmed exactly as synthesized above — shared, not
two separate bugs.** Both `AddRepositoryModal.tsx` and
`ConfirmDeleteModal.tsx` were plain styled `motion.div`s with
`role="dialog"` and `aria-modal="true"` but **zero real focus
management underneath**: no code intercepted Tab at all, so the
`aria-modal` attribute was purely advisory — it told assistive tech
"treat this as modal" while the actual DOM let Tab walk straight past
the dialog's own boundary into the browser's toolbar/address bar,
exactly as the NVDA session observed. Neither modal restored focus to
the element that opened it on close, either.

| # | Screen | Fix | Real evidence |
|---|---|---|---|
| 2 | Add Repository modal | New shared `useModalFocusTrap` hook cycles Tab/Shift+Tab within the dialog's real focusable elements; restores focus to the "Add repository" button on close | ✅ automated: 12 real forward Tabs + 12 real Shift+Tabs, focus never left the dialog (`dialog.contains(document.activeElement)` true throughout, both directions). ✅ live browser: same 12/15-Tab check against the running dev server, real focus landed back on the "Add repository" button after Escape. |
| 3 | Delete confirmation modal | Same hook wired in; restores focus to the row's own "Delete [repo]" button on close | ✅ automated: 10 real forward + 10 real Shift+Tabs, focus never left the dialog. ✅ live browser: same check against a real repository row (`sindresorhus/escape-string-regexp`), focus correctly trapped after 10 real Tabs. |

**Extra defect this surfaced and fixed in the same pass, not scoped
in the original audit:** `AddRepositoryModal`'s visually-hidden ZIP
file input (`className="hidden"`, only ever triggered via the visible
dropzone) would otherwise have been a silent extra stop in the tab
cycle once the trap made it reachable by keyboard at all — given
`tabIndex={-1}` so it stays excluded, verified by a dedicated test
that tabs through the ZIP tab and asserts the focused element is
never `type="file"`.

**Scenario 4's specific note addressed — real evidence, not assumed:**
`ConfirmDeleteModal` now sets `aria-describedby="delete-repo-description"`
on the dialog itself, pointing at the "Are you sure you want to delete
[repo]…" paragraph, so the target repository name is part of the
dialog's own accessible description rather than only being spoken via
whichever row button triggered it. Live-confirmed: `aria-describedby`
resolved to a real DOM node whose `textContent` contained
`"sindresorhus/escape-string-regexp"` after opening the dialog from
that repository's real Delete button.

**What a screen-reader/keyboard-only user now experiences** (re-runnable
against NVDA scenarios 3 and 4): opening either modal and pressing Tab
repeatedly stays inside the dialog indefinitely — it never reaches the
browser's own UI. Closing the dialog (Escape, Cancel, X, or a
successful action) returns keyboard focus to the exact button that
opened it, so the user's place in the page is never lost. Opening the
delete confirmation immediately makes the target repository's name
part of what's announced, not something the user has to already
remember from clicking Delete.

**Tests:** 6 new automated tests in `tests/modal-focus-trap.test.tsx`
(3 per modal: full-cycle Tab+Shift-Tab trap, focus-restore-on-close,
plus one hidden-file-input exclusion test for Add Repository and one
aria-describedby content test for Delete). Real execution: `npx vitest
run tests/modal-focus-trap.test.tsx` — 6/6 passed.

**Full regression suite:** `npx vitest run` — 293 passed / 4 failed.
Same pre-existing failure set as every prior round this phase (3
invalid-Gemini-key tests, 1 known `reanalysis.test.ts` timing flake) —
nothing this change touched broke anything. (287 passed after Group B
+ 6 new tests here = 293, confirming no other regression crept in
between the two rounds.)

**Commit:** `54f1ae5` on branch `upgrade/a11y-live-regions`.

Defects 2, 3 (Group A) — **closed**. Remaining item 6 group (C:
defects 1 and 4 — Dashboard status announcement, Overview heading
structure) is separate, not addressed by this change.

---

# Group C — real evidence, real fix for defect 1; defect 4 did not
# reproduce (2026-08-01)

**Defect 1 (Dashboard status announcement) — real root cause, real
fix.** `StatusPill`'s label text (`Ready`/`Analyzing`/`Queued`/`Failed`)
was always plain visible text — never hidden, never wrong — but it sat
outside any focusable element in the row. Tab navigation only stops at
focusable elements, so a keyboard/screen-reader user tabbing through a
row (as the NVDA scenario specifically did) skips straight past static
text between controls; this is standard AT behavior, not a rendering
bug, which is exactly why it read as "never announced" in practice.
Fixed by folding the status into the accessible name of the row's
`Open` link — the first focusable stop in the row — via
`aria-label="Open [repo], status: [status]"`, without touching the
visible pill at all.

**Defect 4 (Overview headings) — investigated, does not reproduce.**
Before writing any fix, both live-browser and automated evidence were
gathered: `document.querySelectorAll('h1,h2,...')` against a real
running repository (`sindresorhus/escape-string-regexp`) showed all
four always-present sections (Stack, Entry points, Configuration
files, Testing) are real `<h2>` elements today, and the same held for
the two conditional sections tested separately (a real `analyzing`-
status repo for "Status: analyzing"; a real `analyzing` non-ready repo
confirmed too). Git history shows the `Section` component's `<h2>`
was introduced 2026-07-25 (`82bb8f4`) — **before** the item 6 audit
(2026-07-31) — so this specific defect either didn't reproduce
against the build actually tested, or was a transient/misread finding
at audit time. Rather than writing a redundant "fix" for code that's
already correct, real regression tests were added to lock the current
(correct) state in place, covering all three section variants
(always-present, conditional Status, conditional Not analyzed) against
real DB-backed repository data — not just the previously-untested
"Not analyzed" conditional path, closing a pre-existing gap in
coverage regardless of the specific audit finding's reproducibility.

**Unrelated latent defect fixed along the way:**
`overview/page.tsx` used JSX without importing `React` — invisible in
production because Next's SWC compiler handles the JSX transform
independently, but it broke immediately under vitest's esbuild
transform the moment a real test tried to render the page directly.
Fixed by adding the import, matching every other component file in
this codebase, which already imports `React` explicitly.

**What a screen-reader user now experiences on Dashboard** (re-runnable
against NVDA scenario 2): tabbing to a repository row's "Open" link now
announces the repository name and its current status together — e.g.
"Open sindresorhus/got, status: Analyzing, link" — with no separate
action needed to learn what the colored pill shows visually.

**Tests:** 5 new tests in `tests/dashboard-overview-accessibility.test.tsx`
— 4 covering every `RepoRow` status's accessible name (`ready`,
`analyzing`, `queued`, `failed`) plus a check that the visible pill text
is unchanged; 3 covering Overview's always-present headings and both
conditional sections (`Status: analyzing`, `Not analyzed` with a real
skip reason) against real DB-backed repository/file rows, not mocked
data. Real execution: `npx vitest run
tests/dashboard-overview-accessibility.test.tsx` — 5/5 passed. Live
browser verification confirmed both the Dashboard accessible-name fix
and the Overview headings against the running dev server.

**Full regression suite:** `npx vitest run` — 299 passed / 3 failed.
The 3 failures are the same pre-existing invalid-Gemini-key tests as
every prior round; the known `reanalysis.test.ts` timing flake (KNOWN-
GOOD-documented, non-deterministic) did not trigger this run — 297
(Group A total) + 5 new = 302 total tests, confirming no other
regression crept in.

**Commit:** `9a1dd05` on branch `upgrade/a11y-live-regions`.

Defect 1 (Group C) — **closed**. Defect 4 (Group C) — **investigated,
confirmed not currently reproducible, coverage gap closed with real
regression tests**. Item 6's full defect list (1–7) is now fully
addressed across Groups A, B, and C.
