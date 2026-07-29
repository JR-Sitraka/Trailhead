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
