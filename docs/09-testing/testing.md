# Test Plan — Trailhead (MVP-A + MVP-B Slice 1 + Slice 2a + Slice 2b)

Per `docs/09-testing/testing.template.md`: status uses the four
verification tiers from `playbooks/verification-tiers.md`.

**Read this before the tables below:** MVP-A screens are UI prototypes
with real click-through evidence for interaction patterns
("Partially verified"). **Ask/Chat and Export are static visual
references, not interactive prototypes** — zero UI-interaction-pattern
evidence to even partially credit. Every Ask/Chat and Export
acceptance criterion is **Not yet tested**, a genuinely weaker starting
point than MVP-A's rows, stated explicitly throughout.

---

## Feature: Repository Import / Safe Preprocessing / Repository Dashboard / Repository Overview / File Explorer / Symbols / Search
*(all unchanged — see prior rounds)*

## Feature: Ask / Chat (MVP-B Slice 1 + 2b — combined, since Chat supersedes Ask)

`ASK-01` through `ASK-10` (Slice 1, first-turn behavior) remain the
baseline — Chat's first turn is required to behave identically to
those criteria, not re-tested from scratch. The rows below are
**additive**, covering only what's genuinely new in multi-turn
behavior.

| Acceptance criterion | Test | Type | Status |
|---|---|---|---|
| Chat is unreachable (`409`) against a repository whose status is not "Ready" | CHAT-01 | Automated | Not yet tested — same check as `ASK-01`, re-verified under the renamed `/chat` endpoint |
| A fresh conversation's first turn (empty history) satisfies all of `ASK-01` through `ASK-10` unchanged | CHAT-02 | Automated | Not yet tested — confirms the "Chat = Ask evolved" architecture actually holds, not just documented intent |
| A follow-up turn's retrieval query is built from the current question plus the prior 1-2 turns' **questions only**, not answers/citations | CHAT-03 | Automated | Not yet tested — needs a test that can distinguish "questions-only" from "questions+answers" blending, e.g. by controlling what's retrievable only via answer-content and confirming it's NOT found via a pure follow-up |
| A follow-up turn's generation call includes the **full** prior history, not just the blended retrieval query | CHAT-04 | Automated | Not yet tested — must verify this as a mechanism distinct from `CHAT-03`, not conflated with it |
| A citation-validation failure on turn N discards only that turn's answer (`no_evidence`); turns 1 through N-1 remain fully intact and unaffected | CHAT-05 | Automated | Not yet tested — **deliberate failure-path test, per `playbooks/failure-path-testing.md`**, the multi-turn analog of `ASK-03`/`EXPORT-04`: this is the concrete proof that "turn-level failure independence" actually holds in code, not just in the spec. Also confirm real recovery — turn N+1 succeeds normally afterward |
| The failed turn's question is present in history sent to turn N+1's generation call; its `answer` field is `null`, never a fabricated string | CHAT-06 | Automated | Not yet tested — a precise assertion on the actual payload sent to the generation call, not just the user-visible outcome |
| "New conversation" clears the thread and resets to an empty history | CHAT-07 | Manual | Not yet tested — cannot be even partially credited from the static mock |
| Reloading the page or navigating away and back **loses the conversation entirely** — confirmed as correct behavior | CHAT-08 | Manual | Not yet tested — note the inverted pass condition: history *surviving* a reload would indicate accidental persistence and should **fail** this criterion, not pass it |
| Malformed `history` payload (wrong shape) is rejected with `400` before any retrieval or generation call is made | CHAT-09 | Automated | Not yet tested |
| Empty or over-500-character question rejected with `400` | CHAT-10 | Automated | Not yet tested — same limit as `ASK-07`/`ASK-08`, re-verified under `/chat` |

## Feature: Export (MVP-B Slice 2a)
*(unchanged — see prior round, `EXPORT-01` through `EXPORT-10`)*

---

## NFR verification

*(All prior rows unchanged.)*

| Budget (from architecture.md) | Measured value | Status |
|---|---|---|
| Shared Gemini free-tier quota (1,500 req/day) under combined Ask/Chat + Export load, specifically accounting for chat's multi-request-per-session pattern (MVP-B Slice 2b) | — | Not yet tested — this is now the most urgent unmeasured risk in the whole project: a single active conversation can consume several requests in quick succession, on top of Export's own usage, against a quota with no in-app enforcement anywhere |

## Known coverage gaps

*(All prior gaps unchanged.)*

- **`CHAT-05` is the real proof of Slice 2b's central design decision**
  (turn-level failure independence), same relationship `EXPORT-04` has
  to Slice 2a's deterministic-fallback decision — not routine coverage.
- **Questions-only context blending (`CHAT-03`) is a real, open
  question, not a settled fact** — `architecture.md` and `chat.md` both
  name this as a deliberate default that could underperform on
  answer-dependent follow-ups; real conversation data, not this test
  plan, is what will actually settle whether it needs revisiting.
- **The shared Gemini quota risk is now the single most pressing
  unmeasured NFR across the entire project** — three features (Ask/
  Chat, Export's REPOSITORY_CONTEXT.md, and now chat's per-turn
  pattern specifically) all draw from the same 1,500 req/day budget
  with zero in-app enforcement. Worth genuinely prioritizing once
  implementation begins, not treated as one line among many.
