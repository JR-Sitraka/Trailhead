# User Flows — Repository Intelligence Platform (MVP-A + MVP-B Slice 1 + Slice 2a + Slice 2b)

Every flow below traces to `docs/01-product/product-prd.md`'s MVP
Scope (MVP-A, Slice 1, Slice 2a, or Slice 2b, as noted per flow). This
is the final flow set for MVP-B — once Slice 2b's planning arc
completes, MVP-B as a whole is done.

---

## Flow: Import repository
*(unchanged — see prior rounds)*

## Flow: Analyze repository
*(unchanged from Slice 1 — see prior rounds)*

## Flow: Explore repository
*(unchanged — see prior rounds)*

## Flow: Search repository
*(unchanged from Slice 1 — see prior rounds)*

## Flow: Chat with repository (MVP-B Slice 2b — supersedes "Ask repository")

**Traces to:** PRD MVP Scope (MVP-B Slice 2b) — "Chat is not a new,
separate surface... Ask evolves into Chat"

**Superseding note:** this flow replaces the prior "Ask repository"
flow (Slice 1). It is not a new, parallel flow — the single-turn
behavior described below is Chat's *first* turn, not a separate
feature. Anywhere this project's docs still say "Ask" as a screen/tab
name, that's the pre-Slice-2b name, now "Chat."

**Entry point:** Repository workspace navigation, "Chat" tab (renamed
from "Ask"), within an open, "Ready" repository (same full-Ready gate
as before — unchanged).

**Steps:**
```
User types a question into the input (first turn)
↓
System runs semantic retrieval over the repository's embedded content
↓
System synthesizes an answer from retrieved evidence, with citations
↓
Answer is displayed as the first message in the conversation thread
↓
User types a follow-up question (second+ turn)
↓
Retrieval query = current question + last 1-2 turns, heuristically
blended (not the raw follow-up text alone) — so a question like "what
about the tests?" still retrieves relevant evidence even though it
doesn't restate the subject from the prior turn
↓
Generation call includes the FULL conversation history so far (not
windowed), so the model can reference anything said earlier
↓
New answer is appended to the thread as the next message
↓
Cycle repeats for each new turn
↓
At any point, user may click "New conversation" to reset the thread
entirely — this is the only way to reset without navigating away
```

**End state:** An ongoing conversation thread, any length, each turn
grounded and citable — or a freshly reset, empty thread after "New
conversation." No conversation is ever saved: reloading the page or
navigating away resets it the same way "New conversation" does,
without asking.

**Error / edge paths:**
- **No relevant evidence found** or **off-topic question**, on any
  turn — that specific turn shows the same no-evidence/off-topic
  treatment Ask always had, rendered as that turn's message within the
  thread, not as a whole-screen state. **The conversation continues**
  — this is a per-turn outcome, not a thread-ending one.
- **Generation call fails** (quota/timeout/provider error), on any
  turn — same failure treatment as before, rendered as that turn's
  message. **The conversation continues.** The failed turn's question
  stays in the history sent to future turns; no fabricated answer for
  that turn is ever included.
- **Citation fails validation**, on any turn — same "discard, treat as
  no-evidence" rule as Ask always had, now explicitly scoped to that
  turn only, not the whole conversation. Confirmed decision (Slice
  2b): a validation failure on turn 5 does not invalidate turns 1-4.
- Repository status changes mid-conversation (e.g., a reanalysis is
  triggered from another tab while a chat is active) — **not
  specifically handled**, same accepted, unhandled gap already named
  for Ask in `ask.md`'s Edge Cases; carries forward unchanged, not
  re-solved for the multi-turn case.

---

## Flow: Export agent context
*(unchanged from Slice 2a — see prior round)*

## Flow: Reanalyze repository (manual)
*(unchanged — see prior rounds)*

## Flow: Delete repository
*(unchanged — see prior rounds)*

---

(This is the complete flow set for MVP-A + all of MVP-B. Once Slice
2b's remaining layers — design/screens/architecture/features/testing —
are done, MVP-B is complete.)
