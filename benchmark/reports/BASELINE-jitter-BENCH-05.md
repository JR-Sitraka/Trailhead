# BENCH-05 — run-to-run agreement / jitter characterization

**Run A:** `BASELINE-2026-07-28T18-02-00-408Z.json` — 2026-07-28T18:02:00.407Z
**Run B:** `BASELINE-RUN2-2026-07-28T18-04-58-776Z.json` — 2026-07-28T18:04:58.774Z
**Model:** Xenova/all-MiniLM-L6-v2 · **manifestVersion:** 1.0.0
**Corpus embeddings were NOT recomputed between runs** (no re-import), so any
movement observed here originates on the query-embedding side.

## Aggregate

| Metric | Run A | Run B | Same? |
|---|---|---|---|
| Overall Top-1 | 0.25806451612903225 | 0.25806451612903225 | yes |
| Overall Top-3 | 0.5806451612903226 | 0.5806451612903226 | yes |
| Framework accuracy | 1 | 1 | yes |
| Symbol accuracy | 1 | 1 | yes |

## Counts

- Queries compared: **31**
- Identical correct-file rank: **31** · changed: **0**
- Top-1 verdict flips: **0**
- Top-3 verdict flips: **0**
- Trap-verdict flips: **0**
- Rank-1 file changed: **0**
- Top-10 ranked list changed anywhere: **0**

## Per-query

| Query | Category | Correct rank A → B | Trap rank A → B | Top-10 list | Flags |
|---|---|---|---|---|---|
| KC-01 | known_code | none → none | none → none | identical | — |
| KC-02 | known_code | 13 → 13 | none → none | identical | — |
| KC-03 | known_code | 3 → 3 | none → none | identical | — |
| KC-04 | known_code | none → none | none → none | identical | — |
| KC-05 | known_code | 1 → 1 | none → none | identical | — |
| KC-06 | known_code | 3 → 3 | none → none | identical | — |
| KC-07 | known_code | 5 → 5 | none → none | identical | — |
| KC-08 | known_code | 1 → 1 | none → none | identical | — |
| TRAP-01 | filename_trap | 2 → 2 | 28 → 28 | identical | — |
| TRAP-02 | filename_trap | 2 → 2 | none → none | identical | — |
| TRAP-03 | filename_trap | 2 → 2 | 3 → 3 | identical | — |
| TRAP-04 | filename_trap | 1 → 1 | none → none | identical | — |
| TRAP-05 | filename_trap | 1 → 1 | 4 → 4 | identical | — |
| TRAP-06 | filename_trap | none → none | 1 → 1 | identical | — |
| TRAP-07 | filename_trap | 1 → 1 | 17 → 17 | identical | — |
| TRAP-08 | filename_trap | 7 → 7 | 1 → 1 | identical | — |
| SEM-01 | semantic | 17 → 17 | none → none | identical | — |
| SEM-02 | semantic | none → none | none → none | identical | — |
| SEM-03 | semantic | 7 → 7 | none → none | identical | — |
| SEM-04 | semantic | 2 → 2 | none → none | identical | — |
| SEM-06 | semantic | 3 → 3 | none → none | identical | — |
| SEM-07 | semantic | none → none | none → none | identical | — |
| SEM-08 | semantic | 13 → 13 | none → none | identical | — |
| DOC-01 | documentation | 2 → 2 | none → none | identical | — |
| DOC-02 | documentation | 4 → 4 | none → none | identical | — |
| DOC-03 | documentation | 2 → 2 | none → none | identical | — |
| DOC-04 | documentation | 1 → 1 | none → none | identical | — |
| DOC-05 | documentation | 1 → 1 | none → none | identical | — |
| DOC-06 | documentation | 13 → 13 | none → none | identical | — |
| DOC-07 | documentation | 1 → 1 | none → none | identical | — |
| DOC-08 | documentation | 3 → 3 | none → none | identical | — |

## Movements observed

None.

## Finding

**Observed: zero movement across two runs.** Every query returned the same
correct-file rank, the same Top-1/Top-3 verdict, the same trap rank, and the
same trap verdict.

The full top-10 ranked file list was byte-identical for every query as well.

**Honest confidence statement:** two runs agreeing is evidence of *practical*
stability for THIS query set at THIS manifest version — it is NOT proof of
determinism. KNOWN-GOOD [2026-07-23] documents that the query embedding does
drift between separate invocations, and that the drift only changes an outcome
when two candidates are near-identically distant. The correct reading is that
this query set does not appear to sit on such knife-edges, not that the
underlying computation is bit-exact. A third run could still differ; N=2 cannot
rule that out. Any post-swap comparison should treat single-query rank
differences of ±1 on near-tied candidates as potential noise rather than signal,
and rely on category-level movement for its verdict.
