# Technical Architecture — Repository Intelligence Platform (MVP-A + MVP-B Slice 1 + Slice 2a + Slice 2b)

**Pass status:** MVP-A, Slice 1, Slice 2a — full pass (unchanged).
**Slice 2b — full pass, this round.** Reuses ADR-004's stack entirely;
no new ADR needed.

## Stack
*(Unchanged — Slice 2b introduces no new infrastructure, consistent
with Slice 2a's own "zero new tables" finding. Real, notable
consequence of the "Chat = Ask evolved" product decision: there's no
new backend service to build, only an extension of the existing
generation/retrieval flow.)*

## Data Model

**Real, notable finding, consistent with Slice 2a: Slice 2b requires
zero new tables.** Per the locked "no persistence" decision, chat
conversation state is **not stored server-side at all** — it lives
entirely in client-side state (the browser) for the duration of the
tab being open, and is sent in full with every request. The server
never knows a "conversation" exists as a durable concept; each request
is stateless, consistent with the rest of this API (no auth, no
sessions, anywhere).

**Turn representation, sent by the client with every request (a
real, stated shape, not left implicit):**
```
{
  question: string,
  answer: string | null,   -- null for a turn that failed
                            -- (no_evidence/off_topic/generation
                            -- failure) — never a fabricated string
  citations: [{ fileId, path, startLine, endLine }]  -- empty if answer is null
}
```

**Trust boundary, stated explicitly rather than silently accepted:**
since conversation history is client-supplied on every request, a
client could in principle submit fabricated history (fake prior
answers/citations). **Accepted as a low-priority risk** given this
project's existing threat model — no auth, single local operator,
same trust boundary already implicit in every other endpoint. Not
worth building server-side history validation against a source of
truth that doesn't exist (since nothing is persisted server-side to
validate against in the first place).

## API / Interface Contracts

```
POST /api/repositories/:id/chat (renamed from /ask — Slice 2b)
  request: {
    question: string,
    history: [ { question, answer, citations } ]  -- prior turns, per
                                                     -- the shape above;
                                                     -- empty array for
                                                     -- the first turn
                                                     -- (functionally
                                                     -- identical to
                                                     -- Ask's old
                                                     -- single-turn
                                                     -- behavior)
  }
  response: (unchanged shape from Ask) {
    status: 'answered' | 'no_evidence' | 'off_topic',
    answer?: string,
    citations?: [...]
  }
  errors: 400 (empty/over-length question), 404, 409 (not Ready),
          502 (generation call fails)
  -- Retrieval: the embedding query is the current question
     concatenated with the last 1-2 turns' QUESTIONS ONLY (not
     answers) from the supplied history — "heuristic context
     blending," confirmed decision this round. Answer-blending (or a
     citation-only middle ground) was considered and deliberately
     deferred, not built preemptively — documented as a real
     candidate improvement, not a rejected idea, revisit if real
     conversations show questions-only retrieval missing follow-ups
     too often (see Explicitly rejected alternatives below).
  -- Generation: the FULL supplied history (all turns, not windowed)
     is included in the prompt context, regardless of how many turns
     that is — per the locked "full history, every turn" decision.
     This is a different scope than retrieval's blended query above —
     worth being explicit that these are two separate mechanisms with
     different scopes, not the same blending applied twice.
  -- Citation validation: applied per-turn, using that turn's own
     freshly-retrieved evidence — unchanged rule from Ask, no
     cross-turn validation logic needed.
```

**Naming note:** `/api/repositories/:id/ask` is renamed to `/chat`,
matching the tab rename — since nothing has been implemented yet,
there's no real migration concern; this is a clean rename, not a
versioned/deprecated-alongside-new-endpoint situation.

## System-wide Non-Functional Requirements

*(Prior NFRs unchanged.)* **Slice 2b addition:** the shared Gemini
quota risk (already flagged in Slice 2a) sharpens further here — a
single active chat session could consume several generation requests
in quick succession (one per turn), on top of whatever Export/Ask-as-
first-turn usage is also happening. Still no in-app enforcement,
consistent with the accepted-risk posture already on record — but
worth measuring directly once real implementation and real
conversations exist, more urgently than before.

## Explicitly rejected alternatives

*(Prior rejections unchanged.)*

**Slice 2b:**
- **Server-side conversation persistence/sessions** (a new table, a
  session concept). Rejected — no product requirement calls for it
  (PRD's explicit "no persistence" exclusion), and it would be the
  first stateful, persisted feature in a project that's been
  consistently ephemeral-by-default everywhere else (Ask, Export).
- **A separate `/chat` endpoint alongside a still-existing `/ask`.**
  Rejected — the product decision was explicit that Chat evolves Ask,
  not duplicates it; the architecture should mirror that exactly, not
  introduce two endpoints doing near-identical jobs.
- **LLM-based query rewriting for retrieval context.** Rejected —
  doubles LLM calls per turn against an already-strained shared quota,
  for a benefit not yet demonstrated as necessary.
- **Blending prior answers (or their citations) into the retrieval
  query.** Considered directly, real merit acknowledged (the
  "verifySession"/"PaymentsRepository" example specifically requires
  answer content, not just question content, to retrieve precisely) —
  but deliberately deferred, not built now, since embedding cost isn't
  the real constraint here (retrieval is free/local) and the actual
  constraint is unproven query-noise risk versus a real, working
  simpler default. A genuine candidate for revisiting with real
  evidence, not a rejected idea.
- **Server-side validation of client-supplied conversation history
  against a source of truth.** Rejected — no source of truth exists to
  validate against, since nothing is persisted server-side; accepted
  as a low-priority trust-boundary gap consistent with this project's
  existing no-auth threat model.
