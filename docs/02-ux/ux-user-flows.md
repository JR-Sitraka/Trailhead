# User Flows — Repository Intelligence Platform (MVP-A + MVP-B Slice 1 + Slice 2a + Slice 2b + Upgrade)

Every flow below traces to `docs/01-product/product-prd.md`'s MVP
Scope (MVP-A, Slice 1, Slice 2a, or Slice 2b, as noted per flow). This
was the final flow set for MVP-B; **the Upgrade phase (2026-07-27)
appends its additions in a dated section at the end of this file —
all MVP-A/MVP-B flows above that section are preserved unchanged.**

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

---

# Upgrade phase additions (2026-07-27)

Trace to `product-prd.md`'s Upgrade Scope. Two of the seven upgrade
items touch UX; both are covered here. The other five deliberately
add nothing to this document — stated explicitly so absence reads as
decided, not overlooked:
- Items 1 (doc-drift), 3 (embedding swap), 7 (testing closeout): no
  user-facing surface change of any kind.
- Item 2 (golden benchmark): **confirmed script/CLI-only, no UI this
  phase** (person's decision, 2026-07-27) — no flow exists by design.
- Item 6 (screen-reader): verification + fixes on existing screens;
  a flow/copy change happens only if a discovered fix forces one, and
  is then handled as spec drift (`principles.md` #3), not pre-planned
  here.

## Flow: View LLM observability (Upgrade item 5)

**Traces to:** PRD Upgrade Scope item 5 — "LLM observability,
lightweight... requests made, failures, provider status. Explicitly
no enforcement, no budgeting."

**Entry point:** Dashboard. The observability panel is a global,
passive element of the Dashboard screen itself — **not** a new tab,
screen, or navigation node (confirmed decision, 2026-07-27; see IA
doc for the recorded reasoning).

**Steps:**
User opens the Dashboard (any normal path — app load or navigating
back from a workspace)
↓
Observability panel renders alongside the repository list, showing:
requests made, failures, and current provider status
↓
User reads it; no interaction is required or offered beyond what the
feature spec defines — this is a glanceable status surface, not a
management console

**End state:** User knows the LLM layer's current health and usage at
a glance. Nothing to configure, nothing to submit.

**Error / edge paths:**
- **Metrics unavailable** (counters can't be read): the panel shows an
  honest unavailable state — it never renders fake zeros or stale
  numbers presented as current. Distinct visual/textual treatment
  from "zero requests made," which is a real, valid value.
- **Provider unreachable/degraded:** provider status reflects it
  plainly. The panel reports state; it does not block, warn-modal, or
  gate any other Dashboard action (no enforcement, per PRD).
- **No LLM request has ever been made:** true zeros shown as true
  zeros — a valid state, not an error.

## State addendum: "Unknown" detection (Upgrade item 4) — no new flow

Item 4 introduces a new honest *state*, not a new flow: framework
(and any similarly heuristic-detected fact) may now render as
**"Unknown"** instead of a confident wrong guess. It amends existing
surfaces:
- **Overview (within the existing Analyze/Overview rendering):** the
  stack section displays "Unknown" as a first-class, honest value —
  visually ordinary, not an error state. Consistent with this
  project's established honest-empty-state precedent (Symbols' empty
  state; Export's deterministic fallback).
- **Export:** JSON represents undetected values with explicit
  unknown semantics (exact field convention: feature spec /
  architecture, not this document); REPOSITORY_CONTEXT.md prose
  states plainly that the framework was not detected rather than
  naming one.
Precise display and data conventions belong to the feature specs and
architecture pass — this addendum records the UX decision: **"Unknown"
is a normal, honest answer everywhere detection results appear.**
