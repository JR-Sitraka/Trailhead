# Feature: Export

**Purpose:** Let an AI coding agent (or a human acting on its behalf)
pull structured, evidence-grounded context out of Trailhead — a
readable summary, a stable machine-readable fact contract, or a
task-scoped evidence packet — instead of the agent having to explore
the repository cold.

**User Story:** As an AI coding agent about to work in an unfamiliar
repository, I want to retrieve either a general repository summary, a
structured fact dump, or evidence specifically relevant to my current
task, so that I can start working with real context instead of
exploring blind.

**Functional Requirements:**
- Three independent formats, each reachable only when the repository
  is "Ready" (parsing **and** embedding both complete, same gate as
  Ask — deliberately not split per format, per the PRD's stated
  consistency reasoning).
- **REPOSITORY_CONTEXT.md:** retrieves evidence scoped to entry-point
  files and their most central symbols (per `architecture.md`'s stated
  heuristic), synthesizes an evidence-grounded prose summary via the
  shared generation abstraction, with the same citation-validation
  discipline as Ask (any citation that doesn't match retrieved
  evidence invalidates that generation attempt). **On generation
  failure or citation-validation failure, degrades to a deterministic,
  template-formatted version of the same facts the JSON export
  exposes** — explicitly labeled via `generatedVia: 'llm' |
  'deterministic-fallback'` in the response. Never hard-fails once
  Ready, since real facts always exist by that point.
- **JSON:** compiles the deterministic schema defined in
  `architecture.md`'s Data Model (repository identity, stack facts,
  entry points, config files, symbol counts by kind, not-analyzed
  list) directly from existing `Repository`/`File`/`Symbol` data. No
  LLM call, no failure mode beyond a generic server error.
- **Task-packet:** takes a free-text task description, runs semantic
  retrieval against the repository's `EmbeddingChunk`s (same
  infrastructure as Ask, purely heuristic ranking, zero LLM calls),
  returns up to **15 ranked results**, each with file path, line
  range, and the actual sliced source content for that range (reusing
  the same content-slicing approach Ask's citations already need).
- Each format's UI section (REPOSITORY_CONTEXT.md, JSON, task-packet)
  is fully independent — generating one doesn't affect or require the
  others, matching the approved screen.
- Both a UI path (Export tab) and a documented API path exist for all
  three formats, sharing the same underlying logic (three sub-
  endpoints under `/export`, per `architecture.md`).

**Non-Functional Requirements:**
- No fixed latency budget invented — same reasoning as every other
  Success Metrics section in this project; observed response times
  during real use feed `testing.md`'s NFR table, not assumed in
  advance.
- REPOSITORY_CONTEXT.md's generation shares Ask's Gemini free-tier
  quota (1,500 req/day) — no in-app enforcement, same accepted-risk
  posture as Ask, now under combined load from two features instead
  of one.

**Inputs:** For REPOSITORY_CONTEXT.md and JSON — none beyond the
repository identifier (implicit from the open workspace). For
task-packet — a free-text task description.

**Outputs:** REPOSITORY_CONTEXT.md (prose + citations + `generatedVia`
flag), JSON (structured facts), task-packet (up to 15 ranked evidence
results with content).

**Business Rules:**
- Export is unreachable below "Ready" — enforced server-side (`409`),
  not just hidden client-side, same pattern as Ask.
- REPOSITORY_CONTEXT.md's deterministic fallback must be **substantively
  equivalent** to the JSON export's facts, not a degraded or partial
  version — the fallback is only a real hedge if it's actually useful,
  not a token gesture. (Flagged in `architecture.md`'s NFR section as
  needing a dedicated test.)
- Task-packet results are raw retrieved evidence, not LLM-synthesized
  claims — there is no citation-validation concept for this format,
  since the results themselves *are* the evidence, not statements
  about it. No fabrication risk exists here the way it does for
  REPOSITORY_CONTEXT.md.
- No export format is cached, versioned, or auto-triggered — every
  request regenerates fresh from current repository state, per the
  PRD's explicit Slice 2a exclusions.
- Task-packet is scoped to exactly one repository per request — no
  cross-repository retrieval, per the PRD's explicit exclusion.

**Validation Rules:**
- Task-packet's `task` field: required; rejected if empty or
  whitespace-only after trimming (`400`). Maximum 1000 characters —
  longer than Ask's 500-character question limit, since a task
  description plausibly needs more room in a multi-line field; revisit
  if real usage suggests otherwise.
- Repository referenced must exist (`404` if not) and must be "Ready"
  (`409` if not).

**Error States:**
- `404` — repository not found (all three formats).
- `409` — repository not yet Ready (all three formats).
- `400` — empty or over-length task description (task-packet only).
- REPOSITORY_CONTEXT.md has **no failure-state UI** in the sense Ask
  has — a failed LLM attempt is invisible to the user, silently
  replaced by the deterministic-fallback content, distinguished only
  by the `generatedVia` field (surfaced in the UI as appropriate, e.g.
  a small muted note, not an error banner — this is a successful
  response, not a failure, even though something upstream didn't work
  as well as it could have).
- JSON and task-packet have no meaningful failure mode beyond a
  generic server error, consistent with being deterministic/heuristic
  and making no external calls.

**Edge Cases:**
- A repository whose entry-point/central-symbol heuristic finds very
  little to retrieve for REPOSITORY_CONTEXT.md (e.g. an unusually
  small or unconventional repo) — not specially handled; the
  deterministic-fallback path is available regardless of the reason
  generation didn't produce a valid grounded summary, whether that
  reason is a provider failure or genuinely thin retrieved evidence.
- Task description that's semantically nonsensical or off-topic
  (analogous to Ask's off-topic case) — **not specially handled for
  task-packet**, unlike Ask. Task-packet has no LLM step to make an
  off-topic judgment; it simply returns whatever's closest by
  similarity, even if that's a weak match. This is a real, accepted
  difference from Ask's behavior, not an oversight — flagging it
  explicitly since it's the kind of gap that's easy to assume was
  "already handled" by analogy to Ask when it wasn't.
- Repository reanalyzed while an export request is in flight — same
  accepted, unhandled gap already named in `ask.md`'s Edge Cases;
  applies identically here, not re-solved per feature.

**Accessibility:** `TaskInput` has an explicit `aria-label` from its
first build (unlike `AskInput`, which needed this added during
review — learned from that gap directly, per `component-specs.md`).
Download/Copy buttons have visible text labels, not icon-only.
**Known, carried-over gap:** full screen-reader behavior of the
inline-citation prose pattern (shared with Ask) remains Unverified.

**Analytics:** None — no analytics requirement exists anywhere in the
PRD, consistent with every other feature in this project.

**Dependencies:**
- `EmbeddingChunk` data (Slice 1's embedding step) for
  REPOSITORY_CONTEXT.md and task-packet.
- `Repository`/`File`/`Symbol` denormalized data (MVP-A) for JSON and
  as the deterministic-fallback source for REPOSITORY_CONTEXT.md.
- The shared generation abstraction and Gemini free-tier quota
  (Slice 1/ADR-004) for REPOSITORY_CONTEXT.md's LLM path specifically.
- Explorer (jump-to-file/line target for task-packet's results and
  REPOSITORY_CONTEXT.md's citations).

**Acceptance Criteria:**
- [ ] Export is unreachable (`409`) against a repository whose status
      is not "Ready."
- [ ] JSON export returns the documented schema, matching the
      repository's actual current `Repository`/`File`/`Symbol` state
      exactly — no invented fields, no `modules` field (per
      `architecture.md`'s explicit rejection of that addition).
- [ ] REPOSITORY_CONTEXT.md's LLM path, when it succeeds, produces a
      summary whose every citation resolves to real, retrieved
      evidence — same groundedness bar as Ask.
- [ ] A simulated generation failure (or a simulated citation-
      validation failure) causes REPOSITORY_CONTEXT.md to return the
      deterministic fallback, labeled `generatedVia:
      'deterministic-fallback'`, **not** a `502` — verified directly,
      not assumed from the architecture doc alone.
- [ ] The deterministic-fallback content is substantively equivalent
      to the JSON export's facts for the same repository — not a
      thinner or partial version.
- [ ] Task-packet returns at most 15 results, ranked, each with a
      real file path/line range that exists in the repository and
      the actual sliced content for that range.
- [ ] Empty or whitespace-only task description rejected with `400`,
      before any retrieval call is made.
- [ ] Task description exceeding 1000 characters rejected with `400`.
- [ ] All three formats are independently generatable — triggering
      one does not require or reset the others, verified via the
      actual UI, not just the API.
- [ ] Both the UI path (Export tab) and the documented API endpoints
      produce identical underlying results for the same repository
      state.

**Out of Scope:**
- Multi-turn chat (Slice 2b).
- Cross-repository task-packets.
- Automatic/triggered export on reanalysis or any other event.
- Caching or version history of past exports.
- MCP server or IDE-plugin integration — files/API responses only.
- Off-topic detection for task-packet (unlike Ask, no LLM step exists
  to make that judgment — a real, stated difference, not an
  oversight).
- Confidence scoring or badges of any kind.
