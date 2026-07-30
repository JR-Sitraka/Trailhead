# ADR-009: Embedding model choice — jina-embeddings-v2-base-code (q8)

**Status:** Accepted

**Date:** 2026-07-28

**Context:** Upgrade item 3 (`embedding-swap.md`) requires replacing
`Xenova/all-MiniLM-L6-v2` with a code-aware embedding model, subject
to unchanged constraints: zero-spend, fully local, transformers.js-
compatible. Per `software-architect.md`'s quality standard, a
targeted search for known compatibility issues and a real
environment/throughput measurement were required before any
candidate was committed to — not assumed from documentation alone.

**Candidate:** `jinaai/jina-embeddings-v2-base-code` (JinaBERT, 161M
params, trained on GitHub code + 150M code/docstring QA pairs, 30
languages). Real evidence gathered across two gated steps:

**Step 1 — environment probe (2026-07-28):** loads and runs under
this project's exact `@huggingface/transformers@4.2.0`. No
`trust_remote_code` error on the ONNX path — the documented
Jina-family compatibility risk does not apply here, since ONNX
weights ship directly in the model repo and transformers.js loads
them without the Python custom-code path. Output dimension confirmed
768 (vs. current 384 — real pgvector migration required). Correctness
sanity check: related code pairs scored 0.42–0.56, unrelated pairs
0.06–0.11 — clean separation, and notably `retrieveChunks` (Drizzle
SQL) and `generateEmbeddings` (a batching loop) scored 0.557 despite
almost no shared surface tokens, directly demonstrating the semantic
discrimination the baseline's MiniLM lacks (semantic Top-1 = 0.000).

**Step 2 — throughput measurement (2026-07-28), corrected
methodology:** an initial run (v1) pooled chunks across files with
unbounded padding to a 3,918-char outlier, producing OOM-driven
swapping mislabeled as compute — its numbers (~17,411 ms/chunk) were
correctly discarded as invalid, not reported. A corrected run (v2)
replicated production's real per-file batching
(`poller.ts:91-97`) against 222 real corpus chunks, and re-measured
the CURRENT model on the same machine for a like-for-like ratio
(rather than comparing against a historical figure from different
hardware):

| Model | ms/chunk | vs. current |
|---|---|---|
| Current (MiniLM) | 442.47 | 1× |
| Jina q8 | 2,787.78 | 6.3× slower |
| Jina fp32 | 5,566.12 | 12.6× slower |

q8 matches fp32's quality with no measurable loss (sanity check:
0.53/0.42 vs. 0.11/0.06/0.07) at half the cost — **q8 is the
selected variant.**

**Tokenizer/truncation check (embedding-swap.md's flagged Edge
Case):** `model_max_length` 8192; across 148 real chunks, p50 224
tokens, p95 496, max 1,098 — zero truncation, 7.5× headroom at the
observed maximum. Edge Case closed with real margin.

**Decision:** Adopt `jinaai/jina-embeddings-v2-base-code`, quantized
(`model_quantized.onnx`, q8), dimension 768. Full re-embed of every
existing repository is required (dimension change; per
`embedding-swap.md`, no mixed-model queryable state is ever
permitted). Re-embed is a background, resumable, per-repository job
— unattended per the spec's own NFR, which a multi-hour one-off run
fits.

**The 6.3× cost ratio is the decision basis and is durable; the
measured wall-clock hours are NOT** — this machine measured 442ms/chunk
even on the CURRENT model (vs. KNOWN-GOOD 2026-07-22's ~12.9ms/chunk
average, ~34× faster), i.e. this machine is unusually
memory-constrained (7.4GB RAM, 3.3GB free, 4 CPUs) and slow for this
workload generally. Extrapolated re-embed times on this machine —
bench corpus (4,039 chunks) ~187.7 min (~3.1h) on q8; dev corpus (38
chunks) ~105.9s — are environment-dependent estimates from measured
rates, not a claim about performance elsewhere.

**Consequences:**
- BENCH-04's post-swap comparison (SWAP-04) is the actual quality
  gate — this ADR establishes environment/throughput viability, not
  a retrieval-quality verdict.
- pgvector schema migration: `vector(384)` → `vector(768)`, full
  re-embed of all repositories, no mixed-model queryable state ever
  (per `embedding-swap.md`).
- `model_fp16.onnx` exists but was not tested (fp16 on CPU is often
  not faster than int8; not worth the measurement time given q8's
  clean result).
- **Latent risk found incidentally, independent of this swap:**
  `src/server/services/embeddings.ts` uses `BATCH_SIZE=32`
  unconditionally with no length-awareness. Production has survived
  only because per-file batching keeps batches small — a file with
  30+ long chunks in one batch could reproduce v1's OOM on
  constrained hardware. **Folded into item 7's closeout**, not fixed
  here (deliberate scope discipline, same as the boxen and
  check-got.ts items already tracked there).

---

# Amendment (2026-07-30) — dry-run results, methodology correction, scope correction

**Dry run complete on `trailhead_bench` only** (branch
`upgrade/embedding-swap-bench`). Real evidence, not a repeat of the
earlier throughput estimate — this amendment supersedes this ADR's
original extrapolated hours.

## Methodology correction — batch=1 is REQUIRED, not a performance choice
Real finding, changes how this candidate must always be run: **Jina
q8 embeddings are not batch-invariant.** Controls isolated the cause
to quantization × padding interaction: MiniLM Δ 1.04e-7 (batch-
invariant), Jina fp32 Δ 1.44e-7 (batch-invariant), **Jina q8 Δ up to
3.45e-2 (cosine 0.972, NOT batch-invariant)**. Since queries are
always embedded singly, a corpus embedded at any batch size other
than 1 would be measured under different conditions than the queries
compared against it — invalidating the comparison, not just
degrading it. **Every real and future run of this model MUST use
batch=1.** This is now the standing requirement, not the original
throughput-driven default.

## Extrapolated hours were wrong; the 6.3× ratio was not
Real re-embed: got alone took **9h24m** at batch=1 (~15s/chunk observed
at real corpus scale), not the ~3.1h originally extrapolated from a
222-chunk sample. Padding cost at batch=32 was severe enough that one
file (awesome's readme) ran *faster unbatched* (4:41) than batched
(9:44) — batching may not net-help this model on this hardware at
all. The original 6.3× per-chunk ratio (the durable decision basis)
is unaffected; only the wall-clock extrapolation was wrong, and it
was wrong in the pessimistic-for-batching direction, not the
optimistic one.

## Rollback scope correction (supersedes SWAP-06's implied granularity)
`embedding-swap.md`'s "rollback path... config change + re-embed, not
a rebuild" is TRUE but its implied **per-repository** granularity is
not achievable: one pgvector column carries one dimension for the
entire database, so a dimension rollback is necessarily
**whole-database**, not selective per repository. Rollback itself was
proven for real — reverted config, re-embedded one repository on the
prior model, verified 3/3 real ranks reproduced the committed
baseline exactly, then rolled forward and reproduced AFTER-SWAP
exactly. The mechanism works; its scope was overstated in the
original spec language.

## Config surface addition (within permitted scope)
`EMBEDDING_BATCH_SIZE` added as configuration (default unchanged at
32) after a real 13-chunk batch requested 6.5GB and onnxruntime
aborted (1h23m into a run) — this was ADR-009's own flagged latent
risk, and it was no longer latent; it blocked the run. The
length-aware batching FIX remains item 7's work, unchanged scope —
this addition only makes the batch size configurable, it does not
fix the underlying unawareness.

## Real dry-run results — the four PRD criteria
Baseline `BASELINE-2026-07-28T18-02-00-408Z.json` (MiniLM/384) vs.
`AFTER-SWAP-2026-07-30T01-57-15-380Z.json` (jina-v2-base-code q8/768,
batch=1). Identical manifestVersion and locked comparison parameters
— the comparator refuses to run otherwise.

| # | Criterion | Baseline | After | Verdict |
|---|---|---|---|---|
| 1 | Known code Top-3 | 50.0% | 87.5% | **MET** (+37.5pp) |
| 2 | Trap outranked-rate | 25.0% | 12.5% | **MET** (−12.5pp) |
| 3 | Semantic Top-1 / Top-3 | 0.0% / 28.6% | 14.3% / 42.9% | **MET** (both +14.3pp) |
| 4 | Documentation Top-3 (no regression) | 75.0% | 50.0% | **NOT MET** (−25.0pp) |

Overall Top-3 58.1%→67.7%, Top-1 25.8%→29.0%. Framework detection and
symbol resolution both held at 100% — confirms nothing outside the
embedding path was disturbed. Semantic Top-1 left 0.000 for the first
time; TRAP-06 (baseline's worst trap failure, >rank 50) is now rank
2. Criterion 4's −25pp is two queries (DOC-03, DOC-08) crossing the
Top-3 cutoff by one rank each in an 8-query category; Documentation
Top-1 held exactly steady; a second full run showed zero movement
(byte-identical top-10 lists) — the result is reproducible, but n=8
cannot distinguish "a real regression" from "two boundary cases."
**Adoption decision pending the person's call, per this spec's own
"mixed result is a human decision" rule.**

## Gate results (real evidence)
SWAP-02: 9/9 real mismatch cases fail loudly with measured widths.
SWAP-03: all 5 repos re-embedded, 4,039 chunks (identical pre/post
total — chunking unaffected), no mixed-model queryable state
observed. SWAP-05: three independent real failures (deliberate kill,
real OOM, session interruption) all left the affected repo
non-corrupt, others unaffected — stronger evidence than the single
induced case originally required. SWAP-06: real, not claimed —
reverted, verified 3/3 ranks against the committed baseline, restored.

## Two tooling gaps found in benchmark infrastructure
`metrics.ts` had no status filter — would have silently scored a
half-embedded repo as valid; verified its own gate correctly refuses.
`compare-runs.ts` hardcoded its output filename, silently overwriting
the committed baseline artifact on any other comparison pair — fixed
with a required `--out=` flag (default behavior otherwise unchanged).

---

# Criterion 4 REOPENED (2026-07-30) — systematic concern found, not boundary noise

Per the person's gate condition, a read-only review of DOC-03/DOC-08
found the disqualifying case:

- **DOC-03 (got):** correct file `documentation/5-https.md` moved
  rank 2→4. Not clean boundary movement — the model conflated
  `getAuthority()` (URL authority) with certificate authority (real
  word-sense error), and scored on the actually-answer-bearing chunk
  (not just the file), the true rank is 5, not 4.
- **DOC-04 (got):** independently shows code outranking documentation
  for a documentation-intent question — same mechanism, second
  instance in the same repo.
- **Category-wide:** 4 worse, 2 better by one rank, 2 flat — a
  consistent mild downward drift, not a wash. The mechanism is
  identifiable: **in the corpus's one repo with substantial code AND
  substantial documentation (got), documentation-intent questions now
  retrieve code above documentation.** This is the flip side of the
  same code-training property that produced the three met criteria —
  a real tradeoff, not a measurement artifact.
- **DOC-08 ground truth was ambiguous** — the displacing file
  (`pull_request_template.md`) is the alternative ground truth the
  original curation explicitly considered and declined for a reason
  ("file not verified present in the pinned snapshot") that does not
  hold — the file is present, confirmed. **DOC-08 rewrite adopted:**
  *"Which file directs contributors to both the new-list guidelines
  and the instructions for creating their own list?"* →
  `contributing.md` — this targets the dual-pointer role specifically,
  which only `contributing.md` serves, resolving the ambiguity.

**Adoption decision REOPENED — path (b).** q8's three wins (known_code
+37.5pp, trap-rate −12.5pp, semantic Top-1/Top-3 both +14.3pp) remain
real and are NOT retracted. The documentation category (n=8) cannot
safely quantify the tradeoff it surfaced; widening it, concentrated
in the corpus's mixed code/doc repositories, is required before a
final adoption decision — not because the wins are in doubt, but
because criterion 4's true shape isn't yet measured with confidence.

**Logged for future scoping, not decided now:** whether q8 can serve
all retrieval intents, or Trailhead eventually needs intent-aware
ranking or separate code/documentation embedding strategies. A real
question; needs its own evidence before its own architecture.
