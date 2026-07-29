# THE COMMITTED BASELINE — Upgrade item 2 (BENCH-03/04/05/06)

**This is the artifact item 3 (embedding model swap) is hard-gated on.**
`embedding-swap.md` lists "item 2's committed baseline (BENCH-04)" as a
hard dependency, and its four success criteria are evaluated *against
these numbers*. Do not overwrite these files; a re-run produces a new
dated report.

| | |
|---|---|
| **Date** | 2026-07-28 |
| **Embedding model** | `Xenova/all-MiniLM-L6-v2`, dimension **384** |
| **manifestVersion** | **1.0.0** (frozen) |
| **Database** | `trailhead_bench` (ADR-008) |
| **LLM calls** | **0** — retrieval/detection/extraction only, quota-free |

## Files

| File | What it is |
|---|---|
| `BASELINE-2026-07-28T18-02-00-408Z.json` / `.summary.md` | **Run 1 — THE BASELINE.** The recorded comparison point. |
| `BASELINE-RUN2-2026-07-28T18-04-58-776Z.json` / `.summary.md` | Run 2 — BENCH-05's repeat on identical inputs. |
| `BASELINE-jitter-BENCH-05.md` | The run-1-vs-run-2 agreement characterization. |
| `2026-07-28T01-54-23-641Z.*` | Stage-A smoke run, empty query set. **Not a baseline.** |
| `2026-07-28T13-31-35-355Z.*` | Pre-symbol-curation smoke run. **Not a baseline.** |

## Locked comparison parameters

Changing any of these invalidates comparability and requires a
`manifestVersion` bump **and** a new baseline.

- Rank-search depth: **50 chunks**
- Rank definition: **best chunk position per file** (file-level, not chunk-level)
- Duplicate collapse: **first occurrence wins**
- Tie handling: deterministic by retrieval order (`ORDER BY cosine_distance ASC, id ASC`)

## Corpus pins

| Repo | Pinned commit | knownFramework |
|---|---|---|
| JR-Sitraka/Trailhead | `19221f3d5f5e17f38ed51e05a85966cc7b04e4d5` | Next.js |
| sindresorhus/got | `e3924aa1e53a6ca3eb93a43618ce532442a89b40` | null (expected to decline) |
| sindresorhus/escape-string-regexp | `cbc42403142c96923b482604e1f3d627b1956aff` | null (expected to decline) |
| openai/DALL-E | `5be4b236bc3ade6943662354117a0e83752cc322` | null (expected to decline) |
| sindresorhus/awesome | `7cb5c8371c0fe73e5444a42d5542f6280c38b1a6` | null (expected to decline) |

---

## BENCH-03 — all four categories carry person-verified ground truth

| Category | Queries | Ground truth approved |
|---|---|---|
| known_code | 8 | 2026-07-28 (person) |
| semantic | 7 | 2026-07-28 (person) |
| documentation | 8 | 2026-07-28 (person) |
| filename_trap | 8 | 2026-07-28 (person, **authored** by the person, not agent-proposed) |
| **Total** | **31** | |

Symbol ground truth: **26 symbols across 15 file-samples**, person-verified
2026-07-28 against source at the pinned commits (see
`../candidates/proposed-symbols-review.md`). `manifest.symbolGroundTruth.status`
is `APPROVED`.

**BENCH-03 satisfied.**

---

## BENCH-04 — the baseline numbers

### Retrieval

| Category | Queries | Top-1 | Top-3 |
|---|---|---|---|
| known_code | 8 | 0.250 | 0.500 |
| filename_trap | 8 | 0.375 | 0.750 |
| **semantic** | 7 | **0.000** | 0.286 |
| documentation | 8 | 0.375 | 0.750 |
| **Overall** | **31** | **0.258** | **0.581** |

### Trap-rank comparison (swap criterion 2)

Trap outranked the correct file in **2 of 8** queries — rate **0.25**.

| Query | Correct rank | Trap rank | Trap outranked? |
|---|---|---|---|
| TRAP-01 | 2 | 28 | no |
| TRAP-02 | 2 | >50 | no |
| TRAP-03 | 2 | 3 | no |
| TRAP-04 | 1 | >50 | no |
| TRAP-05 | 1 | 4 | no |
| **TRAP-06** | **>50** | **1** | **YES** |
| TRAP-07 | 1 | 17 | no |
| **TRAP-08** | **7** | **1** | **YES** |

**BENCH-04 satisfied** — baseline exists and is committed before any swap work.

---

## BENCH-05 — run-to-run agreement

Two runs, identical inputs, **no re-embedding between them** (corpus
embeddings dated `2026-07-28T01:52`, hours before either run).

**Result: zero movement.** 31/31 queries identical correct-file rank; 0 Top-1
flips; 0 Top-3 flips; 0 trap-verdict flips; 0 changes anywhere in the top-10
ranked list.

**This is not a determinism proof.** KNOWN-GOOD [2026-07-23] records that the
query embedding does drift between separate invocations, and that the drift
only changes an outcome when two candidates are near-identically distant. The
honest reading: this query set does not sit on such knife-edges. N=2 cannot
rule out a third run differing. Post-swap comparisons should treat ±1 rank
differences on near-tied candidates as possible noise and rest verdicts on
category-level movement.

**BENCH-05 satisfied** — agreement measured and characterized in writing.

---

## BENCH-06 — framework detection and symbol resolution

**Framework detection: 1.000 (5/5).** Under ADR-010 a `null` expectation is a
real, scoreable expectation ("correctly declines to guess"), not missing data.

| Repo | Known | Detected | Match |
|---|---|---|---|
| JR-Sitraka/Trailhead | Next.js | Next.js | ✅ |
| sindresorhus/got | null | null | ✅ |
| sindresorhus/escape-string-regexp | null | null | ✅ |
| openai/DALL-E | null | null | ✅ |
| sindresorhus/awesome | null | null | ✅ |

**Symbol resolution: 1.000 (26/26 matched across 15 file-samples).**

`openai/DALL-E` and `sindresorhus/awesome` have 0 extracted symbols (the
extractor is TS/JS-only). They are reported as **contributing no data** and are
**not** scored as 0% accuracy.

**BENCH-06 satisfied.**

---

## Reading the baseline — what item 3 has to beat

Two findings dominate and are the swap's real targets:

1. **Semantic Top-1 = 0.000.** Not one of seven semantic queries puts the right
   file first. This is the sharpest quantitative statement of the limitation in
   KNOWN-GOOD [2026-07-25] (MiniLM has no code-semantic understanding).

2. **TRAP-06 is total displacement.** `docs/08-features/export.md` ranks **1**
   while `src/server/services/export.ts` is absent from the top **50** — the
   spec file completely displaces the implementation. Criterion 2 is precisely
   about this.

Also worth carrying forward: **known_code Top-1 is only 0.250** — even
directly-phrased "where is this implemented" questions land the right file
first one time in four.

**Verification tier for every number above: Agent-verified.** Real runs against
real data; not independently re-run by the person. The ground truth they are
scored against is person-verified (queries and symbols, both 2026-07-28).
