# Product Requirements — Trailhead (MVP-A + MVP-B + Upgrade Phase)

**Naming note (2026-07-19):** the product is named **Trailhead**.

**Upgrade-phase note (2026-07-27):** MVP-A and MVP-B shipped and were
publicly released. This document now carries a third phase section —
**the Trailhead Upgrade** — appended below the MVP-B sections, which
are preserved unchanged as history.

**Provider-drift correction (2026-07-27, principles.md #3):** the
MVP-B sections below reference **Gemini (1,500 req/day)** as the
generation provider. Implementation switched to **Groq
(`llama-3.3-70b-versatile`, free tier)** mid-build — the shipped
system runs Groq. The historical text is preserved as written;
Upgrade item 1 sweeps every active doc (this file's Upgrade section,
`architecture.md`, `testing.md`'s NFR row, feature specs) to state
the Groq reality and its actual rate-limit shape.

**MVP-B re-scoping note (2026-07-20):** MVP-B is built on a shared
evidence/summary core, consumed by two front doors (human UI, agent
export), and sliced:
1. **Slice 1** (complete): the shared core + single-turn Ask.
2. **Slice 2a** (complete): agent context export — three formats
   (REPOSITORY_CONTEXT.md, JSON, task-packet).
3. **Slice 2b** (complete): **multi-turn chat** — the final piece of
   MVP-B.

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

**MVP-B is complete** — every capability originally scoped for this
phase (shared core, Ask/Chat, semantic search, LLM summaries, agent
context export) went through the full planning arc and shipped.

---

# Upgrade Phase (2026-07-27) — decided via Layer 1 scope interview

**What this phase is:** the first post-release phase on the shipped
Trailhead codebase — closing the quality and verification debt the
implementation retrospective, `testing.md`, and the public README
surfaced honestly, plus one new capability (the golden benchmark
suite) that makes those improvements measurable. Project 2 on the
Starter Kit (now V4.2, ADR-007), same codebase — a continuation, not
a new product.

## Target User
Unchanged from MVP-A/MVP-B. This phase adds no new persona; it makes
the existing product more trustworthy for the same users.

## Problem Statement
The shipped product has three documented, real quality gaps — the
embedding model's lack of code-semantic understanding (retrospective
finding #12, stated in the public README), framework misdetection
producing confident wrong answers (finding #7), and untested
screen-reader output — plus verification debt (open `testing.md`
rows) and doc drift (Gemini vs. shipped Groq). Improvements to
retrieval and analysis are currently evaluated by subjective
impression; nothing objective guards against regressions.

## Upgrade Scope — seven items, priority order confirmed

1. **Doc-drift fix (Gemini → Groq).** Every active document stating
   Gemini/1,500-req-day is updated to the shipped Groq reality
   (`llama-3.3-70b-versatile`, free tier), with the quota constraint
   restated against Groq's actual rate-limit shape. Done = no active
   doc describes a provider the system doesn't use.
2. **Golden benchmark suite (new capability).** A fixed benchmark:
   the existing 5-repository corpus plus a curated, representative
   query set with human-verified ground truth. Core metrics:
   **Top-1/Top-3 retrieval accuracy, framework detection accuracy,
   symbol resolution accuracy.** Runnable after every retrieval or
   analysis change. **Sequencing requirement:** the baseline is
   captured on the current model (`Xenova/all-MiniLM-L6-v2`) *before*
   item 3's swap — otherwise item 3's "outperforms previous model"
   criterion is unverifiable. The honest cost is ground-truth
   labeling: a human decides the right answers per query.
3. **Embedding model swap.** Research pass first (candidate must fit
   the unchanged constraints: zero-spend, local, transformers.js-
   compatible), then re-embedding of every existing repository, then
   re-verification. Done = against the item-2 benchmark: known code
   questions retrieve relevant implementation files in Top-3;
   filename references no longer systematically outrank
   implementation; semantic questions outperform the previous model;
   no measurable regression on documentation retrieval.
4. **Framework misdetection fix.** Done = detection no longer
   produces confident wrong answers; **"unknown" becomes an allowed,
   honest output** — a real spec change flowing into Overview and
   Export display, measured by item 2's framework-detection metric.
5. **LLM observability, lightweight.** Visibility only: requests
   made, failures, provider status. **Explicitly no enforcement, no
   budgeting** — observability first, per the same
   evidence-before-complexity pattern as Chat's context-blending
   decision.
6. **Screen-reader accessibility.** A real NVDA or VoiceOver pass
   covering the specific unverified items in `testing.md` (aria-live
   on Search/Symbols/Chat loading states, heading structure,
   dynamic-update announcement timing); discovered issues fixed;
   remaining limitations documented honestly in `testing.md` and the
   README.
7. **Testing closeout.** IMPORT-04 (real multi-branch detection),
   PREPROC-03's exact 500MB unpacked-size boundary, and closing the
   remaining planning-era Dashboard/Explorer rows with real evidence
   where the functionality already shipped.

## Explicitly Out of Scope (this phase)

- **Quota enforcement or budgeting** — item 5 is visibility only.
- **Authentication** — explicitly deferred to **V2 or V3** (person's
  decision, 2026-07-27). The README's single-operator/local-use
  posture holds.
- **Blueprint V1 items** (structural graphs, impact analysis) —
  still non-binding; a future planning phase, not this one.
- **Benchmark performance metrics** — analysis runtime, indexing
  runtime, memory usage: **deferred to V1 scope, explicitly carried
  forward, not dropped** (person's decision, 2026-07-27). They need
  a controlled measurement harness (cold-start/variance handling)
  and nothing in this phase deliberately changes them; adding them
  to the existing benchmark later is cheap.
- **Carried Group C items, all confirmed out** (no real-usage
  evidence has triggered any): corrupt-ZIP string-matching
  fragility, AnalysisJob ordering for Reanalyze, codeload.github.com
  rate limit, embedding cross-call non-determinism, hover-modifier
  visual confirmation, questions-only context-blending revisit.
- Conversation persistence; LLM query rewriting (both unchanged from
  MVP-B's exclusions).

## Business Goals
Co-equal, continuing both prior phases' framing: (a) **kit
validation, round 2** — first upgrade-type phase, first real kit
update-propagation event (ADR-007), same-codebase-continuation
qualifier on all promotion findings; (b) **product trust** — the
retrieval/detection improvements convert the README's honest
limitations into closed items, with objective evidence.

## Constraints
Zero-spend, local, transformers.js — unchanged and binding on the
embedding-model research. Groq free tier is the generation
constraint (actual limits documented via item 1). Free-tier chat
quota remains project budget: interviews and reviews stay batched.

## Success Metrics
- Item 2's benchmark exists, is scripted/repeatable, and has a
  recorded pre-swap baseline.
- Items 3 and 4 measured against that benchmark per their stated
  criteria — objective numbers, not impressions.
- Item 6: every named unverified screen-reader item gets a real
  pass/fail; zero silently-dropped gaps.
- Item 7: the named `testing.md` rows move to honest tiers with real
  evidence.
- No numeric targets invented before real baseline data exists —
  the same discipline every prior Success Metrics section held.
