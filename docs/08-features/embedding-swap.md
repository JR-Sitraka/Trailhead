# Feature: Embedding Model Swap (Upgrade item 3)

**Purpose:** Replace the general-purpose text embedding model with a
code-aware one, fixing the product's documented core limitation
(filename mentions outranking real implementation; genuinely
answerable questions going unanswered).

**User Story:** As either persona, I want questions about code to
retrieve the actual implementing code, so that Chat and Task-Packet
export answer more of what I ask.

**Functional Requirements:**
- **Research pass first (gates everything below):** identify
  candidate code-aware embedding models satisfying ALL unchanged
  constraints: zero-spend, fully local, transformers.js-compatible
  (ONNX weights available/convertible). For each serious candidate,
  run the architect's targeted search rule ("<model> transformers.js
  known issues" or equivalent) BEFORE committing. Outcome recorded as
  **ADR-008: product-runtime embedding model choice** — a real
  runtime-model ADR, the exact decision class the implementation
  retrospective flagged the kit as lacking guidance for. An honest
  possible outcome: no candidate fits the constraints — in which case
  ADR-008 records that finding and this feature stops there, scoped
  down rather than constraint-broken.
- **Swap mechanics:** the model changes behind the existing embedding
  abstraction; no call-site changes. Model ID/dimension come from
  configuration.
- **Dimension migration:** if the new model's embedding dimension
  differs from the current 384, the pgvector column dimension must
  change — a real schema migration, flagged to the architecture full
  pass (this is the one place the swap touches the data model).
- **Full re-embedding:** every existing repository is re-embedded
  with the new model. Mixed-model state is never queryable: a
  repository's retrieval uses embeddings from exactly one model, and
  the system knows which.
- **Verification:** the item-2 benchmark, run on the new model,
  compared against the committed baseline (BENCH-04).
- **Rollback path:** the previous model config and the baseline
  remain available; if the benchmark verdict fails, reverting is a
  config change + re-embed, not a rebuild.

**Non-Functional Requirements:**
- Re-embedding runs unattended per repository and is resumable or
  cleanly restartable per repository — a mid-run failure never
  leaves a repository half-embedded-and-queryable.
- Model download/initialization failure is caught and surfaced;
  cold-start cost (known WASM/ONNX reality) is measured once and
  recorded in KNOWN-GOOD if materially different from the current
  model.

**Inputs:** Candidate research; configuration; existing repositories'
content.

**Outputs:** ADR-008; migrated schema (if dimension changes);
re-embedded repositories; a post-swap benchmark report.

**Business Rules:**
- **Success = the four PRD criteria, measured by the benchmark:**
  (1) known code questions retrieve relevant implementation in Top-3;
  (2) filename references no longer systematically outrank
  implementation (trap category improves vs. baseline);
  (3) semantic questions outperform the baseline model;
  (4) no measurable regression on documentation retrieval.
- If results are mixed (some criteria met, some not), the verdict is
  a human decision made against the numbers — the benchmark informs,
  never auto-decides.

**Validation Rules:** Config validation: model ID resolvable,
declared dimension matches the model's actual output dimension —
checked at startup, failing loudly, never silently truncating or
padding vectors.

**Error States:** Model artifacts unavailable/failed download →
named startup error, system otherwise unaffected; dimension mismatch
vs. schema → refuse to embed with a specific error (never write
wrong-dimension vectors); per-repo re-embed failure → that repository
marked not-ready for retrieval until re-run, others unaffected
("never lose more than what actually failed", the project's standing
principle).

**Edge Cases:** Repository imported mid-migration → embedded with
the new model only; benchmark ties/marginal deltas → human verdict
rule above; candidate model tokenizer limits vs. existing chunking →
checked in research pass, chunking params adjusted per config if
needed (recorded in ADR-008).

**Accessibility:** N/A — no UI change.

**Analytics:** The benchmark reports. Embedding remains uncounted by
item 5's observability (local + free — recorded decision).

**Dependencies:** **Hard: item 2's committed baseline (BENCH-04).**
The existing embedding abstraction; pgvector/Drizzle migration path;
architecture full pass for the dimension change.

**Acceptance Criteria:**
- [ ] SWAP-01: ADR-008 exists — candidates, constraint fit,
      known-issues search results per candidate, and the decision
      (or the honest no-fit outcome).
- [ ] SWAP-02: Dimension/config validation fails loudly on mismatch
      (real negative test).
- [ ] SWAP-03: All existing repositories re-embedded with the new
      model; none queryable in a mixed-model state (verified against
      real DB state).
- [ ] SWAP-04: Post-swap benchmark run committed; all four PRD
      criteria evaluated against baseline with explicit per-criterion
      verdicts.
- [ ] SWAP-05: A mid-run re-embed failure leaves the affected repo
      non-queryable-not-corrupt and others untouched (deliberate
      failure injection, per failure-path-testing).
- [ ] SWAP-06: Rollback exercised once for real (config revert +
      re-embed of at least one repo back to a working state) — not
      just claimed possible.

**Out of Scope:** Retrieval algorithm changes beyond the model
(chunking redesign, reranking, hybrid search — none of that this
phase); paid or hosted embedding APIs (constraint violation);
query-side changes to Chat/Export.

---

# Amendment (2026-07-28) — ADR renumbering

The model-choice ADR referenced above as "ADR-008" is now **ADR-009**
— ADR-008 was taken by the benchmark corpus/DB decision, which landed
first (see docs/10-decisions/adr-008-benchmark-corpus-and-db.md).
Every "ADR-008" reference in this spec (including SWAP-01) should be
read as ADR-009. No other content changes.
