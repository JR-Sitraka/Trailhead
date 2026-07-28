# Feature: Golden Benchmark Suite (Upgrade item 2)

**Purpose:** Replace subjective impressions with objective, repeatable
measurement of retrieval and analysis quality — the guardrail every
later retrieval/analysis change runs against.

**User Story:** As the Trailhead operator/developer, I want a fixed,
scripted benchmark over a known corpus, so that I can prove a change
(starting with the embedding model swap) actually improves the
product and never silently regresses it.

**Functional Requirements:**
- **Corpus:** the existing 5-repository benchmark corpus, pinned —
  each repo recorded by source + exact commit SHA in a corpus
  manifest, so every run measures the same code.
- **Query set:** curated, human-verified ground truth (the person
  labels which file(s) are correct answers — the honest cost named in
  the PRD). Required categories, mapping 1:1 to the swap's success
  criteria: (a) known code questions, (b) filename-reference traps
  (queries where a filename mention could outrank real
  implementation), (c) semantic questions, (d) documentation
  questions. Set size is decided during curation and recorded in the
  manifest — not invented here before curation happens.
- **Metrics computed per run:** Top-1 and Top-3 retrieval accuracy
  (overall and per category); framework detection accuracy (per
  corpus repo, against its known framework — `unknown` scored per
  item 4's rules once that lands); symbol resolution accuracy
  (extracted symbols checked against a human-verified sample per
  repo, recorded in the manifest).
- **Runner:** a repo-local script (`npm run benchmark`), no UI
  (confirmed decision 2026-07-27). Runs against the test database;
  never touches dev data. Zero LLM generation calls — retrieval,
  detection, and symbol extraction only, so runs are quota-free.
- **Report:** each run writes a dated, committed report (JSON +
  readable summary) recording: embedding model ID, corpus manifest
  version, per-metric results, environment basics. Reports accumulate
  in-repo — the comparison history IS the deliverable.

**Non-Functional Requirements:**
- A full run completes unattended (no interactive prompts).
- **Known-limitation handling, stated up front:** embedding
  cross-call non-determinism is already documented for the current
  model (KNOWN-GOOD). The benchmark embeds once per run and compares
  rankings within that run; run-to-run ranking jitter is
  characterized (report it when observed), not assumed away. A
  reproducibility claim is made only after being measured.

**Inputs:** Corpus manifest, query set + ground truth, the embedding/
retrieval/detection modules as configured.

**Outputs:** The per-run report; a baseline report for the current
model (`Xenova/all-MiniLM-L6-v2`) — **required to exist before item
3's swap begins** (PRD sequencing rule).

**Business Rules:**
- Ground truth changes are versioned in the manifest — a result is
  only comparable to results on the same manifest version.
- The benchmark never auto-gates anything; it informs human
  decisions (consistent with item 5's no-enforcement posture).

**Validation Rules:** Runner validates the manifest before running:
all 5 repos present at pinned SHAs, every query has ground truth,
categories non-empty — fails fast with a specific message otherwise.

**Error States:** Missing/mismatched corpus repo → named failure, no
partial report; a single query erroring → recorded as errored in the
report (not silently skipped, not counted as miss); DB unavailable →
named failure.

**Edge Cases:** Ground-truth file deleted/renamed by a corpus re-pin
→ manifest validation catches it; tie scores at the Top-3 boundary →
tie handling stated in the report, deterministic rule chosen at
implementation and documented.

**Accessibility:** N/A — no UI.

**Analytics:** The reports themselves.

**Dependencies:** Existing embedding/retrieval/detection/symbol
modules; test DB; item 4 (only for scoring `unknown` — benchmark can
ship before it, scoring detection against known frameworks).

**Acceptance Criteria:**
- [ ] BENCH-01: `npm run benchmark` completes end-to-end on all 5
      corpus repos and writes a well-formed report.
- [ ] BENCH-02: Manifest validation fails fast (with a specific
      message) on a missing repo, missing ground truth, or empty
      category — verified by real broken-manifest runs
      (failure-path tests).
- [ ] BENCH-03: All four query categories present, each with
      person-verified ground truth recorded in the manifest.
- [ ] BENCH-04: **Baseline report on the current model exists and is
      committed before any swap work starts.**
- [ ] BENCH-05: Two consecutive runs on identical inputs are
      compared and their agreement/jitter is characterized in
      writing (measured, not assumed).
- [ ] BENCH-06: Framework detection and symbol resolution metrics
      computed against manifest ground truth for all 5 repos.

**Out of Scope:** Any UI; performance metrics (analysis/indexing
runtime, memory — deferred to V1, carried in PRD); auto-gating/CI
enforcement; LLM answer-quality scoring (retrieval quality only —
generation quality remains the existing groundedness metric's job).

---

# Amendment (2026-07-28, ADR-008) — corpus instantiated, bench DB

- **Corpus enumerated** (supersedes "the existing 5-repository
  corpus" phrasing above, which stage A proved was never
  instantiated): Trailhead (pinned SHA), `sindresorhus/got`,
  `sindresorhus/escape-string-regexp`, `openai/DALL-E`,
  `sindresorhus/awesome`. Rationale per slot: ADR-008.
- **Database:** the runner uses a dedicated **`trailhead_bench`**
  database (`BENCH_DATABASE_URL`), NOT `trailhead_test` — the test
  DB's documented vitest fixture churn is incompatible with a fixed
  baseline (ADR-008 supersedes the "test database" line above).
  Setup: `CREATE DATABASE trailhead_bench; CREATE EXTENSION vector;`
- **Setup step added to Functional Requirements:** a corpus-import
  step (`npm run benchmark:setup`) imports the five pinned repos into
  `trailhead_bench` through the real import pipeline, verifying each
  lands `ready` with non-zero files/chunks before the manifest is
  considered valid — no repo is pinned on assumption.
- Additional criterion:
  - [ ] BENCH-07: `benchmark:setup` imports all five pinned repos
        into `trailhead_bench`; each reaches `ready` with non-zero
        files and chunks (real DB evidence); a repo failing this is a
        named setup failure, not a silent benchmark skew.

---

# Amendment (2026-07-28) — trap-rank recording

**Added requirement (the ground-truth gate surfaced it):** for
`filename_trap` queries, the runner records **the trap file's rank
alongside the correct file's rank** in every report, plus a derived
per-query verdict (`trap_outranked_correct: true | false`) and a
category-level rate.

**Why this is not optional:** the embedding swap's success criterion
2 — "filename references no longer systematically outrank
implementation" — is a *comparison*, not an accuracy figure. Top-1/
Top-3 accuracy alone cannot evaluate it: a run where the correct file
sits at rank 2 behind its trap and a run where it sits at rank 2
behind an unrelated file score identically on Top-3 while meaning
opposite things.

Applies to the baseline run as well as every post-change run — a
baseline without trap ranks cannot serve as the comparison point
criterion 2 needs.

**Manifest status note:** the query set is APPROVED (31 queries:
8 known_code, 7 semantic, 8 documentation, 8 filename_trap);
`symbolGroundTruth` is curated as stage B's opening step and BENCH-06
is not valid until the person has verified it.
