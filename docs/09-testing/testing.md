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
