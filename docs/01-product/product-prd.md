# Product Requirements — Trailhead (MVP-A + MVP-B Slice 1 + Slice 2a + Slice 2b)

**Naming note (2026-07-19):** the product is named **Trailhead**.

**MVP-B re-scoping note (2026-07-20):** MVP-B is built on a shared
evidence/summary core, consumed by two front doors (human UI, agent
export), and sliced:
1. **Slice 1** (complete): the shared core + single-turn Ask.
2. **Slice 2a** (complete): agent context export — three formats
   (REPOSITORY_CONTEXT.md, JSON, task-packet).
3. **Slice 2b** (specified below, new this round): **multi-turn
   chat** — the final piece of MVP-B. Once this slice's full planning
   arc (UX through testing) is done, MVP-B as a whole is complete.

## Target User
Two equally-weighted human personas (unchanged). Slice 1 added
"asks a direct question, gets a grounded answer." **Slice 2b extends
this to sustained, multi-turn conversation** — the same job-to-be-done,
now supporting natural follow-ups instead of one question at a time.

## Problem Statement
*(MVP-A and Slice 1 hypotheses unchanged.)* **Slice 2b tests whether
sustained conversation** — not just one grounded answer, but a natural
back-and-forth — further reduces repository-understanding cost beyond
what single-turn Ask already provides. This directly extends Slice 1's
own hypothesis rather than introducing an unrelated one.

## MVP Scope (MVP-B Slice 2b — "chat")

**Chat is not a new, separate surface.** Per this round's explicit
decision: **Ask evolves into Chat** — same tab (renamed "Chat," was
"Ask"), same underlying interaction pattern, now supporting follow-up
turns instead of resetting after one question. There is no separate
"Chat" tab alongside a still-single-turn "Ask."

- **Conversation history:** full history sent to every generation
  call, not windowed. Deliberately not fixed to an arbitrary turn
  count — Gemini's free tier is request-count-limited (1,500/day), not
  token-metered, so full history doesn't proportionally cost more
  against the actual constraint. Revisit only if real usage shows a
  real problem, not fixed preemptively.
- **Retrieval for follow-up questions:** heuristic context blending —
  the current question is concatenated with the last 1-2 turns before
  running semantic retrieval, so follow-ups like "what about the
  tests?" (which don't restate the subject from a prior turn) still
  retrieve relevant evidence. **No LLM query rewriting** — deliberately
  avoided to prevent doubling LLM calls per turn against the shared
  Gemini quota (Ask, Export's REPOSITORY_CONTEXT.md, and now Chat all
  draw from the same 1,500 req/day budget).
- **Turn-level failure handling:** if a citation fails validation on
  any turn, **that turn fails independently** — same no-evidence/
  failed treatment as Ask's existing states — but the conversation
  continues. Prior turns remain intact. The failed turn's question
  stays in the history sent to future turns; no fabricated or
  unvalidated answer is ever carried forward as if it were real.
  Directly consistent with Slice 2a's REPOSITORY_CONTEXT.md decision
  ("never lose more than what actually failed") — same principle,
  applied at the conversation-turn level instead of the export-format
  level.
- **No persistence.** Conversation state is in-memory only for the
  duration of viewing the tab — resets on reload or navigating away.
  This is a real, accepted UX cost (losing a long conversation to an
  accidental reload is a bigger loss than losing one Ask question),
  not a costless choice — but it keeps this project's unbroken pattern
  of ephemeral, stateless-by-default design (Ask: no persistence;
  Export: explicitly no caching/versioning) intact, rather than
  introducing the first genuinely persisted, stateful feature in the
  whole project without a stated requirement for it.
- **Explicit "New conversation" action** — a dedicated button lets the
  user deliberately reset without navigating away from the tab; reset
  isn't only available via an indirect gesture like a page reload.

## Explicitly Out of Scope

**MVP-B Slice 2b explicitly excludes:**
- Conversation persistence of any kind — no history survives a reload,
  no server-side storage of past conversations.
- LLM-based query rewriting for retrieval — heuristic context blending
  only, per the explicit tradeoff decision above.
- Conversation branching, editing, or deleting individual past turns.
- Multiple concurrent/named conversations per repository — one active
  conversation at a time, reset via "New conversation."
- Cross-repository conversations — scoped to one repository, same as
  every other feature in this project.

**Deferred to V1–V3:** unchanged.

## Business Goals
*(Unchanged — the same co-equal framing from Slice 1/2a: kit
validation AND proving the LLM layer earns its cost. Slice 2b doesn't
introduce a new goal; it's the completion of MVP-B's human-facing side,
mirroring Slice 2a's completion of the agent-facing side.)*

## Constraints
*(All prior constraints unchanged.)* **Slice 2b addition:** Chat's
per-turn generation call reuses the exact same abstraction and shared
1,500 req/day quota as Ask and Export's REPOSITORY_CONTEXT.md — a
multi-turn conversation now means a single user session could
plausibly consume several requests against that shared daily budget in
quick succession (one per turn). This sharpens, rather than
introduces, the already-flagged shared-quota risk — worth measuring
directly once real implementation exists, per the NFR note this
project has carried since Slice 2a.

## Success Metrics

**MVP-B Slice 2b:** extends Slice 1's groundedness metric to the
conversational setting — **zero unsupported claims across sampled
turns**, not just sampled single-turn answers, using the same 5-repo
corpus. No new metric invented; this is the same bar Ask already had
to clear, now verified to hold across a sustained conversation, not
just in isolation. As with every other Success Metrics section in this
document: no numeric sample-size target is invented before real data
exists.

**Once Slice 2b's full planning is complete, MVP-B as a whole is
complete** — every capability originally scoped for this phase
(shared core, Ask/Chat, semantic search, LLM summaries, agent context
export) will have gone through the full planning arc.
