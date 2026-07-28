# Proposed symbol ground truth — verification sheet

**Status:** PROPOSED — agent candidates, NOT ground truth. Person must verify before BENCH-06 is treated as valid. Deliberately NOT written into manifest.json's symbolGroundTruth section.

**How these were checked:** Every entry below was checked twice: (1) a matching row exists in trailhead_bench's symbols table with the exact kind/name/startLine/endLine, AND (2) the symbol's name actually appears in the real file content sliced at that line range from the pinned SHA. Agent-verified; not person-verified.

**How to use this sheet:** every permalink below points at the exact pinned snapshot the benchmark measured — not the repository's current HEAD. Open a link, confirm the symbol at those lines really is the listed kind and name, and mark it. A symbol you reject should be struck from `benchmark/candidates/proposed-symbols.json` before that file's contents are promoted into `manifest.json`'s `symbolGroundTruth` section.

## Pinned SHAs used for these links

| Repo | Pinned commit |
|---|---|
| JR-Sitraka/Trailhead | `19221f3d5f5e17f38ed51e05a85966cc7b04e4d5` |
| sindresorhus/got | `e3924aa1e53a6ca3eb93a43618ce532442a89b40` |
| sindresorhus/escape-string-regexp | `cbc42403142c96923b482604e1f3d627b1956aff` |

## Selection rationale

**Principle.** Selected for REPRESENTATIVENESS across symbol kinds, file types, and known extractor edge cases — explicitly not the first N database rows. The point is to make a regression visible, which means covering the paths most likely to break, not the most numerous ones.
- **sindresorhus/escape-string-regexp** — All 6 extracted symbols, exhaustively — the repo is small enough that a complete census is the strongest possible sample. Covers function, export, and import across 3 files.
- **JR-Sitraka/Trailhead** — 10 chosen to cover: the repo's ONLY class (SecurityError — rarest kind, a single regression would erase the whole kind); interfaces; non-exported private helpers (fixedWindowChunks, findFtsLineNumber — these test that extraction is not export-gated); the function/export duplicate pair on one symbol (detectStackFacts appears as BOTH kinds at identical line ranges — a real extractor behavior worth pinning); a type-only import (ExtractedSymbol); and a const/enum export that is neither function nor class (repositoryStatusEnum).
- **sindresorhus/got** — 10 chosen to cover: the repo's ONLY interface (RequestPromiseShape); class inheritance (RequestError as base, TimeoutError as subclass); a genuine NAME COLLISION across files (two distinct classes both named TimeoutError, in errors.ts and timed-out.ts — this pins that symbol resolution is file-scoped, not name-global, which no other sample in the corpus tests); a function/export pair with DIFFERENT line ranges (calculateRetryDelay is declared at L5-40 and separately default-exported at L42 — the inverse of the Trailhead identical-range case); non-exported helpers (splitHeaderValue); and a type-alias export (ErrorCode).
- **openai/DALL-E** — EXCLUDED — 0 extracted symbols (Python; the extractor is TS/JS-only). Contributes no data. Must never be scored as 0% accuracy.
- **sindresorhus/awesome** — EXCLUDED — 0 extracted symbols (Markdown-only repo). Same treatment.

## The 26 proposed symbols

| ID | Repo | Path | Kind | Name | Start | End | Permalink |
|---|---|---|---|---|---|---|---|
| SYM-01 | sindresorhus/escape-string-regexp | `index.js` | `function` | `escapeStringRegexp` | 1 | 11 | [view at pinned SHA](https://github.com/sindresorhus/escape-string-regexp/blob/cbc42403142c96923b482604e1f3d627b1956aff/index.js#L1-L11) |
| SYM-02 | sindresorhus/escape-string-regexp | `index.js` | `export` | `escapeStringRegexp` | 1 | 11 | [view at pinned SHA](https://github.com/sindresorhus/escape-string-regexp/blob/cbc42403142c96923b482604e1f3d627b1956aff/index.js#L1-L11) |
| SYM-03 | sindresorhus/escape-string-regexp | `index.test-d.ts` | `import` | `expectType` | 1 | 1 | [view at pinned SHA](https://github.com/sindresorhus/escape-string-regexp/blob/cbc42403142c96923b482604e1f3d627b1956aff/index.test-d.ts#L1-L1) |
| SYM-04 | sindresorhus/escape-string-regexp | `index.test-d.ts` | `import` | `escapeStringRegexp` | 2 | 2 | [view at pinned SHA](https://github.com/sindresorhus/escape-string-regexp/blob/cbc42403142c96923b482604e1f3d627b1956aff/index.test-d.ts#L2-L2) |
| SYM-05 | sindresorhus/escape-string-regexp | `test.js` | `import` | `test` | 1 | 1 | [view at pinned SHA](https://github.com/sindresorhus/escape-string-regexp/blob/cbc42403142c96923b482604e1f3d627b1956aff/test.js#L1-L1) |
| SYM-06 | sindresorhus/escape-string-regexp | `test.js` | `import` | `escapeStringRegexp` | 2 | 2 | [view at pinned SHA](https://github.com/sindresorhus/escape-string-regexp/blob/cbc42403142c96923b482604e1f3d627b1956aff/test.js#L2-L2) |
| SYM-07 | JR-Sitraka/Trailhead | `src/server/services/preprocessing.ts` | `class` | `SecurityError` | 175 | 180 | [view at pinned SHA](https://github.com/JR-Sitraka/Trailhead/blob/19221f3d5f5e17f38ed51e05a85966cc7b04e4d5/src/server/services/preprocessing.ts#L175-L180) |
| SYM-08 | JR-Sitraka/Trailhead | `src/server/services/stackFacts.ts` | `interface` | `StackFacts` | 3 | 9 | [view at pinned SHA](https://github.com/JR-Sitraka/Trailhead/blob/19221f3d5f5e17f38ed51e05a85966cc7b04e4d5/src/server/services/stackFacts.ts#L3-L9) |
| SYM-09 | JR-Sitraka/Trailhead | `src/server/services/stackFacts.ts` | `function` | `detectStackFacts` | 113 | 187 | [view at pinned SHA](https://github.com/JR-Sitraka/Trailhead/blob/19221f3d5f5e17f38ed51e05a85966cc7b04e4d5/src/server/services/stackFacts.ts#L113-L187) |
| SYM-10 | JR-Sitraka/Trailhead | `src/server/services/stackFacts.ts` | `export` | `detectStackFacts` | 113 | 187 | [view at pinned SHA](https://github.com/JR-Sitraka/Trailhead/blob/19221f3d5f5e17f38ed51e05a85966cc7b04e4d5/src/server/services/stackFacts.ts#L113-L187) |
| SYM-11 | JR-Sitraka/Trailhead | `src/server/services/embeddingChunker.ts` | `function` | `fixedWindowChunks` | 54 | 63 | [view at pinned SHA](https://github.com/JR-Sitraka/Trailhead/blob/19221f3d5f5e17f38ed51e05a85966cc7b04e4d5/src/server/services/embeddingChunker.ts#L54-L63) |
| SYM-12 | JR-Sitraka/Trailhead | `src/server/services/search.ts` | `interface` | `SearchResult` | 4 | 9 | [view at pinned SHA](https://github.com/JR-Sitraka/Trailhead/blob/19221f3d5f5e17f38ed51e05a85966cc7b04e4d5/src/server/services/search.ts#L4-L9) |
| SYM-13 | JR-Sitraka/Trailhead | `src/server/services/search.ts` | `function` | `findFtsLineNumber` | 113 | 125 | [view at pinned SHA](https://github.com/JR-Sitraka/Trailhead/blob/19221f3d5f5e17f38ed51e05a85966cc7b04e4d5/src/server/services/search.ts#L113-L125) |
| SYM-14 | JR-Sitraka/Trailhead | `src/server/db/schema.ts` | `import` | `pgTable` | 1 | 1 | [view at pinned SHA](https://github.com/JR-Sitraka/Trailhead/blob/19221f3d5f5e17f38ed51e05a85966cc7b04e4d5/src/server/db/schema.ts#L1-L1) |
| SYM-15 | JR-Sitraka/Trailhead | `src/server/db/schema.ts` | `export` | `repositoryStatusEnum` | 4 | 4 | [view at pinned SHA](https://github.com/JR-Sitraka/Trailhead/blob/19221f3d5f5e17f38ed51e05a85966cc7b04e4d5/src/server/db/schema.ts#L4-L4) |
| SYM-16 | JR-Sitraka/Trailhead | `src/server/poller.ts` | `import` | `ExtractedSymbol` | 4 | 4 | [view at pinned SHA](https://github.com/JR-Sitraka/Trailhead/blob/19221f3d5f5e17f38ed51e05a85966cc7b04e4d5/src/server/poller.ts#L4-L4) |
| SYM-17 | sindresorhus/got | `source/as-promise/types.ts` | `interface` | `RequestPromiseShape` | 5 | 26 | [view at pinned SHA](https://github.com/sindresorhus/got/blob/e3924aa1e53a6ca3eb93a43618ce532442a89b40/source/as-promise/types.ts#L5-L26) |
| SYM-18 | sindresorhus/got | `source/core/errors.ts` | `class` | `RequestError` | 20 | 72 | [view at pinned SHA](https://github.com/sindresorhus/got/blob/e3924aa1e53a6ca3eb93a43618ce532442a89b40/source/core/errors.ts#L20-L72) |
| SYM-19 | sindresorhus/got | `source/core/errors.ts` | `class` | `TimeoutError` | 138 | 149 | [view at pinned SHA](https://github.com/sindresorhus/got/blob/e3924aa1e53a6ca3eb93a43618ce532442a89b40/source/core/errors.ts#L138-L149) |
| SYM-20 | sindresorhus/got | `source/core/timed-out.ts` | `class` | `TimeoutError` | 35 | 44 | [view at pinned SHA](https://github.com/sindresorhus/got/blob/e3924aa1e53a6ca3eb93a43618ce532442a89b40/source/core/timed-out.ts#L35-L44) |
| SYM-21 | sindresorhus/got | `source/core/timed-out.ts` | `export` | `ErrorCode` | 25 | 33 | [view at pinned SHA](https://github.com/sindresorhus/got/blob/e3924aa1e53a6ca3eb93a43618ce532442a89b40/source/core/timed-out.ts#L25-L33) |
| SYM-22 | sindresorhus/got | `source/core/calculate-retry-delay.ts` | `function` | `calculateRetryDelay` | 5 | 40 | [view at pinned SHA](https://github.com/sindresorhus/got/blob/e3924aa1e53a6ca3eb93a43618ce532442a89b40/source/core/calculate-retry-delay.ts#L5-L40) |
| SYM-23 | sindresorhus/got | `source/core/calculate-retry-delay.ts` | `export` | `calculateRetryDelay` | 42 | 42 | [view at pinned SHA](https://github.com/sindresorhus/got/blob/e3924aa1e53a6ca3eb93a43618ce532442a89b40/source/core/calculate-retry-delay.ts#L42-L42) |
| SYM-24 | sindresorhus/got | `source/core/utils/get-body-size.ts` | `function` | `getBodySize` | 5 | 27 | [view at pinned SHA](https://github.com/sindresorhus/got/blob/e3924aa1e53a6ca3eb93a43618ce532442a89b40/source/core/utils/get-body-size.ts#L5-L27) |
| SYM-25 | sindresorhus/got | `source/core/parse-link-header.ts` | `function` | `splitHeaderValue` | 1 | 56 | [view at pinned SHA](https://github.com/sindresorhus/got/blob/e3924aa1e53a6ca3eb93a43618ce532442a89b40/source/core/parse-link-header.ts#L1-L56) |
| SYM-26 | sindresorhus/got | `source/core/parse-link-header.ts` | `function` | `parseLinkHeader` | 58 | 105 | [view at pinned SHA](https://github.com/sindresorhus/got/blob/e3924aa1e53a6ca3eb93a43618ce532442a89b40/source/core/parse-link-header.ts#L58-L105) |

## Repos contributing no data

- **openai/DALL-E** — 0 extracted symbols (the extractor is TS/JS-only). Contributes no data to BENCH-06 and must never be scored as 0% accuracy.
- **sindresorhus/awesome** — 0 extracted symbols (the extractor is TS/JS-only). Contributes no data to BENCH-06 and must never be scored as 0% accuracy.

## Gate

`manifest.symbolGroundTruth.status` stays **PENDING** and `samples` stays empty until the person verifies this sheet. **BENCH-06 is not valid before then.**
