# Feature: Chat

**Purpose:** Let a developer have a sustained, natural conversation
about a repository — ask a question, then follow up — instead of
resetting to a blank slate after every single exchange. Supersedes
Ask (Slice 1); not a new, separate capability.

**User Story:** As a developer exploring an unfamiliar or half-
forgotten repository, I want to ask a question and then naturally
follow up on the answer, so that I can dig into a topic
conversationally instead of re-establishing context with every new
question.

**Functional Requirements:**
- Single conversation thread per repository workspace visit — no
  concept of multiple named/saved conversations.
- Each turn: user submits a question, system retrieves evidence,
  synthesizes an answer (or returns `no_evidence`/`off_topic`), and
  appends the result to the thread. Same retrieval/generation/
  citation-validation mechanism Ask always used — Chat is that
  mechanism, extended, not replaced.
- **Retrieval query per turn** = the current question concatenated
  with the last 1-2 turns' **questions only** (not answers or
  citations) — heuristic context blending, confirmed decision. This is
  a deliberately simple default; blending answer content was
  considered and has real merit for certain follow-ups, but was
  deferred pending real evidence it's needed (`architecture.md`'s
  Explicitly Rejected Alternatives).
- **Generation per turn** includes the **full conversation history**
  supplied by the client (all turns, unwindowed) as context — a
  different, wider scope than retrieval's blended query above; these
  are two independent mechanisms, not the same blending applied twice.
- **Citation validation is per-turn**, using that turn's own freshly-
  retrieved evidence. A citation that doesn't validate discards that
  turn's answer only — the turn becomes `no_evidence`, the conversation
  continues, and no fabricated content is ever added to history.
- **Conversation state is entirely client-side.** The client sends the
  full turn history with every request; the server stores nothing
  between requests. Reloading the page or navigating away loses the
  conversation — this is the intended behavior (per PRD's "no
  persistence" decision), not a bug to fix later.
- **Explicit "New conversation" action** clears the client-side history
  and resets the thread, without requiring navigation away from the
  tab.

**Non-Functional Requirements:**
- No fixed latency budget invented, same reasoning as every other
  feature in this project.
- Shared Gemini quota (1,500 req/day) now serves Ask-as-first-turn,
  every subsequent chat turn, AND Export's REPOSITORY_CONTEXT.md — a
  single active conversation can consume multiple requests in quick
  succession. No in-app enforcement; flagged as increasingly urgent to
  measure once real implementation exists.

**Inputs:** A question (string) plus the client-maintained history
array (prior turns, each with question/answer/citations, per
`architecture.md`'s stated shape).

**Outputs:** One of: a validated answer with citations, `no_evidence`,
or `off_topic` — appended to the thread as the newest turn.

**Business Rules:**
- Chat is unreachable below repository "Ready" status — same gate as
  Ask always had, enforced server-side.
- Every citation in every turn must correspond to that turn's actually-
  retrieved evidence — no exceptions, no cross-turn citation reuse
  without fresh validation.
- A turn's failure (no-evidence, off-topic, or generation failure)
  never invalidates or restyles earlier, already-answered turns.
- Client-supplied history is **not validated against any server-side
  source of truth** — none exists, since nothing is persisted. Accepted
  low-priority trust-boundary gap, consistent with this project's
  existing no-auth, single-operator threat model.
- History size is **unbounded by design** — no artificial cap on
  conversation length, consistent with the "full history, revisit only
  with real evidence of a problem" decision. Not a gap; a deliberate
  choice not to invent a limit without data.

**Validation Rules:**
- `question`: required, non-empty after trim, maximum 500 characters —
  same limit as Ask always had (`400` if violated).
- `history`: must be a well-formed array matching the documented shape
  (each entry has `question`, `answer` which is either a string or
  `null`, and `citations` which is an array) — malformed shape is
  rejected with `400`. This is a structural check only, distinct from
  the deliberately-not-done content-authenticity check noted above —
  malformed JSON and fabricated-but-well-formed content are different
  problems, and only the former is validated.
- Repository must exist (`404` if not) and be "Ready" (`409` if not).

**Error States:**
- `400` — empty/over-length question, or malformed `history` shape.
- `404` — repository not found.
- `409` — repository not yet Ready.
- `502` — generation call fails (quota/timeout/provider error) for the
  current turn specifically — rendered as that turn's Generation-failed
  state; earlier turns are unaffected.
- `no_evidence` / `off_topic` (200, not errors) — rendered as that
  turn's respective state; conversation continues.

**Edge Cases:**
- First turn of a fresh conversation (empty `history` array) — behaves
  identically to Ask's original single-turn behavior. Not a special
  case in the implementation, just the natural base case of an empty
  history.
- A follow-up question that only makes sense given a prior *answer's*
  specific content (e.g., referencing a symbol name the answer
  introduced but the question never restates) — **acknowledged as the
  scenario questions-only blending may underperform on.** Not solved in
  this slice; a real, named candidate for future improvement, not a
  silent gap.
- Repository reanalyzed mid-conversation — same accepted, unhandled gap
  already named for Ask, now applying to every turn rather than a
  single question.
- Very long conversation (many turns) — no artificial limit; real
  behavior (latency, prompt size, quota consumption) should be observed
  under actual use rather than assumed fine or capped preemptively.

**Accessibility:** Reuses `AskInput`'s (now `ChatInput`) existing
`aria-label` pattern. `UserQuestion` items are plain text, no
additional ARIA needed (consistent with this project's existing
precedent for static text content). **Known, carried-over gap:** full
screen-reader behavior of the thread — including how multiple turns
and inline citations are announced in sequence — is Unverified, a
superset of the same gap already flagged for Ask.

**Analytics:** None — consistent with every other feature in this
project.

**Dependencies:**
- Everything Ask depended on (`EmbeddingChunk`, the shared generation
  abstraction, Gemini quota).
- Explorer (citation jump-to-file/line target).
- No new dependencies beyond what Ask already required — a direct
  consequence of "zero new schema, zero new infrastructure."

**Acceptance Criteria:**
- [ ] Chat is unreachable (`409`) against a repository whose status is
      not "Ready."
- [ ] A fresh conversation's first turn (empty history) behaves
      identically to Ask's original single-turn acceptance criteria
      (groundedness, citation validation, etc. — see the equivalent
      `ASK-*` criteria this feature inherits).
- [ ] A follow-up turn's retrieval query is built from the current
      question plus the prior 1-2 turns' questions only — verified
      directly, not assumed from the architecture doc.
- [ ] A follow-up turn's generation call includes the full prior
      history, not just the blended retrieval query — verified as a
      distinct mechanism from the above, not conflated with it.
- [ ] A citation-validation failure on turn N discards only that turn's
      answer (`no_evidence`), leaving turns 1 through N-1 fully intact
      and unaffected.
- [ ] The failed turn's question is present in history sent to turn
      N+1's generation call; its `answer` field is `null`, never a
      fabricated string.
- [ ] "New conversation" clears the thread and resets to an empty
      history — verified via the actual UI, not just the API contract.
- [ ] Reloading the page or navigating away and back loses the
      conversation entirely — this is confirmed as *correct* behavior,
      not a bug, per the acceptance bar (the opposite result — history
      surviving a reload — would indicate accidental persistence
      somewhere and should fail this criterion).
- [ ] Malformed `history` payload (wrong shape) is rejected with `400`
      before any retrieval or generation call is made.
- [ ] Empty or over-500-character question rejected with `400`.

**Out of Scope:**
- Conversation persistence of any kind.
- LLM-based query rewriting for retrieval.
- Answer/citation-based context blending (deferred, documented as a
  real candidate — see `architecture.md`).
- Conversation branching, editing, or deleting individual turns.
- Multiple concurrent/named conversations.
- Cross-repository conversations.
- Server-side validation of client-supplied history against a source
  of truth.
