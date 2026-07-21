# Feature: Ask

**Purpose:** Let a developer ask a direct, natural-language question
about an imported repository and receive a grounded, citable answer —
instead of assembling the answer themselves via Search/Explorer/
Symbols.

**User Story:** As a developer exploring an unfamiliar or half-
forgotten repository, I want to ask a direct question ("where is
authentication handled?") and get a correct, evidence-backed answer,
so that I don't have to manually trace through files to find
something I could just ask about directly.

**Functional Requirements:**
- A single-question text input (`AskInput`), reachable only when the
  repository's status is "Ready" (parsing AND embedding both
  complete, per `architecture.md`'s two-phase job model).
- On submission: retrieve the top-K most semantically similar
  `EmbeddingChunk` rows for that repository (cosine similarity via
  `pgvector`, correct query direction per `architecture.md`'s stated
  gotcha).
- If the best-matching chunk's similarity falls below a threshold:
  return `no_evidence` **without calling the generation model** —
  saves free-tier quota on a query with nothing to answer from. The
  exact threshold value is deliberately **not fixed in this spec** —
  consistent with the PRD's own precedent of not inventing an untested
  numeric target — and must be tuned and documented against the
  5-repository eval corpus (`product-prd.md`'s Success Metrics) before
  this feature is considered complete. See Acceptance Criteria.
- Otherwise, pass the question and retrieved evidence to the
  generation model (Gemini 2.5 Flash) with an explicit instruction to:
  answer only from the provided evidence, cite every claim with a
  file/line reference drawn from that evidence, and signal explicitly
  if the question is unrelated to the evidence's subject matter
  (→ `off_topic`) or if it cannot be answered from the evidence despite
  being on-topic (→ `no_evidence`).
- **Post-generation citation validation (business rule, not optional):**
  every citation the model returns is checked against the actual set
  of retrieved chunks (matching `fileId` and line-range overlap). If
  **any** citation fails this check, the entire answer is discarded
  and the response becomes `no_evidence` — confirmed decision: never
  show a claim that didn't validate, even at the cost of occasionally
  discarding an answer that was probably fine. This is the concrete
  mechanism that enforces the PRD's hard-gated groundedness metric in
  code, not just in intent.
- A successful, validated answer is displayed via `AnswerBlock`: prose
  text with inline citation links, each linking to Explorer's
  file/line jump (per `ux-user-flows.md`'s "Ask repository" end state).
- No conversation memory — each question is independent, no state
  carried between questions (Slice 2 scope, explicitly excluded here).

**Non-Functional Requirements:**
- No fixed latency budget invented — same reasoning as MVP-A's Success
  Metrics: no real baseline exists yet. Observed response times during
  the 5-repo eval should be recorded (feeds `docs/09-testing/
  testing.md`'s NFR verification table), not assumed acceptable in
  advance.
- No in-app enforcement of Gemini's 1,500 req/day quota — exhaustion
  surfaces as an ordinary `502`/generation-failed case, per
  `architecture.md`'s NFR section. Not a gap in this spec; a stated,
  deliberate non-decision carried over from the architecture pass.

**Inputs:** A single natural-language question (string), submitted
against a specific, already-imported, "Ready" repository.

**Outputs:** One of: a validated, evidence-backed answer with
citations; a `no_evidence` result; an `off_topic` result; or a
generation-failure error. Never a partially-validated answer.

**Business Rules:**
- Ask is unreachable below repository status "Ready" — enforced
  server-side (`409`), not just hidden client-side.
- Every citation returned to the user must correspond to an actually-
  retrieved `EmbeddingChunk` for that query — no fabricated file/line
  references ever reach the user (see citation validation above).
- Chunking for retrieval reuses existing `Symbol` boundaries where
  available, falling back to fixed-size line windows only for
  unstructured regions (per `architecture.md`'s Data Model) — not a
  separate, invented chunking scheme.
- The no-evidence similarity threshold is a tunable parameter, owned
  by whoever implements retrieval, and must be justified against real
  eval-corpus behavior — not an arbitrary constant picked once and
  never revisited.

**Validation Rules:**
- `question`: required; rejected if empty or whitespace-only after
  trimming (`400`). Maximum 500 characters — chosen to keep prompts
  bounded under free-tier quota pressure and to match the screen's
  own natural-language-question framing (not a paragraph-dump field);
  revisit if real usage during the eval shows this is too restrictive.
- Repository referenced must exist (`404` if not) and must be status
  "Ready" (`409` if not — includes both "still analyzing" and
  "analysis failed" cases, same as every other workspace screen's
  existing pattern).

**Error States:**
- `400` — empty or over-length question.
- `404` — repository not found.
- `409` — repository not yet Ready.
- `502` — generation call fails (quota exhausted, timeout, or provider
  error). Distinct from `no_evidence`/`off_topic`, which are
  successful responses with a specific, honest outcome, not failures.
  Rendered via `AnswerBlock`'s Generation-failed state (`Card`'s
  Danger-tone variant).
- `no_evidence` (200, not an HTTP error) — rendered via `EmptyState`'s
  Empty-without-action variant. Reachable three ways: pre-generation
  low-similarity retrieval, post-generation LLM self-assessment, or
  post-generation citation-validation failure. The UI does not
  distinguish which of the three caused it — same copy, same visual
  treatment regardless of cause, since the user-facing meaning ("no
  grounded answer available") is identical in all three cases.
- `off_topic` (200, not an HTTP error) — rendered via the same
  `EmptyState` variant with different heading/subtext copy.

**Edge Cases:**
- Question is a single word or very short (e.g. "auth") — no special
  casing; goes through the same retrieval/generation path as any
  other question.
- Repository is reanalyzed (re-embedded) while an Ask request is still
  in flight — **not specifically handled in this slice.** The request
  is served against whichever `EmbeddingChunk` rows exist at query
  time; a race between an in-flight query and a concurrent
  delete-and-replace (per `architecture.md`'s reanalysis semantics) is
  a real, accepted gap for a single-operator, low-concurrency tool —
  stated explicitly rather than silently assumed away, not solved
  here.
- Adversarial/prompt-injection-style questions (e.g. "ignore previous
  instructions and...") — the generation instruction is written to
  resist being overridden by question content (answer only from
  provided evidence, regardless of what the question itself asks the
  model to do), but full adversarial-prompt hardening is not a stated
  Slice 1 requirement. Citation validation is the real backstop here:
  even if a question manipulates the model into an ungrounded answer,
  that answer fails citation validation and becomes `no_evidence`
  rather than reaching the user.

**Accessibility:** `AskInput` has an explicit `aria-label` (per
`component-specs.md`, corrected during `design-review`'s pass).
Citation links are real, tab-reachable `<a>` elements. **Known,
carried-over gap:** full screen-reader behavior of the inline-citation
prose pattern (a sentence interrupted by a link, then a monospace
aside) is Unverified per `ask-review.md` — not fixed by this spec,
flagged for `qa-engineer`'s pass.

**Analytics:** None. No analytics requirement exists anywhere in the
PRD for this feature, consistent with MVP-A's own scope (no analytics
built there either) — a deliberate absence, not an oversight.

**Dependencies:**
- `EmbeddingChunk` data must exist for the target repository (requires
  the Slice 1 embedding step in the "Analyze repository" flow to have
  completed).
- Explorer (citation jump-to-file/line target).
- Gemini 2.5 Flash free-tier API availability (external dependency,
  outside this project's control — see ADR-004's accepted-risk note).
- `transformers.js` in-process embedding pipeline (for query-time
  question embedding, same model as ingestion-time chunk embedding —
  must match, or similarity scoring is meaningless).

**Acceptance Criteria:**
- [ ] Ask is unreachable (returns `409`) against a repository whose
      status is not "Ready."
- [ ] Submitting a question against a "Ready" repository with genuinely
      relevant content returns a validated answer with at least one
      citation, and every returned citation resolves to a real
      file/line range that actually exists in that repository.
- [ ] Every citation in a returned answer corresponds to an actually-
      retrieved `EmbeddingChunk` for that query — verified by a test
      that deliberately induces a citation mismatch and confirms the
      response becomes `no_evidence`, not a partially-shown answer.
- [ ] A question with no relevant content in the repository returns
      `no_evidence`, not a fabricated or strained answer.
- [ ] A question unrelated to code/repository content at all (e.g.
      "what's the weather today") returns `off_topic`.
- [ ] A simulated generation-provider failure (quota/timeout/error)
      returns `502` and renders the Generation-failed state, distinct
      from the `no_evidence` state.
- [ ] Empty or whitespace-only question is rejected with `400` before
      any retrieval or generation call is made.
- [ ] Question exceeding 500 characters is rejected with `400`.
- [ ] The no-evidence similarity threshold used in the implementation
      is documented, along with the reasoning/data that justified the
      chosen value against the 5-repo eval corpus — not left as an
      unexplained constant in code.
- [ ] Groundedness is verified directly against the PRD's Success
      Metric: sampling real answers from the 5-repo corpus and
      confirming zero unsupported claims — this is the feature's real
      exit bar, not a proxy for it.

**Out of Scope:**
- Multi-turn conversation state (Slice 2).
- Agent context export (Slice 2).
- Citation UI beyond basic file/line links — no hover previews, no
  inline diff viewer, no separate sources panel (per the PRD and
  `ask.md` screen brief).
- Ranking/relevance tuning beyond the stated similarity-threshold
  decision — no broader retrieval-quality iteration in this slice.
- Cross-file conceptual linking / relationship synthesis.
- Streaming responses — `/api/repositories/:id/ask` is a single
  blocking request per `architecture.md`'s stated decision.
- In-app quota management or rate limiting for the generation
  provider.
- Full adversarial-prompt hardening beyond the citation-validation
  backstop described above.
