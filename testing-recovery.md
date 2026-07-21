# Recovered content — testing.md's Repository Import / Safe Preprocessing / Repository Dashboard / Repository Overview / File Explorer / Symbols / Search section

**Why this file exists:** `docs/09-testing/testing.md` currently
collapses this whole section to a single placeholder line —
`*(all unchanged — see prior rounds)*` — under the heading `## Feature:
Repository Import / Safe Preprocessing / Repository Dashboard /
Repository Overview / File Explorer / Symbols / Search`. The
row-level detail (`IMPORT-01`–`04`, `PREPROC-01`–`04`, `DASH-01`–`05`,
`OVERVIEW-01`–`04`, `EXPLORER-01`–`04`, `SYMBOLS-01`–`03`,
`SEARCH-01`–`06`, plus their NFR rows and known-gaps notes) was never
committed to git — checked `git log -- docs/09-testing/testing.md`
(one commit, already collapsed) — and only survived in this
conversation's own transcript from several rounds back. Reconstructed
here verbatim, at Sitraka's request, **without touching
`testing.md`, `PROJECT-STATE.md`, or anything else.**

Status annotations below are split into two kinds, kept visually
distinct so the reconstruction isn't confused with new information:
- Unmarked rows: the **original historical text**, exactly as it was
  written earlier in this session, before any real implementation
  existed.
- Rows marked **[Updated 2026-07-21]**: the original text, plus a
  follow-up note reflecting what `PROJECT-STATE.md`, `architecture.md`
  (ADR-006 backfill), and `KNOWN-GOOD.md` now say actually happened
  during implementation — since some of these criteria are no longer
  accurately described as "Not yet tested." Where I found no real
  implementation evidence for a row, it's left as originally written,
  not assumed updated.

---

## Feature: Repository Import

| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| Valid public GitHub URL creates `Repository` (status `queued`) + matching `AnalysisJob` | IMPORT-01 | Automated | Not yet tested. **[Updated 2026-07-21]** `architecture.md`'s backfilled `POST /api/repositories` contract documents this exact behavior as implemented and tested (github source path, real HEAD-commit lookup, real row creation) — now real, tested code, not a prototype claim. Recommend re-tiering to Agent-verified. |
| Valid ZIP under 150MB does the same | IMPORT-02 | Automated | Not yet tested. **[Updated 2026-07-21]** Same backfilled contract documents the zip source path (multipart file upload, File rows inserted, row re-selected before response) as implemented and tested. Recommend re-tiering to Agent-verified. |
| Invalid URL / private repo / oversized ZIP / invalid ZIP rejected correctly, no `Repository` row created | IMPORT-03 | Automated | Not yet tested. **[Updated 2026-07-21]** `architecture.md`'s error list for `POST /api/repositories` now documents real, implemented handling for every one of these cases (400 malformed fields, 400 invalid GitHub URL format, 400 repo-not-found/private-inaccessible, 400 confirmed-private, 413 oversized ZIP, 400 invalid archive, 422 safety-validation failure) — confirmed real per the ADR-006 backfill, including a real fix (commitSha integrity) found and corrected via a direct spec-vs-code cross-check. Recommend re-tiering to Agent-verified. |
| Branch selector appears only when GitHub repo has >1 branch | IMPORT-04 | Manual | Partially verified — the Dashboard mock's Add Repository modal shows a branch dropdown appearing after a valid-looking URL is typed (UI pattern confirmed); real multi-branch detection against an actual GitHub repo untested. **No implementation evidence found for this row** — `PROJECT-STATE.md`'s open items list "branch-selector logic (deferred, needs UI)" as still outstanding. Left unchanged. |

## Feature: Safe Preprocessing

| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| ZIP with path-traversal entry rejected outright, no partial data persisted | PREPROC-01 | Automated | Not yet tested. **[Updated 2026-07-21]** `KNOWN-GOOD.md` documents real, working test fixtures constructing genuine path-traversal entries (overriding `entry.entryName`/`entry.attr` after `addFile()`, since adm-zip's own API normalizes traversal attempts away) in `tests/preprocessing.test.ts` / `tests/repositories.route.test.ts`, and `architecture.md` documents the real `422 SecurityError` response this produces. Recommend re-tiering to Agent-verified. |
| ZIP with symlink pointing outside archive root rejected outright | PREPROC-02 | Automated | Not yet tested. **[Updated 2026-07-21]** Same fixture-construction approach and test files cover this case per `KNOWN-GOOD.md`; also documents a real, non-obvious finding along the way — adm-zip's compression-method value `99` means AES encryption, not a symlink marker, and must not be reused as a symlink-detection heuristic. Recommend re-tiering to Agent-verified. |
| Repository at exact size/file-count limits imports successfully; one file over any limit triggers correct behavior | PREPROC-03 | Automated | Not yet tested. **[Updated 2026-07-21]** `architecture.md` documents the real `413` (ZIP buffer exceeds 150MB, checked before parsing) and `422` (safety validation, including "oversized with zero files indexed") responses as implemented. Exact-boundary and per-file-size-limit behavior specifically wasn't called out with the same confidence in what I could recover — recommend confirming the *exact-limit* boundary case specifically before fully re-tiering this one, rather than assuming it's covered by the general size-limit implementation. |
| No repository code ever executed, no dependencies installed, under any input (incl. malicious `postinstall`) | PREPROC-04 | Automated | Not yet tested — this one is worth prioritizing early given its security weight, not treating as equal-priority with the rest. **No direct implementation evidence for this specific criterion found** in what I could recover from `architecture.md`/`KNOWN-GOOD.md` (they describe archive-safety validation — traversal, symlinks, size — but not a dedicated "confirm no code execution occurs" test). Left unchanged; worth confirming directly rather than assuming it's implied by the other preprocessing work. |

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
| Repository with zero extracted symbols shows the required empty state | SYMBOLS-03 | Manual | Not yet tested — flagged as an honest gap since this screen was first built, still true after the Import/Export addition; no real or mock zero-symbol case has ever been exercised. |

## Feature: Search

| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| Query matching known content returns correct, ranked results with accurate path/line | SEARCH-01 | Automated | Not yet tested — mock's matching is a simple case-insensitive substring check against 9 hardcoded entries, not real Postgres `tsquery`/`ts_rank`. |
| File-type and path filters narrow results, individually and combined with a query | SEARCH-02 | Manual | Partially verified — confirmed functional in the mock against its fixed dataset. |
| Non-matching query shows the real zero-results state with the required reminder text, now including the Ask pointer | SEARCH-03 | Manual | Partially verified — confirmed genuinely reachable and shows the required copy (updated MVP-B Slice 1 to point toward Ask; the mock reflects this update). |
| Skipped files never appear in results under any query | SEARCH-04 | Automated | Not yet tested — mock's dataset has no concept of a "skipped" file at all, so this has never been exercised even in prototype form. |
| Empty query shows the prompt state, not an API call or error | SEARCH-05 | Manual | Partially verified — confirmed in the mock. |
| Query with over 50 matches returns exactly 50, ranked highest-first | SEARCH-06 | Automated | Code-reviewed only — the `.slice(0, 50)` cap is present in the mock's source and was re-read to confirm it's there, but the mock's 9-entry dataset can never actually trigger it; the cap has literally never fired, not once, even in prototype form. |

---

## NFR verification (this section's original rows)

| Budget (from architecture.md) | Measured value | Status |
|---|---|---|
| `files.repositoryId`/`symbols.fileId`/`analysis_jobs.repositoryId` b-tree indexes present | — | Not yet tested (no real database exists). **[Updated 2026-07-21]** A real database now exists (`trailhead_dev`/`trailhead_test`, per `KNOWN-GOOD.md`) — worth actually checking this rather than continuing to assume it's untestable. |
| `files.contentSearchVector` GIN index present | — | Not yet tested — same update note as above. |
| Repository size/count limits enforced (150MB/500MB/5,000 files/1MB) | — | Not yet tested — same underlying gap as `PREPROC-03` above; see that row's update note. |
| `AnalysisJob` 30-minute timeout → `failed` | — | Not yet tested — added to the spec this session, never built or exercised in any form. No implementation evidence for this specific timeout found in what was recovered from `architecture.md`/`KNOWN-GOOD.md`. Left unchanged. |
| Search result cap at 50 | — | Code-reviewed only — see `SEARCH-06` above. |
| Authorization-per-endpoint | N/A | Not applicable — no auth in MVP-A, per `architecture.md`; not a gap, a scope decision. |

## Known coverage gaps (this section's original notes)

- **Nothing in this project has been verified against a real backend**
  *(as originally written — no longer fully accurate for
  Import/Preprocessing specifically; see the [Updated] rows above)*.
  Every "Partially verified" row above (for the remaining Dashboard/
  Overview/Explorer/Symbols/Search features) is still UI-interaction-
  pattern evidence from a prototype with in-memory fake data — real,
  but a narrow slice of what its acceptance criterion actually
  requires. Don't let a table full of non-"Not yet tested" rows read
  as more progress than it represents.
- **Symbols' kind filtering (`SYMBOLS-02`) is a genuine spec mismatch,
  not just an untested item** — the mock's client-side filtering
  doesn't validate the server-side requirement at all, by mechanism,
  not just by environment. Worth remembering this specifically when
  implementation reaches Symbols, so "the mock already does this"
  isn't mistaken for "this is already solved."
- **Security-critical items (`PREPROC-01` through `PREPROC-04`) have
  zero coverage of any kind, prototype or otherwise** *(as originally
  written — PREPROC-01/02 now have real, recovered implementation
  evidence per the updates above; PREPROC-03's exact-boundary case and
  PREPROC-04 still don't)*.
- **Symbols' zero-symbols empty state (`SYMBOLS-03`) has been an open
  gap since that screen was first built** and remains one after two
  further rounds of changes to that screen — worth a deliberate check
  the first time a real zero-symbol repository exists, not an
  assumption it'll just work.

---

## What to do with this file

This is a recovery artifact, not a canonical spec. If the reconstructed
content (and its [Updated] annotations) looks right, the natural next
step would be pasting the relevant parts back into
`docs/09-testing/testing.md` in place of its current placeholder line —
but per Sitraka's explicit instruction, that hasn't been done here;
`testing.md` itself is untouched.
