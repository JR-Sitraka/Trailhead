# Project Retrospective — Trailhead MVP-A

Compiled at MVP-A's close, per `ADR-001`'s explicit commitment to
evaluate Starter Kit V4.1 against blueprint §22's criteria at exactly
this checkpoint, and per `RETROSPECTIVE.template.md`'s own guidance
that a session-bounded closure point (this project's MVP-A/MVP-B
split is a real one, not just a milestone) is a legitimate compile
point.

## 1. What was actually built

All 9 planning layers for MVP-A: PRD, UX flows, IA, design language/
tokens (provisional), 5 screens (Dashboard/Overview/Explorer/Symbols/
Search) built and iterated in Magic Patterns, 7 formalized shared
components, a full architecture pass (Data Model + API Contracts),
7 feature specs, and a test plan. Zero implementation code exists —
MVP-A is planning-complete, not built. This diverges from what a
"finished MVP" might imply in other contexts; explicitly not
misrepresented as more than it is anywhere in this session's own
records (see `testing.md`'s upfront honesty note).

Real divergence from the original plan: MVP-A itself was a recut of
blueprint-MVP (agent-context export moved from MVP-A to MVP-B mid-
interview, changing the whole evaluation approach from agent-facing
to human-facing for this phase — `product-prd.md`'s own history).
Within MVP-A, the tool-comparison exercise (Magic Patterns vs. V0 vs.
arena.ai) was not originally planned as part of Layer 6 — it emerged
from the person's own interest in comparing tools, and the kit's
`visualization-prompting.md` had no existing guidance for a multi-tool
comparison methodology, so one was improvised (see section 5).

## 2. `testing.md` final tally

Pulled directly from `docs/09-testing/testing.md`, not re-derived:
~30 acceptance criteria across 7 features. **Zero rows are genuinely
"done"** — the tiers used were Partially verified (UI-interaction-
pattern evidence from Magic Patterns prototypes, ~12 rows), Not yet
tested (real backend/logic never exercised, ~16 rows), and
Code-reviewed only (1 row — the search result cap, present in source
but never actually triggered even in prototype form). One genuine
spec mismatch was caught in the process, not just an untested item:
Symbols' kind filtering is client-side in the mock but the real spec
requires server-side filtering — different mechanism, not just a
different environment, so the mock's "working" filter validates
nothing about the real requirement.

## 3. Every real bug or gap found, and what actually caught it

Numbered, chronological, specific:

1. **Dashboard's table header and rows silently misaligned** despite
   identical-looking Tailwind grid classes. Root cause: CSS Grid
   auto-sizes columns per grid container independently — two separate
   grids with `auto` columns never share widths even with matching
   template syntax. **Caught by:** the person's direct visual
   inspection of a screenshot. No automated check would have caught
   this — the classes really did look identical.
2. **arena.ai's UI copy claimed automatic re-analysis on new commits**
   — a capability explicitly excluded from MVP-A's PRD scope. **Caught
   by:** the mechanical `design-review` compliance pass (checking UI
   copy against the PRD's stated exclusions), not a functional test —
   this was the single most significant finding across the whole tool
   comparison, and it was a documentation/compliance catch, not a bug
   in the conventional sense.
3. **arena.ai's Delete button was a dead click** — no confirmation, no
   deletion, nothing. **Caught by:** the person directly testing the
   live prototype by hand. A static screenshot review (which is what
   most of the comparison initially relied on) could not have caught
   this — it required real interaction.
4. **arena.ai's status filter chips were non-functional**, and
   separately had a taxonomy mismatch (missing a "Queued" option,
   "In progress" vs. "Analyzing" label inconsistency). **Caught by:**
   same as #3 — direct manual testing, not visual review.
5. **Magic Patterns' AI-generation path (`send_prompt`) hit a hard
   credits limit** mid-session, with no advance warning. **Caught by:**
   an actual failed tool call. Worked around via direct code-first
   editing (`write_artifact_files`), a fallback the kit had no
   existing guidance for.
6. **Symbols' zero-symbols empty state existed in code but was
   structurally unreachable** given the mock's fixed populated data.
   **Caught by:** Claude's own compliance self-review honestly marking
   this Unverified rather than assuming Pass because the code path
   existed — the verification-tiers discipline working exactly as
   designed.
7. **Search's equivalent zero-results state was deliberately built to
   be genuinely reachable**, directly applying the lesson from #6.
   **Caught by:** carrying a finding forward from one screen's review
   into the next screen's brief, before it was built rather than
   after.
8. **Two of `component-specs.md`'s three documented "real
   inconsistencies" turned out to be false** on re-verification
   against actual source during the final polish pass (ListRow's
   claimed padding difference; Symbols/Search's claimed empty-state
   drift). **Caught by:** the polish pass's own discipline of
   re-checking real source before "fixing" anything, rather than
   trusting an earlier written claim. This is arguably the most
   structurally interesting finding in this whole list — see section
   5's promotion candidate on it.
9. **Extracted imports/exports (in PRD scope) had no display surface
   anywhere in MVP-A** — a real product gap. **Caught by:** the act of
   writing `docs/08-features/symbols.md`, not by any test or review of
   existing work — the spec-writing process itself surfaced something
   no click-through of the existing screens would have revealed, since
   the gap was an absence, not a defect.
10. **Search's unbounded result set and Dashboard's stuck-job-with-no-
    timeout** were both similarly caught while writing feature specs,
    not via testing — same pattern as #9.
11. **Symbols' server-side-required vs. client-side-built filtering**
    mismatch — caught while writing `testing.md`, the third instance
    of documentation-writing itself being the discovery mechanism, not
    a dedicated review pass.

**Pattern worth naming explicitly:** findings #9, #10, and #11 were
all caught by the act of writing downstream planning documents
(feature specs, test plan), not by reviewing the artifacts that
already existed. This wasn't anticipated going in — it emerged from
actually doing the work carefully.

## 4. Where the process deviated from (or wasn't covered by)
## `principles.md`, `orchestrator.md`, `roles/`, or `playbooks/`

**Worked and was validated directly, not just designed:**
- `orchestrator.md`'s "always separate manual-for-you from agent-task,
  name exact files changed" habit — followed every round this
  session, genuinely reduced ambiguity about what to do with each
  response.
- `playbooks/verification-tiers.md`'s four-tier discipline — used
  constantly, and caught real overclaiming multiple times (the
  Partially-verified vs. Live-verified distinction in `testing.md`;
  Agent-verified vs. Person-verified tracking on every screen). This
  is the single piece of the kit that did the most real work this
  session.
- `playbooks/visualization-prompting.md`'s stack-constraint-restating
  and reference-handling guidance — followed correctly throughout
  screen generation, no framework mismatches occurred.

**Real gap, not just deviation:** this session's actual shape doesn't
match what `orchestrator.md`/`roles/` assume. The kit's model is
planning-assistant-writes-spec → coding-agent-implements-in-repo, with
`orchestrator.md`'s whole "task packet compilation" mechanism (required
context, preflight, playbooks-considered-and-excluded) built around
handing scoped work to that coding agent. **That mechanism was never
used this session.** Instead: Claude (the orchestrator) built the
actual screen prototypes directly via an MCP tool (Magic Patterns), and
the "coding agent" (Claude Code Desktop) was used purely as a file-
placement mechanism for spec documents — never given an implementation
task packet at all, because no implementation happened. This isn't a
failure of the kit, but it's a real, unnamed pattern: nothing in
`roles/` or `orchestrator.md` describes "planning assistant also
directly operates a visualization/prototyping MCP tool," even though
that's exactly what happened for the entire Layer 5/6 portion of this
project and worked well.

**Second real gap:** no playbook anticipates a visualization tool
running out of generation credits mid-project. The code-first fallback
used here worked, but was improvised, not guided by anything written
down.

## 5. Ad hoc decisions made that the current kit doesn't cover

- **Multi-tool visual comparison methodology**, invented on the spot:
  one compiled brief used identically across three tools (Magic
  Patterns, V0, arena.ai), a mechanical compliance pass run against
  each candidate's output, a fix-and-retest loop, and finally
  reproducing the visually-preferred tool's output inside the
  tool with better source access. `visualization-prompting.md`
  currently only covers single-tool prompting technique, not a
  multi-tool bake-off process — this was real, worked, and consumed
  real rounds of back-and-forth that a documented process might have
  shortened.
- **Claude in Chrome used once as an independent verification agent**
  (re-testing arena.ai's fixes, results relayed by the person). This
  doesn't cleanly fit any of the four canonical verification tiers —
  it's not the person's own hands (not Live-verified), but it's also
  not Claude's own tool-call evidence (not quite Agent-verified in the
  usual sense either). Naming this gap, not resolving it here.
- **The "verify every claimed inconsistency against real source before
  applying a fix" discipline**, used in the final polish pass. Not
  required by any existing playbook, but directly caught two false
  claims (section 3, #8) that had otherwise persisted across multiple
  `PROJECT-STATE.md` updates without ever being re-checked. This is
  the single most concrete, actionable candidate from this whole
  project — see section 8.

## 6. Prune and consolidate — not just append

No direct evidence of duplication, contradiction, or accreted bloat
was found in the kit's own files during actual use this session —
stated plainly rather than left silently blank, per the template's own
instruction to check before leaving this empty. Genuinely nothing
surfaced; this isn't a skipped check.

## 7. Two-project promotion rule

**Every finding in this document is first-observation — hold.** This
is the first real project on Starter Kit V4.1; nothing here has been
confirmed on a second project, and nothing rises to the severe-safety/
data-loss/irreversible-action bar that would justify immediate
promotion regardless. None of these should be applied to the shared
kit in this pass.

| Candidate finding | Classification if promoted |
|---|---|
| Review/compliance findings need their own verification-tier marking, not stated as settled fact | `principles.md` (cross-cutting — extends the existing tiers concept to a new surface, not just acceptance criteria) |
| Multi-tool visual comparison methodology | `playbooks/visualization-prompting.md` |
| Tool-credits-exhaustion fallback (code-first edit path) | `playbooks/visualization-prompting.md` |
| "Planning assistant directly operates an MCP visualization tool" as a named pattern | `orchestrator.md` or a new `roles/` entry — genuinely unclear which, worth discussing at framework review rather than pre-deciding here |
| Independent-agent-relayed-by-person verification tier gap | `playbooks/verification-tiers.md` (a real taxonomy question, not a full new tier proposal) |

## 8. Summary for the framework-review conversation

Ranked by what actually mattered most this session, not in the order
found:

1. **Highest-value finding:** the verification-tiers discipline needs
   to extend to review findings themselves, not just acceptance
   criteria. A documented "inconsistency" in `component-specs.md` was
   treated as settled fact for multiple rounds before being re-checked
   and found false, twice. The fix is cheap (mark review findings with
   a confidence/verification level too) and the failure mode is real
   and already happened. First observation — hold, but worth watching
   for on project 2 specifically.
2. **Second:** this session's actual shape — orchestrator building
   directly via an MCP visualization tool, coding agent used only for
   file placement — isn't named anywhere in the kit. Worth a real
   conversation about whether to formalize it or treat this project as
   unusual. Not obviously one or the other from a single data point.
3. **Third:** the multi-tool comparison methodology is real,
   reusable-looking material, but untested on a second project — hold,
   don't promote yet, but it's a strong candidate.
4. **Lower priority:** the tool-credits fallback and the independent-
   agent-verification-tier gap are both real but smaller — worth
   logging, not worth much framework-review time yet.

---

# Project Retrospective — Trailhead MVP-B

Compiled at MVP-B's close — full planning arc, all three slices
(Slice 1: shared core + Chat; Slice 2a: agent export; Slice 2b:
multi-turn conversation), PRD through testing. Mirrors the compile
point ADR-001 set for MVP-A. Zero implementation code exists for
MVP-B, same as MVP-A's own close.

## 1. What was actually built

All 9 planning layers, three times over (once per slice): PRD, UX
flows, IA, design language/tokens, approved screens (Ask/Chat and
Export, both built and maintained code-first via Magic Patterns'
`write_artifact_files` — AI-generation credits were exhausted before
Ask's build and remained exhausted through Chat's, three screens in),
component specs, full architecture passes (one new ADR — ADR-005,
tool setup; Slice 2a and 2b each needed zero new ADRs, reusing
ADR-004's stack entirely), feature specs, and test plan additions.

Real divergence from a naive reading of the original MVP-B scope:
Slice 2 was split into 2a (agent export) and 2b (chat) mid-session,
via the same kind of structured interview used for the original
MVP-A→MVP-B re-scoping — not inherited from any template. The
ordering (2a before 2b) was a deliberate, reasoned call (bigger
unknown, ties to founding motivation) rather than the more obvious
"finish the human-facing feature first" ordering.

## 2. `testing.md` final tally

Pulled directly from `docs/09-testing/testing.md`: MVP-A's original
~30 criteria (unchanged tally, still a mix of Partially-verified/
Not-yet-tested/Code-reviewed-only) plus 30 new MVP-B criteria
(`ASK-01`–`10`, `EXPORT-01`–`10`, `CHAT-01`–`10`), **all Not yet
tested, with zero exceptions.** This is a materially weaker starting
position than MVP-A's own screens: Dashboard/Explorer/Symbols/Search
had real click-through interactivity that earned "Partially verified"
on several rows. Ask/Chat and Export are static visual references —
inputs `readOnly`, buttons unwired — with no interaction pattern to
even partially credit. Stated explicitly in `testing.md` itself, not
just here.

## 3. Every real bug or gap found, and what actually caught it

1. **Ask's first code-first build had four real compliance
   deviations** (EmptyState padding off-spec, missing `bg-surface` on
   two states, an invented background tint on the new Danger-tone Card
   variant, a missing `aria-label` and wrong focus-ring opacity on
   AskInput). **Caught by:** a self-run `design-review` compliance
   pass immediately after building, before any human review started —
   the review-split discipline (`principles.md` #2) working exactly as
   designed, catching real drift the same round it was introduced.
2. **Search's "no matches" copy was updated in `ux-user-flows.md`**
   (to point toward Ask) **but the actual Magic Patterns mock was left
   unapplied for a full round.** **Caught by:** incidentally re-reading
   the file during an unrelated task (the WorkspaceHeader tab
   retrofit), not by any dedicated check — a real instance of
   spec-vs-mock drift slipping past the round it was introduced in.
3. **Export's first code-first build had four more real compliance
   deviations** (an invented "inset" background color not in
   `design-tokens.md`, unconstrained prose width missing the locked
   680px cap, task-packet results built as non-interactive divs
   instead of real clickable `ListRow` buttons, and a wrong hover
   color on the Download/Copy actions). **Caught by:** the same
   self-run compliance-pass discipline as finding #1 — a second, real
   validation of the same pattern, not a one-off.
4. **Magic Patterns' AI-generation credits were exhausted before Ask's
   build and never recovered** — affecting Export and Chat too, three
   screens in one session, not the one-off MVP-A's own retrospective
   (finding #5 there) implied. **Caught by:** a failed tool call each
   time; worked around via the same code-first fallback MVP-A already
   established, now confirmed as the real, ongoing working mode for
   this project, not a temporary detour.
5. **A real code defect — not a design-compliance issue — was caught
   before publishing Chat's screen:** a component prop literally named
   `ref`, colliding with React's reserved `ref` prop. **Caught by:**
   self-review during the build itself, before the first publish, not
   after — the one clean instance this session of catching something
   before it ever went out, rather than fixing it in a corrective
   round.
6. **The WorkspaceHeader tab required three separate full-screen
   retrofit sweeps** across this session: adding a 5th tab (Ask) after
   Slice 1, a 6th tab (Export) after Slice 2a, then renaming Ask→Chat
   after Slice 2b — each one correctly flagged at approval time and
   fixed immediately (the person's own consistent choice each round).
   **Caught by:** the screen brief's own "flag to `ui-designer`"
   convention, applied consistently — but this is a structural cost of
   the "separate Magic Patterns file per screen" prototyping approach
   that recurred three times, not a one-off.

## 4. Where the process deviated from (or wasn't covered by)
## `principles.md`, `orchestrator.md`, `roles/`, or `playbooks/`

**Worked and was validated directly, repeatedly, not just designed:**
- `design-review`'s compliance-pass-before-human-pass split
  (`principles.md` #2) caught real, specific deviations on **both**
  Ask's and Export's first builds — two independent confirmations in
  one session, not a single lucky catch.
- `playbooks/verification-tiers.md`'s discipline was applied correctly
  and **sharpened** this round: `testing.md` now explicitly
  distinguishes Ask/Chat/Export's zero-interactivity mocks as a
  genuinely *weaker* evidence tier than MVP-A's interactive ones, a
  real nuance beyond the tier definitions' own text.
- `playbooks/failure-path-testing.md` was applied correctly and
  repeatedly — `ASK-03`/`ASK-06`, `EXPORT-04`, `CHAT-05` were all
  explicitly named as deliberate failure-path tests proving central
  design decisions, not routine coverage, each time reasoning through
  why that specific test mattered more than its one-line description
  suggested.
- `principles.md` rule 4 (no invented scope) showed up concretely and
  repeatedly in actual product decisions, not just as an abstract
  rule: rejecting a `modules` field in Export's JSON schema (never a
  real backend concept), rejecting off-topic detection for task-packet
  (no LLM step exists to make that judgment), choosing questions-only
  over answer-blending for Chat's retrieval (simpler default,
  complexity deferred pending real evidence).

**Real gap, confirmed a second time within this same project:** MVP-A's
own retrospective (finding #2) already named "no playbook anticipates
a visualization tool running out of generation credits mid-project."
This recurred across three separate screens in this session alone —
a much stronger *within-project* signal than MVP-A's single
occurrence, though per the two-project promotion rule (section 7
below), within-project recurrence still isn't the same test as
across-project confirmation, and shouldn't be treated as satisfying it.

**Second real gap, newly identified this round:** no existing role or
playbook names the "cross-screen retrofit sweep" pattern — that adding
or renaming a shared header element (a tab) requires auditing every
other screen currently using that component. This happened three
times this session, handled well ad hoc each time via the screen
brief's own flagging convention, but nothing written down says to
expect this as a standing category of follow-up work when a shared
component changes.

**Third, smaller gap:** `orchestrator.md`'s consolidation guidance
("if small fixes start accumulating... proactively consolidate them")
frames batching `PROJECT-STATE.md` updates as situational judgment.
Partway through this session, the person explicitly asked for a
simpler standing rule instead — always update in the same turn, never
ask. The existing guidance didn't cleanly anticipate that someone
might prefer removing the judgment call entirely rather than exercising
it well.

## 5. Ad hoc decisions made that the current kit doesn't cover

- **A consistent recommend-with-tradeoffs-then-confirm interaction
  pattern**, used dozens of times this session for nearly every
  substantive product/UX/architecture decision: lay out real
  tradeoffs on both sides (not just the recommended option), give a
  clear recommendation with reasoning tied to already-locked
  precedent *in this specific project*, then explicitly ask for
  confirmation rather than silently proceeding. This worked
  consistently across very different question types (product scope,
  IA placement, architecture tradeoffs, design tokens) and is close to
  but not identical to `product-manager.md`'s "push back on vague
  answers" instruction — worth naming as its own reusable technique,
  not just an application of that rule.
- **Tying each new recommendation explicitly back to a specific,
  named prior decision in the same project** ("consistent with the X
  decision from round Y") was used heavily throughout and seemed to
  produce a genuinely coherent, self-reinforcing design system rather
  than a series of independent one-off calls. Not formalized anywhere,
  but real and repeatedly effective.
- **Sub-slicing a slice** (Slice 2 → 2a/2b) — the kit's README only
  describes MVP-level phase splitting; this project's own "Slice"
  vocabulary was invented mid-session (for MVP-B itself, then applied
  recursively to Slice 2). A real, recurring decomposition need the
  kit currently has no name or template for, beyond the top-level
  MVP-A/MVP-B split.

## 6. Prune and consolidate — not just append

No direct evidence of duplication, contradiction, or accreted bloat
was found in the kit's own files during actual use this round —
stated plainly per the template's own instruction, not left blank
without checking. Nothing surfaced.

## 7. Two-project promotion rule — before adding anything permanent

**Every finding in this document is still first-observation-project-
wise — hold**, with one nuance worth stating precisely: the Magic
Patterns credit-exhaustion gap is not a *fresh* first observation
(MVP-A's retrospective already named it) but its *within-project*
recurrence here (three more screens) is not the same test as the
two-project promotion rule requires. The rule asks for confirmation on
a **second project**, not a second occurrence within the same one —
so this stays held, but the evidence behind it is now meaningfully
stronger than a single occurrence, worth flagging clearly for whoever
runs the next framework-review conversation rather than treated as
equivalent to a brand-new, unconfirmed finding.

| Candidate finding | Classification if promoted |
|---|---|
| Magic Patterns credit exhaustion (now 2nd project-internal confirmation, still needs a true 2nd project) | `playbooks/visualization-prompting.md` |
| Cross-screen retrofit sweep pattern (new) | `roles/ui-designer.md` or a new playbook — worth discussing which at framework review |
| Recommend-tradeoffs-then-confirm interaction pattern (new) | `orchestrator.md` or `roles/product-manager.md` — genuinely unclear which, worth discussing |
| `PROJECT-STATE.md` batch-vs-always-update preference gap (new, small) | `orchestrator.md`'s consolidation guidance wording |
| Sub-slicing vocabulary gap (new) | `README.md`'s order-of-operations section, or a new template |

## 8. Summary for the framework-review conversation

Ranked by what actually mattered most this round:

1. **Highest-value finding:** the Magic Patterns credit-exhaustion gap
   is now confirmed a second time *within this project* (three
   screens, not one) — the strongest evidence yet that this is a real,
   recurring operational reality for this workflow, not a fluke. Still
   correctly held per the two-project rule (a second *project* is the
   actual bar), but worth prioritizing as the first thing to check for
   on whatever the next project on this kit turns out to be.
2. **Second:** the recommend-tradeoffs-then-confirm pattern is real,
   validated repeatedly, genuinely reusable-looking — but untested on
   a second project, hold.
3. **Third:** the cross-screen retrofit sweep gap is a real, concrete,
   first-observation finding with an obvious home (`ui-designer.md` or
   a new playbook) — worth serious consideration even before a second
   project, given how mechanically clear the pattern is.
4. **Lower priority:** the `PROJECT-STATE.md` consolidation-wording gap
   and the sub-slicing vocabulary gap are both real but smaller — worth
   logging, not worth much framework-review time yet.

---

# MVP-B Implementation Retrospective (2026-07-24/25)

Compiled at the close of the full implementation session — from Step
A (foundational schema/poller) through all 7 real frontend screens
and the actual public GitHub release. This section covers building,
not planning — MVP-A's and MVP-B's earlier planning retrospectives
above remain unchanged and still valid.

## 1. What was actually built

The complete backend: repository import (ZIP + GitHub, real zipball
handling), safe preprocessing, real tree-sitter symbol extraction,
real transformers.js embeddings with a symbol-boundary chunking
algorithm, real Stack/Testing detection heuristics, Ask/Chat (on
Groq, after a real mid-session provider switch from Gemini), the
Symbols API, a from-scratch Postgres FTS+GIN Search backend, all
three Export formats (JSON, Task-Packet, LLM-generated
REPOSITORY_CONTEXT.md with deterministic fallback), and Reanalyze/
Delete with real delete-and-replace semantics.

The complete frontend: all 7 approved Magic Patterns screens ported
to real Next.js code, wired to real endpoints, verified against real
data through both automated Playwright testing and direct person
click-through.

The complete release: a real public GitHub repository with an
accurate, honest README (including a documented known limitation,
not hidden), MIT license, real screenshots, and the full methodology
corpus preserved and linked.

## 2. testing.md final tally

Chat (CHAT-01–10) and Export (EXPORT-01–10) both closed with real,
per-criterion Agent-verified evidence, gathered via a mix of direct
API testing and real Playwright browser automation. Overview/Symbols/
Search got real UI-level verification for the first time (previously
backend-only). A real keyboard-only accessibility pass covered all 7
screens and found and fixed one genuine regression (see below).
**Explicitly NOT closed:** full screen-reader-output testing
(NVDA/VoiceOver) — stated honestly as an open gap in both
`testing.md` and the public README, not silently dropped.

## 3. Every real bug or gap found, and what actually caught it

This is the highest-value section — every entry below is a real,
specific incident, not a general impression.

| # | Finding | What caught it |
|---|---|---|
| 1 | Symlink detection checked the wrong ZIP field (compression method 99 = AES encryption, not symlink marker) | Direct source-code trace, after being asked to investigate rather than accept a "couldn't test this" report |
| 2 | Path-traversal check had a redundant, over-broad substring test | Direct source-code trace |
| 3 | Binary-detection false-positive on short files (zero-padded header buffer) | Real live UI verification (Overview) showing implausible `skipReason` values on plain-text files |
| 4 | Real dev server was silently writing to the TEST database, not dev | Refusing to accept "invalid API key" as an explanation without seeing the raw error — the raw error revealed the real cause |
| 5 | `AnalysisJob` lookup was unordered, would silently misbehave once Reanalyze existed | Direct code trace during architecture backfill, well before Reanalyze was built — caught structurally, before it could ever manifest as a real bug |
| 6 | Citation responses were positionally remapped by array index instead of real label — broke on non-sequential citations | Deliberately investigating a specific edge case (skipped middle label) after noticing the array-length didn't match the label range in a live response |
| 7 | Framework misdetection (`got` reported as "Express") | Real end-to-end verification against a real, understood repository — caught because the tester recognized the result was implausible for that specific library |
| 8 | LLM hallucination ("session store") in generated prose despite valid citation labels | **Manual, line-by-line semantic audit of live model output against real retrieved evidence** — citation-validity checking alone did not and could not catch this |
| 9 | Dashboard's entire top-level header/toolbar was never built | Direct visual comparison of the real running screen against the original approved mock — no automated test was checking for this because none was ever asked to |
| 10 | `AddRepositoryModal` had no Escape-to-close handler — a real regression against an explicitly-stated original requirement | Real, automated Playwright keyboard-only testing |
| 11 | Export page rendered `WorkspaceHeader` twice | Direct visual comparison against the mock |
| 12 | The embedding model (`Xenova/all-MiniLM-L6-v2`) has no code-semantic understanding — ranks a filename mention in `package.json` above a file's own real code | **Live, real usage by a person asking a simple, real question** — every automated test up to that point had exercised retrieval only with engineered/synthetic queries, never a genuinely naive real question |
| 13 | Several flaky tests (poller timing, citation tiebreaking, reanalysis state transition) | Real repeated-run investigation each time, tracing to a genuine mechanism (real I/O timing, test-fixture UUID randomness, WASM/ONNX cold-start cost) rather than accepting "flaky" as a terminal explanation |

**Pattern worth naming explicitly:** a disproportionate number of the
most significant findings (#3, #4, #8, #9, #10, #11, #12) were caught
**only** by a person or agent actually looking at real, live output —
a screenshot, a live model response read end-to-end, real browser
interaction — not by any automated test, however thorough. Automated
testing caught real logic bugs reliably; it did not catch visual
fidelity loss or semantic/quality degradation even once, across the
entire session. This is not an argument against automated testing —
every one of those tests remains real, valuable regression coverage —
it's a finding about what class of problem it structurally cannot see.

## 4. Where the process deviated from principles.md/orchestrator.md/roles/playbooks

**Worked well, real validation:**
- The "prove the environment first, build the real thing second"
  pattern (used for pgvector, web-tree-sitter, transformers.js, Groq,
  Shiki) caught a real, non-obvious environment gotcha *every single
  time* it was used, before that gotcha could surface mid-implementation.
- The four-tier verification discipline (`playbooks/verification-tiers.md`)
  repeatedly caught mislabeled "pre-existing"/"seeded"/"unrelated"
  claims — at least six separate times this session, a claim that
  would have been accepted at face value in a less disciplined process
  turned out to be wrong on direct inspection.
- Structured ambiguity escalation (offering real, named options rather
  than picking silently) was used for every real architecture fork —
  model provider choice, backend-gap sequencing, license/docs
  structure — and never once produced a wrong or regretted default.

**Real gaps, improvised in the moment, not covered by any existing
role or playbook:**
- **Commit discipline was NOT reliably self-sustaining.** Despite
  `principles.md` #7 stating it as a cheap, unconditional default,
  multiple rounds this session had "committed" claims that turned out
  false, requiring an explicit mid-session correction ("I will
  explicitly confirm before every round, not trust it happened
  silently"). This is a real, repeated failure mode with real exposure
  — several interruptions this session hit *before* work had been
  checkpointed, and only good diagnostic recovery (not the commit
  discipline itself) prevented actual loss.
- **No formal playbook exists for recovering from an interrupted
  coding-agent session**, despite this exact pattern (check stray
  processes → check git status/diff → diagnose before resuming) being
  needed roughly eight to ten separate times this session, across
  multiple distinct failure modes (API errors, context-compaction
  failures, hung builds, silent stops with no error at all).
- **No guidance exists for the specific failure mode of porting a
  design mock through a text-relay to a second model** — this
  session found real, repeated fidelity loss (an implicit wrapper
  context Magic Patterns provides but never appears in the exported
  file; an entire missing header section; a doubled header on another
  screen) that traces to a structural cause (Kilo Code has no direct
  Magic Patterns access, so every port is a real regeneration from
  pasted text, not a copy). A candidate fix (route the
  structural/visual portion through Claude Code's existing exact-
  transcription carve-out) was proposed and used successfully once
  (Dashboard's real fix), but was never formalized as a repeatable
  procedure — it was ad hoc each time.
- **Windows-specific build fragility** (stray `node` processes and a
  stale `.next` cache combining to produce either a silent multi-hour
  hang or an `EPERM` file-lock error) recurred at least three separate
  times. The fix (kill node processes, delete `.next/`) is now
  well-documented in `KNOWN-GOOD.md`, but nothing prompts an agent to
  check for this proactively before a build, only reactively after
  one fails.

## 5. Ad hoc decisions the kit doesn't currently cover

- **Mid-project product-runtime model swaps under real-world quota
  discovery.** The kit's `adr-tool-setup.template.md` covers choosing
  the *coding* tool/model — it has no equivalent guidance for the
  *product's own* runtime LLM choice, which this session had to
  revisit twice (Gemini 2.5→3.5→back to 2.5→Groq) in response to real,
  live API behavior contradicting documentation each time.
- Deferring granular per-criterion `testing.md` updates during a long,
  fast-moving implementation stretch, then doing one large,
  evidence-backed reconciliation pass at the end — worked well in
  practice, but wasn't something any existing role or playbook
  actually recommended; it was a real-time judgment call.

## 6. Prune and consolidate

- **`KNOWN-GOOD.md` has grown very large** over one session — every
  future task now reads the full accumulated history per `AGENTS.md`
  kernel rule 7. Worth considering whether it should be split by
  category (Windows/environment-specific vs. product-logic-specific
  vs. tool-specific) before it becomes a real per-task context cost,
  though this is a real tradeoff against fragmenting a single source
  of truth — not an obvious call either way.
- No contradiction or duplication found between `PROJECT-STATE.md` and
  this retrospective — the discipline of keeping `PROJECT-STATE.md` to
  pointers/status only, per its own template, held up in practice.

## 7. Two-project promotion rule

None of the findings above have been confirmed on a second project —
all remain project-local candidates, **except** the commit-discipline
gap (section 4), which is worth flagging as a borderline case for
immediate promotion: it's arguably a real, repeated exposure to actual
data-loss risk (`principles.md` #7's own stated justification for
promoting safety-critical findings immediately), not merely a
one-off inconvenience. Recommend treating this one as promotion-
worthy now rather than waiting for a second project, given the
severity argument; everything else stays logged here, first
observation, hold.

## 8. Summary for the framework-review conversation

Ranked by what actually matters most:

1. **Commit-discipline enforcement is a real, unsolved gap** —
   stating it as a default in `principles.md` isn't sufficient on its
   own; something more structurally enforced (a required checkpoint
   step in the task-packet template itself, not just a stated norm)
   is worth real consideration. **Promotion status: candidate for
   immediate promotion, given the safety/data-loss justification.**
2. **No interrupted-session-recovery playbook exists**, despite
   needing this exact procedure repeatedly. **First observation — hold**,
   but a strong one given how many times it recurred within this
   single project alone.
3. **Mock-port-fidelity loss through a text-relay to a second model
   is a real, structural, repeatable failure class** — worth a real
   playbook (`playbooks/visualization-prompting.md` already covers
   *generating* mocks; nothing covers *porting* an approved mock into
   a real codebase through an intermediary). **First observation —
   hold**, though the Claude-Code-exact-transcription approach is a
   concrete, tested candidate fix worth trying deliberately on a
   second project rather than starting from scratch.
4. Everything else in sections 4–6 is real but lower priority —
   genuinely useful data, not urgent to act on.

**What's strongly reaffirmed, not new:** the environment-proof-first
pattern, the verification-tiers discipline, and structured ambiguity
escalation. These aren't new findings — they're existing kit
principles that got real, repeated, successful exercise this session
and held up completely. Worth noting as confirmation, not just
silence.

---

# Project Retrospective — Trailhead Upgrade

*Compiled per `RETROSPECTIVE.template.md` at the close of the
Trailhead Upgrade phase, while the phase's full context was still
loaded. All nine sections complete; every finding carries its own
evidence tier.*

**Scope note:** this retrospective covers the **Trailhead Upgrade
phase** (project 2 on the kit, Starter Kit V4.2, ADR-007) — the
period from kit adoption through item 7's close (`624c046`). MVP-A
and MVP-B's planning and implementation retrospectives already exist
as separate, prior sections of this project's history and are not
restated here.


---

## 1. What was actually built

### Stack — no changes within this phase
The generation provider change (Gemini→Groq) happened *before* this
phase began, during MVP-B implementation. This phase's item 1 only
corrected the documentation to match — a real doc-drift fix, not a
new migration. No other stack layer changed. The evaluated embedding
model swap (item 3) was **not adopted** — production remains
`Xenova/all-MiniLM-L6-v2`, 384-dim, unchanged.

### The seven items, as shipped vs. as scoped

| # | Scoped as | Shipped as | Divergence |
|---|---|---|---|
| 1 | Doc-drift fix | Done — Gemini/Groq corrected across all active docs | None |
| 2 | Golden benchmark suite | **Complete, real infrastructure** — not a one-off check but a durable, versioned artifact (manifests v1.0.0→v1.1.0, locked comparison parameters, a dedicated `trailhead_bench` database) | **Added by the person's own initiative** during the Layer 1 interview — not on the original candidate list. Turned out to be the single most load-bearing piece of infrastructure this phase produced. |
| 3 | Embedding model swap | **HELD, not shipped** — rigorously evaluated (environment probe, corrected throughput methodology, dry run, reopened on a falsified hypothesis, widened, re-evaluated), ending in a deliberate non-adoption with the candidate preserved for future reconsideration | **Major divergence.** The phase's original headline motivation ("the embedding model has no code-semantic understanding," per the MVP-B retro) did not ship as a fix — it shipped as a rigorous, evidence-based *decision not to ship*, plus reusable evaluation infrastructure (item 2) as the actual durable output. |
| 4 | Framework misdetection fix | **Re-scoped mid-phase (ADR-010)** from "fix" to "verify + regression-guard" — the original defect (`got` misreported as Express) did not reproduce against current code | The retrospective finding that motivated this item was accurate when originally written but had already been fixed or had stopped reproducing by the time this phase started — a real caution about time-sensitive findings in retrospectives/ADRs. |
| 5 | LLM observability | Shipped, merged — real backend (`LlmRequestLog`, a **newly-created** `generation.ts` abstraction), real endpoint, real Dashboard panel | The panel's own design work (Magic Patterns) had been approved in an earlier round but never actually ported into the codebase until this item's implementation — discovered only when the implementing task traced the real files. |
| 6 | Screen-reader accessibility | Shipped, merged — 7 real defects found via a live, first-time-user NVDA audit; all 7 fixed and independently live-reconfirmed | None from scope, but the audit found real defects (Chat's total response silence, both Dashboard modals leaking Tab focus into browser chrome) that no automated tooling in the project had ever caught. |
| 7 | Testing closeout | Shipped — closed IMPORT-04, PREPROC-03, and the remaining planning-era Dashboard/Explorer rows | **Expanded significantly during execution.** Found and fixed three real production bugs that predated this entire phase and had nothing to do with the original closeout list: `boxen`'s NUL-byte import poisoning (silent false-success), `got`'s orphaned analyzing-state (unreconcilable, out-of-band data loss), and a real bypass of the 500MB import safety budget. One scoped, deliberate deferral: IMPORT-04 (branch selection) was found to be a real, fully unimplemented acceptance criterion — documented honestly as deferred, not marked passed. |

### New durable infrastructure this phase produced, beyond the 7 items' immediate scope
- **The golden benchmark suite itself** — corpus manifest, versioned
  ground truth, a dedicated `trailhead_bench` database, locked
  comparison parameters, trap-rank measurement methodology. Reusable
  for any future retrieval-quality decision, not just this phase's
  swap evaluation.
- **`generation.ts`** — the real shared LLM-call abstraction that
  `chat.ts` and `export.ts` had each independently duplicated before
  this phase. Now genuinely a single choke point.
- **Poller reconciliation logic** — previously absent; orphaned
  analyzing/queued repositories with no live job now self-heal to
  `failed` instead of polling forever.
- **A reusable modal focus-trap hook** (`useModalFocusTrap.ts`) —
  fixes both existing modals and is ready for any future one.
- **The NVDA testing guide** — a real, beginner-oriented process
  artifact, reusable for future accessibility passes on this or other
  projects.

### ADRs touched this phase (10)
ADR-005 (amended twice — mixed coding-agent policy, then refined to a
type-based split), ADR-007 (kit V4.2 adoption), ADR-008 (benchmark
corpus + dedicated DB), ADR-009 (embedding model choice — accepted,
then reopened on falsified evidence, then formally held), ADR-010
(item 4 re-scope), ADR-011 (reanalysis semantics correction).

### Branches — one deliberately never merged
`upgrade/benchmark-harness` (item 2), `upgrade/observability` (item
5), `upgrade/a11y-live-regions` (item 6), `upgrade/item7-closeout`
(item 7) — all merged into `main`. **`upgrade/embedding-swap-bench`
(item 3) was deliberately never merged** — it's an evaluation
artifact, not shipped code, preserved on its own branch as the
record of a real, thorough, held decision.


---

## 2. `testing.md` final tally

**Compiled from a real, fresh pull of the current file** (verified
2026-08-02), not from session memory — an earlier draft of this
section was compiled from conversational recall and was corrected
before finalizing, itself real Section-3 material (see below).

### Upgrade phase — all seven items, final tally

**Live-verified (highest tier — real person, real hands, real
observation):**
- All 7 of item 6's screen-reader defects — found AND their fixes,
  both via the person's own first-time NVDA sessions
- Item 5's observability panel — visual approval, all four states
- Item 3's benchmark ground truth (31→40 queries, 26 symbols) —
  person-verified curation

**Agent-verified (real execution against real data/DB/HTTP):**
- OBS-01 through OBS-07 (item 5)
- SWAP-01 through SWAP-06 (item 3's dry-run gates — all passed; the
  product decision to hold is separate from gate status)
- BENCH-01 through BENCH-07 (item 2 — BENCH-07 was real but had been
  missing from testing.md's table; added during this reconciliation)
- OVERVIEW-U1/U2, EXPORT-U1/U2 (item 4 — closed for real, during
  retrospective compilation itself; see below)
- Item 7's full closeout: boxen/got fixes and poller reconciliation,
  BATCH_SIZE length-awareness, the Inter font-resolution fix,
  PREPROC-03's boundary AND its newly-found bypass defect,
  DASH-01/02/03/04/05, EXPLORER-01/02/03/04

**One honest tier boundary, kept, not rounded up:** EXPORT-U2's LLM
generation path is Code-reviewed only — exercised by inspection, not
a live call, to avoid spending real Groq quota.

**Explicitly deferred, never rounded to passed:**
- **IMPORT-04** — verified genuinely UNIMPLEMENTED. No UI selector
  exists; the backend silently discards the branch parameter.
  Deliberately deferred, documented as CURRENT vs. DEFERRED; an
  `it.fails` test locks the target behavior into the suite.
- FK indexes — confirmed absent; the original claim didn't even exist
  in architecture.md (a claim about a claim); real implementation
  deferred, low priority, unmeasured.
- Documentation-retrieval mitigation study (item 3's held decision).
- Cloud-embedding scoping — raised, held separate.
- A Chat retrieval-quality edge case flagged during item 6, out of
  that item's scope.

### Genuinely open — pre-existing MVP-A/B gaps, out of this phase's scope, carried forward untouched
OVERVIEW-02, SYMBOLS-01 (extraction correctness, distinct from the
closed SYMBOLS-02 filtering), SYMBOLS-03 (zero-symbols empty state,
open since the screen was first built), SEARCH-01/04/06, the
30-minute-timeout NFR, and the shared-quota NFR (called "the single
most pressing unmeasured NFR" twice in the file's own history, never
measured even after Gemini→Groq). None were in this phase's scope;
none touched; all real, honest, still open.

**Pre-existing, environment-caused test failures throughout, never
this phase's problem:** 3 invalid-Gemini-key tests, 1 documented
`reanalysis.test.ts` timing flake.


---

## 3. Every real bug or gap found, and what actually caught it

*Numbered, chronological. Every real defect, gap, or mistake recorded
separately before any structural conclusion is drawn.*

**#1 — Provider documentation drift (Gemini → Groq)**
- **Category:** Documentation error
- **Finding:** Every active project doc named Gemini and its 1,500
  req/day quota as the generation provider.
- **Observed symptom:** None — silent, no runtime failure.
- **Actual root cause:** The provider was switched from Gemini to
  Groq during MVP-B implementation, before this phase began;
  documentation was never updated to match.
- **What caught it:** The person's own knowledge of the real system,
  surfaced at Layer 1 scope interview.
- **Why earlier checks missed it:** No mechanism compared
  documentation claims against runtime configuration.
- **Fix/disposition:** Corrected across all active docs (item 1);
  historical MVP-B sections preserved verbatim with a dated
  correction note.
- **Verification tier:** Agent-verified (real `.env`/config trace
  confirming Groq is active).
- **Reusable lesson:** A provider swap needs an explicit "update all
  docs" step in its own definition of done.

**#2 — The benchmark corpus was planned but never instantiated**
- **Category:** Documentation error
- **Finding:** "The existing 5-repository benchmark corpus,"
  referenced across seven separate doc locations, had no real,
  pinned artifact behind it anywhere.
- **Observed symptom:** A benchmark implementation task, told to use
  "the existing corpus," found no enumeration of its members
  anywhere.
- **Actual root cause:** A corpus *concept* was genuinely scoped in
  planning — the idea of a 5-repository benchmark set was real. But
  that plan was never carried through to an instantiated artifact: no
  round ever selected the actual repositories, pinned their commits,
  or imported them. Later documents cited the planned concept as if
  it were already the real, pinned thing, and each new citation
  compounded the illusion.
- **What caught it:** Claude Code's stage-A discovery gate —
  instructed to stop rather than invent a corpus if it wasn't
  unambiguously discoverable, it searched real git history, real
  database state, and real source comments, and reported the absence
  directly.
- **Why earlier checks missed it:** Every prior mention treated the
  corpus as settled fact and built on that assumption rather than
  verifying it — a citation chain with no original source.
- **Fix/disposition:** ADR-008 — corpus enumerated for real, imported
  and pinned, with per-repo import verification before being trusted.
- **Verification tier:** Agent-verified (real import, independently
  re-queried via SQL rather than trusting the import script's own
  output).
- **Reusable lesson:** A fact repeated across many documents is not
  more verified than a fact stated once — repetition creates the
  feeling of established truth without any of its substance. A plan
  and an instantiated artifact are different things, and citing the
  plan as if it were the artifact is exactly how this kind of gap
  hides.

**#3 — Benchmark spec named an incompatible database**
- **Category:** Documentation error / benchmark defect
- **Finding:** `benchmark.md` required the runner to execute "against
  the test database" — but `trailhead_test` is documented elsewhere
  as routinely churned by vitest fixtures, incompatible with a
  benchmark needing a stable, fixed baseline.
- **Observed symptom:** Discovered during the same stage-A
  investigation as #2, before any runner code was written.
- **Actual root cause:** The spec was written without cross-
  referencing an already-known environment fact recorded elsewhere in
  the project. The instruction to use `trailhead_test` was not
  actually correct for a stable benchmark — this wasn't a case of two
  correct facts colliding, it was one real requirement (stability)
  never checked against the actual behavior of the database it named.
- **What caught it:** The same stage-A investigation, tracing what
  "the test database" would mean in practice before building against
  it.
- **Why earlier checks missed it:** The spec and the `KNOWN-GOOD.md`
  entry were each real and individually plausible/locally
  consistent — nobody had checked them against each other.
- **Fix/disposition:** ADR-008 — a dedicated `trailhead_bench`
  database created specifically to be exempt from vitest's fixture
  churn.
- **Verification tier:** Agent-verified (real database creation, real
  corpus import, real isolation confirmed via row counts across
  subsequent rounds).
- **Reusable lesson:** New specs should be checked against existing
  `KNOWN-GOOD.md` entries before being written, not just after
  something breaks.

**#4 — `boxen`: false-success import (zero files, marked ready)**
- **Category:** Product defect (pre-existing, predates this phase)
- **Finding:** `sindresorhus/boxen` sat at `ready` with a `completed`
  analysis job and zero files, symbols, or chunks.
- **Observed symptom:** A "successful" analysis that produced
  nothing — discovered incidentally while investigating corpus
  composition for #2/#3.
- **Actual root cause (established later, item 7):** Two independent
  defects — NUL-byte AVA snapshot content bypassed a 16-byte-window
  binary-detection scan and poisoned a non-transactional multi-row
  insert; the poller then had no zero-file guard and reported `ready`
  anyway.
- **What caught it:** Incidental real SQL queries run to validate
  benchmark corpus composition, executed by the coding agent.
- **Why earlier checks missed it:** No test had ever imported a
  repository containing NUL-byte content.
- **Fix/disposition:** Deliberately deferred at discovery; fully
  root-caused and fixed in item 7 Group 1 — full-content NUL scan,
  atomic import transaction, poller zero-file guard.
- **Verification tier:** Agent-verified against the real development
  system at discovery (real SQL against `trailhead_dev`, executed by
  the agent, not directly confirmed by the person); Agent-verified
  against the real development system at fix (real re-import
  producing the exact predicted 47 files, agent-executed).
- **Reusable lesson:** An empty, "successful" database row is not
  evidence of nothing — it can be evidence of a silent pipeline
  failure. Worth a standing sanity check: `ready` + zero content
  should never coexist without an explicit reason.

**#5 — `got`: orphaned `analyzing` state, no job row, out-of-band data loss**
- **Category:** Product defect (root cause: out-of-band, unidentified
  action, not the codebase itself)
- **Finding:** A second `got` fixture sat permanently `analyzing`
  with zero files, symbols, chunks, and no `AnalysisJob` row at all.
- **Observed symptom:** Found alongside #4, during the same
  corpus-composition investigation.
- **Actual root cause:** Real forensic limit, stated honestly rather
  than guessed: a real import genuinely completed (confirmed via
  correct, populated stack facts) and its child rows were later
  deleted out-of-band by something that could not be identified — no
  code path in the repository performs this deletion.
- **What caught it:** The same incidental SQL investigation as #4.
- **Why earlier checks missed it:** The poller had no mechanism to
  detect or recover from an orphaned state at all — a genuinely
  absent recovery mechanism, not insufficient testing.
- **Fix/disposition:** Deferred at discovery; fixed in item 7 Group 1
  via poller-level reconciliation. Root cause of the original
  deletion remains unknown — stated as an honest limit, not chased
  further.
- **Verification tier:** Agent-verified against the real development
  system at discovery; Agent-verified against the real development
  system at fix (a real poller tick on the real dev server, real
  before/after SQL, all agent-executed and agent-read).
- **Reusable lesson:** The reconciliation fix does not prevent
  out-of-band deletion; it prevents a repository from remaining
  indefinitely queued/analyzing without a live job by reconciling it
  to failed.

**#6 — Orchestrator asserted an unwritten artifact into `PROJECT-STATE.md`**
- **Category:** Orchestrator/process mistake
- **Finding:** A `PROJECT-STATE.md` round listed
  `benchmark/manifest.json` under "Files changed last round" *before*
  the task that would actually write it had been run.
- **Observed symptom:** The coding agent, given that state file as
  context, found the manifest still in its unapproved, empty
  state — contradicting what it had just been told was already true.
- **Actual root cause:** The orchestrator described a future action
  as if already complete — the same failure class as #2 (an artifact
  asserted into existence by documentation rather than by having
  actually happened).
- **What caught it:** The coding agent, cross-checking the stated
  fact against the real file before proceeding.
- **Why earlier checks missed it:** No mechanism existed to verify
  the orchestrator's own state-file claims before they were used as
  trusted context.
- **Fix/disposition:** Corrected immediately; standing rule
  adopted — "Files changed last round" lists only what's already
  placed.
- **Verification tier:** Agent-verified (the agent's own real-file
  check).
- **Reusable lesson:** The orchestrator is not exempt from the
  project's own core discipline.

**#7 — An unstaged, out-of-scope file was swept into an unrelated commit**
- **Category:** Orchestrator/process mistake (a routing decision,
  compounded by an insufficiently verified commit)
- **Finding:** `scripts/check-got.ts` — deliberately left as an
  uncommitted deletion for weeks, pending its own scoped decision —
  was committed as part of an unrelated docs-placement commit,
  without authorization.
- **Observed symptom:** A placement task's completion report showed 5
  files changed where only 4 were expected, one of them the
  long-parked deletion.
- **Actual root cause:** The proven mechanism, stated precisely: the
  worktree contained a pre-existing, unrelated deletion; the commit
  included that deletion despite an explicit prohibited-scope
  instruction; the staged diff/file set was not constrained or
  verified tightly enough before the commit completed. The task had
  also been routed to Kilo Code under a since-abandoned exception to
  the placement policy — a real contributing process deviation, but
  not the established technical cause of the file being included.
- **What caught it:** The orchestrator, reviewing the completion
  report against the expected file count before treating the round as
  closed.
- **Why earlier checks missed it:** A prohibited-scope instruction
  existed in the task text, but nothing forced a check of the actual
  staged paths against that instruction before the commit was made.
- **Fix/disposition:** The commit was amended to remove the file from
  its tree; the placement-always-Claude-Code rule was reaffirmed with
  no further exceptions.
- **Verification tier:** Agent-verified: the amended commit contained
  exactly the four authorized placement files, while
  `scripts/check-got.ts` was restored to its prior separately
  tracked, unstaged-deletion state.
- **Reusable lesson:** A prohibited-scope instruction is not
  sufficient protection in a dirty worktree. Before committing,
  verify the exact staged paths and staged diff against the
  authorized file list. Placement consistency helps, but
  staged-scope verification is the load-bearing safeguard.

**#8 — A stale "as of" commit hash was stated as current fact**
- **Category:** Orchestrator/process mistake
- **Finding:** `PROJECT-STATE.md`'s hash-tracking convention stated
  `main`'s HEAD as a specific commit that was, by the time the file
  was actually used, no longer current — real work had landed on
  `main` in the interim without the orchestrator's record reflecting
  it.
- **Observed symptom:** A coding agent, checking out `main` as
  instructed, found its real HEAD did not match the hash the task
  packet asserted, and reported the discrepancy rather than
  proceeding on the assumption it was accurate.
- **Actual root cause:** The orchestrator's hash bookkeeping was
  updated once per round but not re-verified against the repository's
  actual state at the moment each new task was issued — a snapshot
  treated as durable fact past its actual shelf life. This recurred
  more than once across the project, not as a single incident.
- **What caught it:** The receiving coding agent's own checkpoint
  step, comparing the stated expectation against the real repository
  state before acting.
- **Why earlier checks missed it:** Hashes change every round by
  design; nothing forced a re-verification step between the
  orchestrator writing a hash down and an agent later relying on it.
- **Fix/disposition:** A dating convention was adopted ("as of
  [date]") to signal that any stated hash should be treated as
  possibly stale rather than as permanent fact; agents continued to
  verify HEAD directly rather than trusting the stated value blindly.
- **Verification tier:** Agent-verified (real `git status`/HEAD
  checks catching the mismatch each time).
- **Reusable lesson:** Any centrally-maintained "current state" record
  is a snapshot, not a live value — the receiving party checking the
  real, current state before acting is the actual safeguard, not the
  record's own freshness.

**#9 — Ground-truth rationale error on KC-05 (correct edit, wrong stated reason)**
- **Category:** Benchmark defect (ground-truth curation)
- **Finding:** A person-authored edit to KC-05's question wording was
  correct, but the recorded reason for the edit was incomplete —
  `got` has two distinct `TimeoutError` classes, and the public one
  users would catch lives in `errors.ts` (KC-05's real ground truth),
  not the internal one in `timed-out.ts` the original rationale cited.
- **Observed symptom:** Found while curating the symbol ground-truth
  sample.
- **Actual root cause:** The original edit's rationale was written
  from a partial read of the codebase.
- **What caught it:** The symbol-curation task's requirement to
  content-verify every proposed symbol against real source.
- **Why earlier checks missed it:** The question itself was never
  wrong, so nothing tested the stated reason behind a prior
  correction.
- **Fix/disposition:** The manifest's rationale field corrected as a
  separate, clearly-labeled correction, without altering the
  already-correct question.
- **Verification tier:** Agent-verified (real content read of both
  class definitions).
- **Reusable lesson:** A wrong-but-harmless rationale is still worth
  fixing — it can resurface later as the basis for a wrong decision.

**#10 — Ranking methodology gap: chunk-level top-3 couldn't represent the actual defect**
- **Category:** Benchmark defect (methodology)
- **Finding:** Stage A's chunk-level, top-3-only ranking couldn't
  represent cases where the correct file sat well outside the top 3.
- **Observed symptom:** A smoke run showed `TRAP-06`'s correct file
  entirely absent from a top-3 window.
- **Actual root cause:** The ranking definition was written before
  any real query had been run against it.
- **What caught it:** Running the approved query set for the first
  time.
- **Why earlier checks missed it:** No real queries had exercised the
  rule when it was written.
- **Fix/disposition:** Redefined to file-level, search depth 50,
  best-chunk-per-file, locked before any baseline was recorded.
- **Verification tier:** Agent-verified.
- **Reusable lesson:** A measurement definition should be tested
  against at least one real, extreme case before being locked.

**#11 — Trap-rank recording was missing from the original benchmark spec**
- **Category:** Benchmark defect (spec gap)
- **Finding:** No requirement existed to record a trap file's rank
  alongside the correct file's rank for `filename_trap` queries.
- **Observed symptom:** Realized when asking how criterion 2 would
  actually be evaluated.
- **Actual root cause:** The spec defined the category without
  defining the specific comparison its purpose required.
- **What caught it:** Reasoning about the eventual evaluation before
  any baseline was run.
- **Why earlier checks missed it:** The category's existence felt
  like sufficient measurement.
- **Fix/disposition:** Amendment requiring trap-rank recording and a
  per-query verdict.
- **Verification tier:** Agent-verified.
- **Reusable lesson:** Naming a test category isn't the same as
  defining what it measures.

**#12 — Historical defect report — non-reproducing; scope corrected**
- **Category:** Historical defect report — non-reproducing; scope
  corrected.
- **Finding:** Item 4 was scoped from a specific implementation-
  retrospective finding — `got` misreported as "Express." Real corpus
  import showed `got` correctly returns `framework: null`.
- **Observed symptom:** The benchmark's real detection run against
  `got` produced `null`, not "Express," with no code change having
  been made to detection logic.
- **Actual root cause:** Current `got` behavior is explained by
  framework detection reading production dependencies, while Express
  exists only in `devDependencies`. The cause or accuracy of the
  original historical report cannot be recovered from current
  evidence.
- **What caught it:** Real corpus import as part of item 2's
  benchmark work, incidentally producing the disconfirming evidence.
- **Why earlier checks missed it:** The report was carried forward
  without re-verification.
- **Fix/disposition:** ADR-010 — item 4 formally re-scoped from "fix"
  to "verify and regression-guard." No detection-logic change
  shipped, since there was no reproducing failure to fix. "Unknown"
  display semantics shipped regardless, since a null detection needs
  some honest rendering.
- **Verification tier:** Agent-verified (real corpus data, real
  `package.json` trace).
- **Reusable lesson:** A retrospective finding is a snapshot, not a
  permanent fact — carrying an old bug report into new scope without
  re-verifying it risks building a fix for something that may no
  longer exist, for reasons that may not be knowable in retrospect.

**#13 — Invalid throughput methodology (v1): OOM-driven padding measured as compute**
- **Category:** Benchmark defect (methodology mistake, self-corrected before use)
- **Finding:** An initial throughput measurement pooled chunks across files at batch size 32 with no padding awareness, producing a figure of roughly 17,411 ms/chunk (~236× slower than the current model).
- **Observed symptom:** An extreme, alarming slowdown figure that didn't match the model's documented characteristics.
- **Actual root cause:** Chunk sizes in the real corpus span 10–3,918 characters; batching without length-awareness pads every item in a batch to its longest member, producing a 384MB attention buffer that triggered OOM-driven swapping. The measurement captured memory pressure, not model throughput.
- **What caught it:** The same investigation noticed the result didn't match production's actual per-file batching pattern, and rebuilt the measurement against real production behavior for comparison.
- **Why earlier checks missed it:** No real throughput measurement existed yet to compare against; this was the first attempt, and its own construction was the defect.
- **Fix/disposition:** Discarded explicitly rather than reported as data; a corrected methodology (v2) replicated production's real per-file batching and re-measured both the candidate and the current model on the same real corpus, for a like-for-like comparison.
- **Verification tier:** Agent-verified.
- **Reusable lesson:** An extreme, surprising number is a prompt to check the measurement's own construction before trusting it, not a fact to report as-is.

**#14 — Candidate model's embeddings vary with batch composition — evaluation-validity risk**
- **Category:** Model characteristic / evaluation-validity risk
- **Finding:** The candidate model's quantized (q8) embeddings measurably shift (up to 3.45e-2 cosine distance) depending on what else shares their batch, while the current model and the candidate's own fp32 variant both stay near numerical noise (~1e-7) regardless of batch composition.
- **Observed symptom:** Discovered via a deliberate control comparison across three model/dtype combinations.
- **Actual mechanism:** The behavior is associated with the q8 model under changing batch composition/padding; the exact internal numerical mechanism was not isolated.
- **What caught it:** A controls-based investigation run specifically to check for this class of confound before trusting any comparison built on batched embeddings.
- **Why earlier checks missed it:** Batch-composition sensitivity is not something that shows up unless deliberately tested for.
- **Fix/disposition:** Every real evaluation run of this candidate was subsequently constrained to batch size 1, matching how queries are always embedded (singly).
- **Verification tier:** Agent-verified.
- **Reusable lesson:** Before trusting any comparison between a batched process and a singly-processed one, check whether the batched side's output actually depends on its batch composition.

**#15 — Extrapolated re-embed wall-clock time was significantly wrong**
- **Category:** Benchmark defect (estimation error)
- **Finding:** A throughput-based extrapolation predicted roughly 3.1 hours to re-embed the full benchmark corpus; the real, complete run took 9 hours 24 minutes for one repository alone.
- **Observed symptom:** The real run's duration was found only when actually performed.
- **Actual explanation:** The extrapolation sample did not represent full-run cost. Real file/chunk length distribution, tokenization cost, model overhead, and hardware behavior may have contributed, but their individual effects were not isolated. The real full run was already at batch size 1 (per #14's fix), so cross-item batch padding cannot be asserted as the cause of its duration. The measured fact that one sampled file processed faster unbatched than batched is retained as evidence batching was not uniformly beneficial — not as proof of what caused the batch-1 full-run's total duration.
- **What caught it:** Performing the real re-embed run and comparing its duration against the earlier prediction.
- **Why earlier checks missed it:** The original estimate was extrapolated from a smaller sample not representative of the full corpus's real size distribution.
- **Fix/disposition:** The wrong wall-clock prediction was explicitly corrected and removed from the durable record; the underlying per-chunk cost ratio between models was retained instead.
- **Verification tier:** Agent-verified.
- **Reusable lesson:** An extrapolation from a partial sample is a hypothesis, not a measurement — don't assert a specific cause for a duration whose contributing factors were never individually isolated.

**#16 — Initial dry-run evidence (v1.0.0, n=8): three criteria met, one failed on a thin sample**
- **Category:** Interpretive stage — initial evidence and initial explanation
- **Finding:** A first real dry-run comparison against the committed baseline showed three of four success criteria decisively met, and one — no regression on documentation retrieval — failed, with an 8-query documentation category.
- **Observed symptom:** A −25 percentage-point documentation regression against a baseline of only 8 documentation queries.
- **Initial interpretation adopted at the time:** The eight-query result alone did not establish which explanation generalized — a reasonable, stated uncertainty at the time.
- **What prompted revisiting it:** A structured review of the two specific failing queries, requested before accepting either reading as final.
- **Why the initial interpretation felt reasonable at the time:** Eight queries could not on their own establish whether two cutoff movements reflected a generalizing weakness.
- **Disposition:** Superseded by the boundary review and widened-controls stages below.
- **Verification tier:** Agent-verified.
- **Reusable lesson:** A plausible reading of a thin sample is not the same as a confirmed explanation.

**#17 — `compare-runs.ts` silently overwrote the committed baseline artifact**
- **Category:** Benchmark defect (tooling)
- **Finding:** The comparison script hardcoded its output filename, so running it against any pair of reports other than the original would silently overwrite the committed baseline artifact.
- **Observed symptom:** Found while producing the dry-run comparison, before it could cause real data loss.
- **Actual root cause:** The script was written for a single anticipated comparison and never generalized to repeated use.
- **What caught it:** Direct inspection of the tooling while producing the dry-run comparison.
- **Why earlier checks missed it:** The script had only been run once before this point.
- **Fix/disposition:** A required `--out=` flag was added; the committed baseline artifact's checksum was confirmed unchanged before and after.
- **Verification tier:** Agent-verified (checksum comparison).
- **Reusable lesson:** Any script that writes to a fixed path used more than once needs an explicit, required output target.

**#18 — Repository-completeness gate correctly refused to score an incomplete corpus (prevented-invalid-result)**
- **Category:** Prevented-invalid-result finding — the safeguard working as intended
- **Finding:** The benchmark runner's existing status gate refused to compute metrics against a repository that was not fully embedded.
- **Observed symptom:** None — a documented near-miss, not an observed failure.
- **What it prevented:** A partially embedded corpus repository producing plausible-looking but invalid metrics.
- **What caught it:** Confirmed directly while producing the dry-run comparison — the gate was tested and observed refusing correctly.
- **Why this is worth recording:** A safeguard that has never been tested is not a confirmed safeguard.
- **Disposition:** No change needed — confirmed-working infrastructure.
- **Verification tier:** Agent-verified.
- **Reusable lesson:** A defensive check that has never fired is unproven; when it actually catches a real near-miss, that's worth recording explicitly.

**#19 — Boundary review of the two failing documentation queries: two different real problems, not one**
- **Category:** Product defect + benchmark defect (ground-truth definition) — the finding that reopened the adoption decision
- **Finding:** Numerically, both failing queries' correct files moved to rank 4 — a boundary-level shift in both cases. But case inspection showed "mere random cutoff noise" was an insufficient explanation for either: **DOC-03** showed a genuine word-sense error, and its answer-bearing chunk actually ranked behind the same file's own best non-answer chunk. **DOC-08** showed a different problem: its ground truth was itself ambiguous — the displacing files were legitimate, correct destinations the original ground-truth file was designed to point to, exposing a benchmark-definition problem.
- **Observed symptom:** Individually inspecting each failing query's actual retrieved results, rather than trusting the aggregate percentage alone.
- **Actual root cause:** Two distinct, real issues that happened to produce numerically similar rank shifts.
- **What caught it:** A deliberate, requested per-query review.
- **Why earlier checks missed it:** The initial dry-run only reported the aggregate percentage.
- **Fix/disposition:** DOC-08's ground truth rewritten to be unambiguous; the adoption decision formally reopened pending a broader sample.
- **Verification tier:** Agent-verified.
- **Reusable lesson:** A numerically similar rank shift can hide two entirely different underlying problems.

**#20 — Widened evaluation (v1.1.0, n=17) added a deliberately designed control condition**
- **Category:** Interpretive stage — boundary review escalated to a broader, controlled re-test
- **Finding:** The documentation query set expanded from 8 to 17, specifically adding a deliberately designed and classified control group with no plausible code-file competitor.
- **Observed symptom:** N/A — a deliberate test construction.
- **Design rationale at the time:** If code-displacement were correct, control queries should show no regression, providing a clean test rather than another ambiguous aggregate number.
- **Disposition:** Directly enabled the falsification in the next entry.
- **Verification tier:** Agent-verified.
- **Reusable lesson:** When a hypothesis makes a falsifiable prediction, design a test case that could actually disprove it.

**#21 — The "code outranks documentation" hypothesis was falsified by its own control queries**
- **Category:** Interpretive correction / hypothesis falsification
- **Finding:** The control queries — deliberately designed so no plausible code-file competitor was present — showed the *worst* documentation degradation of any group in the widened set, directly contradicting the working hypothesis that code files were displacing documentation.
- **Observed symptom:** Documentation regression appeared broadly across the widened set, including and especially the control cases.
- **What caught it:** The controls specifically designed in #20.
- **Why earlier checks missed it:** The original 8-query set lacked a deliberately designed and classified control condition capable of testing the code-displacement mechanism cleanly — not that every original query happened to have a competitor, but that none had been chosen to test the case where one didn't exist. The widened control group itself was n=3; its direction was meaningful and contradicted the prediction, but remained thin.
- **Fix/disposition:** The "code displaces documentation" explanation formally retracted as the primary mechanism.
- **Verification tier:** Agent-verified.
- **Reusable lesson:** A hypothesis untested against a case designed to disprove it should not be treated as established, however plausible against the original evidence.

**#22 — Better-supported working diagnosis: weak discrimination among dense, similar documentation**
- **Category:** Product finding — a working diagnosis, explicitly not a final, isolated root cause
- **Finding:** The dense-documentation explanation fit the observed pattern better than the tested code-competition hypothesis.
- **Actual explanation, stated with its real limits:** Under this corpus, chunking, query set, and evaluation configuration, q8 discriminated less effectively among topically similar documentation. The evidence falsifies code displacement as the full explanation; it does not isolate an inherent internal property of the model, nor exclude interaction with this project's specific chunking or corpus composition. Other possible mechanisms were not exhaustively eliminated.
- **What caught it:** Comparing the regression pattern across the widened set against both candidate explanations.
- **Fix/disposition:** Recorded as the working, best-supported diagnosis; became the basis for scoping any future mitigation investigation.
- **Verification tier:** Agent-verified.
- **Reusable lesson:** When a hypothesis is falsified, search for a better-supported explanation stated with the same care about its limits as the falsified one deserved.

**#23 — Rollback's documented granularity was overstated**
- **Category:** Documentation error
- **Finding:** The spec's description of rollback implied per-repository granularity; the real constraint is one pgvector column, one dimension, whole database.
- **Observed symptom:** Found while actually exercising rollback for real.
- **Fix/disposition:** Spec corrected to state real, whole-database granularity; the underlying mechanism confirmed working, just not at the originally implied scope.
- **Verification tier:** Agent-verified (real rollback exercised: reverted, re-embedded, verified, rolled forward).
- **Reusable lesson:** A spec's implied scope should be checked against the real constraints of the system it describes, especially for safety mechanisms.

**#24 — Final decision: q8 held, not adopted, with the corrected diagnosis on record**
- **Category:** Product decision
- **Finding:** After the corrected diagnosis, the net evidence remained genuinely mixed: three of four criteria decisively met, the fourth failed under the corrected, better-understood diagnosis.
- **Basis for the decision, stated with its real limits:** v1.0.0/v1.1.0 reports are valid only for their own manifest versions, not comparable to each other; MiniLM-vs-q8 comparisons *within* v1.1.0 are valid (same manifest); overall Top-1 across the 40-query set is an unweighted benchmark-composition result, not a measured distribution of real user behavior; Chat retrieves multiple chunks, so file-level Top-1 is not a direct Chat-answer-quality metric; criterion 4 independently failed on Top-3, so none of these caveats reversed the hold decision — they qualify its strength, not its direction.
- **Fix/disposition:** MiniLM remains production. The candidate preserved as the leading code-retrieval candidate, with a real, itemized acceptance bar recorded for any future mitigation proposal.
- **Decision authority:** Person-approved. Supporting evidence: Agent-verified, with the limitations recorded above.
- **Reusable lesson:** A rigorous, multi-stage evaluation that ends in "hold" is not a failed evaluation — it avoided shipping a measured product regression into production.

**#25 — Dashboard: repository status never announced**
- **Category:** Product defect (accessibility)
- **Finding:** Tabbing to a repository row announced the repo name and actions, but never its status (Ready/Analyzing/Queued/Failed).
- **Observed symptom:** Confirmed directly by the person's own live NVDA session (Scenario 2).
- **Actual cause found afterward:** `StatusPill`'s label text was always correct, visible text — it sat outside any focusable element in the row. Tab navigation only stops at focusable elements, so a screen-reader user tabbing through skips static text between controls.
- **Fix/verification:** Status folded into the accessible name of the row's `Open` link via `aria-label`, with zero visual change to the pill. Person's live re-test heard "status: Ready" — Live-verified.

**#26 — Add Repository modal: Tab escapes into browser chrome**
- **Category:** Product defect (accessibility)
- **Finding:** Pressing Tab repeatedly inside the modal eventually reached the browser's own toolbar/address bar instead of cycling within the dialog.
- **Observed symptom:** Directly observed by the person during the live NVDA session (Scenario 3).
- **Actual cause found afterward:** The modal was a plain styled component with `role="dialog"`/`aria-modal="true"` but zero real focus management underneath — no code intercepted Tab at all, making the `aria-modal` attribute purely advisory.
- **Fix:** A shared `useModalFocusTrap` hook added, cycling Tab/Shift-Tab within the dialog's real focusable elements and restoring focus to the triggering button on close. A related latent issue — a visually-hidden ZIP file input that would have become an extra trap-cycle stop — fixed via `tabIndex={-1}`.
- **Verification tier, kept distinct:** Agent-verified — automated tests performing full Tab/Shift-Tab cycles confirmed focus never leaves the dialog, and live-browser checks confirmed the same against the real running app. Separately, the person's own live re-test observed Tab-after-Escape landing at a position consistent with focus having correctly returned to the trigger button — supporting the fix but not, on its own, an independent, exhaustive re-verification of the complete automated trap-cycle proof.
- **Reusable lesson:** An `aria-modal="true"` attribute is a claim, not a mechanism — it requires real focus-management code behind it.

**#27 — Delete confirmation modal: same Tab-escape**
- **Category:** Product defect (accessibility)
- **Finding:** Identical Tab-escape behavior to #26.
- **Observed symptom:** Directly observed during the live NVDA session (Scenario 4).
- **Actual cause found afterward:** The same underlying defect as #26. A related gap: the dialog didn't include the target repository's name in its own announcement, only via whichever button triggered it.
- **Fix:** Same `useModalFocusTrap` hook wired in; `aria-describedby` added pointing at the "Are you sure you want to delete [repo]…" text.
- **Verification tier:** Agent-verified (automated full-cycle trap tests + live browser checks), kept distinct from the person's live re-test, which heard the real "Are you sure you want to delete sindresorhus/escape-string-regexp? This action cannot be undone" wording.
- **Reusable lesson:** Same as #26.

**#28 — Overview: reported as zero real headings — did not reproduce on investigation**
- **Category:** Reported defect that did not reproduce — distinct from a fixed defect
- **Finding:** The original audit reported none of Overview's six fact sections registering as real headings via heading navigation.
- **Observed symptom:** Reported by the person during the live NVDA session (Scenario 6).
- **Actual finding on investigation:** Real browser and git-history evidence gathered before any fix: all four always-present sections were confirmed as real `<h2>` elements, and git history showed heading markup was introduced before the audit itself. Whether the original report was a transient misread, or reflected a build state not actually in front of the auditor at that moment, could not be established from available evidence.
- **Fix/disposition:** No redundant fix applied to code that was already correct. Real regression tests added instead, closing an adjacent, genuine gap (the conditional "Not analyzed" section had never been tested against real DB data before).
- **Verification tier:** Agent-verified (live DOM query + git history) at investigation; person's live re-test found 4 of 6 spec sections as real headings. A follow-up direct visual check confirmed the two absent sections were genuinely not rendered at all for the tested fixture. Live-verified for the resolution; the original report's cause remains unestablished.

**#29 — Search: no automatic announcement of loading or results**
- **Category:** Product defect (accessibility)
- **Finding:** Typing a search query produced no spoken feedback about loading or the eventual result count.
- **Observed symptom:** Confirmed twice by the person — an initial report and an explicit retry confirming no additional announcement existed.
- **Fix, describing both states implemented:** An `aria-live="polite"` region added that announces a "Searching…" state while a search is in progress, followed by the completion state — either the real result count or "No matches found." Person's live re-test confirmed both: "Searching…" after each keystroke, then real per-keystroke results.
- **Verification tier:** Agent-verified (2 new automated tests); Live-verified via the person's real-time re-test hearing both announcements.
- **Reusable lesson:** An async operation with real duration benefits from an interim "in progress" announcement, not just a completion one.

**#30 — Chat: response never announced, regardless of outcome**
- **Category:** Product defect (accessibility) — the most severe finding of the audit
- **Finding:** After submitting a question, nothing was spoken when the response arrived — confirmed independently on both the no-evidence path and a genuine successful answer.
- **Fix:** `aria-live="polite"` region wrapping each turn's response area, covering all real states uniformly.
- **Verification tier:** Agent-verified (2 new automated tests); Live-verified via the person confirming both paths spoken for real.

**#31 — Explorer: opening a file announces nothing**
- **Category:** Product defect (accessibility)
- **Finding:** Selecting a file and pressing Enter opened its content with no spoken confirmation.
- **Fix:** `aria-live="polite"` region announcing "Viewing [path]" on load, or the skip reason for skipped files.
- **Verification tier:** Agent-verified (2 new automated tests); Live-verified via the person hearing real filenames on real file opens.

**Synthesis, recorded after all three (#29–#31) were fixed, not before:** a real `grep -r "aria-live" src/` before any fix returned zero matches anywhere in the application. Search, Chat, and Explorer had different call sites but the identical underlying gap — no live region existed at all. This confirms the pattern proposed at audit time was the real, single cause.

---

**#32 — `boxen`: full root cause established and fixed**
- **Category:** Product defect (pre-existing; fully diagnosed and fixed here, following its initial discovery as entry #4)
- **Actual root cause:** Within the AVA snapshot directory, 12 files genuinely carry NUL bytes — the 11 `.snap` files plus one specific `.md` file (`main.js.md`). `.snap` was not in the binary-extension list; the binary-detection scan only checked each file's first 16 bytes, missing NULs occurring later. Reading NUL-containing content as UTF-8 fails at the database layer. The import inserted all files in one multi-row statement, so one poisoned value failed the entire batch; the import was not transactional, so the already-committed repo/job rows survived; the poller had no zero-file guard.
- **Fix:** Full-content NUL scan; `.snap` added to the binary-extension list as a secondary safeguard; the insert wrapped in a real transaction; a zero-file guard added to the poller.
- **Verification tier:** Agent-verified — real re-import produced exactly the 47 files predicted offline. Of the 13 files skipped in total, 11 were the genuinely NUL-carrying `.snap` files and 1 was `main.js.md`, both correctly classified as binary by the new scan. The thirteenth skipped file was `screenshot.png` — a genuine binary image correctly skipped through the existing extension-based binary detection, independently of the NUL-content fix and not part of the defect being addressed. Separately, 10 additional `.md` snapshot-report files, which do not carry NULs, were correctly indexed with real content. A dedicated new test deliberately bypasses the fix to reproduce the original real database error.
- **Reusable lesson:** A binary-detection check that only samples a fixed byte window at the start of a file can miss content-level problems occurring later in the file.

**#33 — `got`: reconciliation fix for orphaned analysis state**
- **Category:** Product defect (root cause remains an unrecoverable, out-of-band event — see entry #5)
- **What the investigation established:** The repository's stack facts were correct and populated, confirming a real import genuinely completed; no code path anywhere deletes `File` or `AnalysisJob` rows; real database activity statistics showed a deletion event shortly after the original import. Who or what performed the deletion could not be determined — a genuine, permanent limit of the investigation.
- **Fix:** Poller-level reconciliation — any repository in `analyzing`/`queued` with no live job is reconciled to `failed`.
- **Verification tier:** Agent-verified — a real poller tick against the real development database was observed transitioning the orphaned row, confirmed by real before/after query results.
- **Reusable lesson:** The reconciliation fix does not prevent out-of-band deletion from happening again; it prevents a repository from remaining indefinitely queued/analyzing without a live job by reconciling it to `failed`. (The separate scenario of a zero-file analysis being falsely marked complete is a different failure mode, addressed by #32's zero-file guard, not by this fix.)

**#34 — Deletion safety gate correctly prevented removal of active QA fixtures**
- **Category:** Prevented action — a process success, not a failed cleanup
- **Finding:** An earlier investigation recommended deleting three database rows as unused "pollutants," alongside the one genuinely dead `boxen` row. A gated deletion process — requiring full identity resolution, a real reference search, dependent-row counts, and a saved recovery record before any deletion — found all three "pollutant" rows were active, named fixtures with real dependencies in the Playwright and QA-walkthrough test suites.
- **What it prevented:** Deleting a fixture the non-ready gating tests and the Symbols/Search/Explorer walkthrough tests actually rely on to run.
- **Disposition:** Only the genuinely dead `boxen` row was deleted; the three retained rows documented by name, ID, and exact test dependency.
- **Verification tier:** Agent-verified (real codebase/test-file search for each candidate row).
- **Reusable lesson:** An empty or synthetic-looking row is not, by itself, evidence it's unused — a deletion gate that actually blocks on a real reference check is what makes this discoverable before data loss.

**#35 — `embeddings.ts`'s fixed batch size had no length-awareness**
- **Category:** Product defect (first identified as a latent risk during the embedding-swap dry run)
- **Finding:** Batches were capped only by item count, so several unusually long chunks in one batch could request excessive memory.
- **Observed symptom:** A real out-of-memory event during the embedding-swap dry run.
- **Fix:** Batches capped by both item count and a total-character-length budget; a single oversized item processed on its own.
- **Verification tier:** Agent-verified — deterministic unit tests reproduced the same input-size composition that caused the earlier real OOM and verified the new logic subdivides it safely; the tests did NOT recreate the memory-exhaustion event itself. End-to-end tests confirmed subdivision doesn't corrupt output. The original OOM was deliberately not reproduced live a second time, given the memory-constrained machine.
- **Reusable lesson:** A batching scheme sized only by item count is a real risk whenever item sizes vary widely.

**#36 — Inter font resolving to the fallback stack**
- **Category:** Product defect (found during item 5's visual parity review)
- **Finding:** The application-wide font-inheritance path — a shared `font-sans` utility class — resolved to the browser's default system stack instead of the loaded Inter font.
- **Actual root cause:** A CSS custom property the shared utility class depended on was never defined; the font itself loaded correctly, but the reference to it was broken.
- **Fix:** The missing custom property wired through to the real, already-loaded font variable.
- **Verification tier:** Agent-verified — confirmed no resolvable value before the fix; after the fix, real computed styles confirmed resolving to Inter on Dashboard's root and headings specifically. Because the mechanism is a shared utility class, the fix is expected to apply everywhere it's used — but not every individual screen was separately inspected.
- **Reusable lesson:** A font that loads successfully can still fail to render anywhere it's referenced if the connecting CSS variable is never defined.

**#37 — Large text files could bypass the 500MB import safety budget**
- **Category:** Product defect (security-adjacent)
- **Finding:** Files exceeding a per-file parse ceiling were counted toward the repository's total size budget but allowed to continue processing before that budget was checked — a repository of many large text files could exceed 500MB undetected.
- **Observed symptom:** Discovered while closing an adjacent, previously-open boundary test, not by that test itself.
- **Fix:** The repository-wide budget check moved so it applies to every file before any file-specific early exit.
- **Verification tier:** Agent-verified — a real large-file set confirmed bypassing the budget before the fix and correctly triggering it after; boundary-case tests re-run unaffected. A self-correction: an initial new test's assertion was itself wrong about the invariant; the test was corrected, not the code, since the code's existing behavior there was intentional.
- **Reusable lesson:** A safety budget needs verification against every code path that could add to it, not just the path original tests happened to exercise.

**#38 — IMPORT-04: branch selection was never implemented**
- **Category:** Unimplemented requirement, honestly discovered and deliberately deferred
- **Finding:** A written acceptance criterion (branch-selective import) had no implementation anywhere — not partial, a complete absence.
- **Observed symptom:** A real import against a real non-default branch recorded the default branch's commit instead.
- **Actual root cause:** The backend parameter was computed but never used; the UI control doesn't exist at all.
- **Disposition:** Not implemented within this closeout (real new feature scope, not a bug fix); current and deferred behavior documented plainly, criterion marked unimplemented rather than satisfied.
- **Verification tier:** Agent-verified (real cross-branch import test, checked against the real repository's actual branch commits).
- **Reusable lesson:** A written acceptance criterion can go completely unimplemented for a long time if nothing ever specifically exercises it.

**#39 — Documentation and implementation diverged on reanalysis behavior**
- **Category:** Documentation error
- **Finding:** Architecture documentation stated reanalysis deletes and replaces file, symbol, and chunk records; the actual code only deletes symbol and chunk records.
- **Origin of the disagreement:** Not established from available evidence. What is proven: a real, current divergence, and the implementation's own inline comment already acknowledged the narrower, real behavior.
- **Fix:** Documentation corrected to describe real behavior; full delete-and-replace explicitly left unimplemented, recorded as a separate future decision.
- **Verification tier:** Agent-verified (direct code read, cross-referenced against the documentation claim).
- **Reusable lesson:** A comment acknowledging an implementation gap is worth cross-checking against documentation describing that code, regardless of which was written first.

**#40 — A testing record falsely attributed a requirement to architecture documentation**
- **Category:** Documentation error — a distinct subtype from #39
- **Finding:** The test-status record cited a set of expected database indexes as required "from architecture.md." A real query confirmed the indexes don't exist. Architecture.md contains no such requirement anywhere.
- **Fix, stated precisely — only one document contained an error:** The test-status record's false attribution corrected to describe the real inventory directly. Architecture.md contained no incorrect statement; it was separately edited to add the real index inventory as new information, since the topic had never been documented there before — a completion, not a correction. Adding the missing indexes logged as separate future work, not implemented now.
- **Verification tier:** Agent-verified (direct read confirming absence of any prior claim; real index-listing query).
- **Reusable lesson:** A citation to another document is itself a claim that can be wrong, independent of the underlying fact — correcting a false citation is a different edit than correcting a false statement.

**#41 — AnalysisJob ordering: investigation found this already resolved, no code change needed**
- **Category:** Investigation with a null result
- **Finding:** A long-tracked known issue (queries not explicitly ordering by job creation time) was checked during closeout.
- **Actual finding:** All relevant real query sites already explicitly order by creation time, descending — apparently addressed as a side effect of unrelated work, never marked resolved.
- **Disposition:** Marked resolved in documentation; no code change made.
- **Verification tier:** Agent-verified (direct read of every real query site).
- **Reusable lesson:** A tracked known-gap item should be periodically re-checked against current code rather than assumed still open indefinitely.

**#42 — Test-quality gaps found and logged, not fixed**
- **Category:** Test-quality gap
- **Finding:** Two existing tests provide weaker evidence than their passing status implies — one has real timing fragility tied to a cold-compile step; the other performs real actions and takes a screenshot but contains no actual assertion.
- **Disposition:** Both logged explicitly, neither fixed — out of this closeout's scope.
- **Verification tier:** Agent-verified (direct reading of each test's actual assertions, or lack thereof).
- **Reusable lesson:** A passing test is not automatically strong evidence — whether it asserts anything meaningful is worth checking directly.

---

**#43 — Retrospective Section 2's provisional first pass, checked against the primary source before finalization, exposed an earlier closure/recording gap**
- **Category:** Process safeguard exposing an earlier closure/recording gap — not, itself, a repeated instance of the project's recurring mistake. The first Section 2 draft was explicitly labeled provisional and pending a primary-source pull; drafting it from memory was not a completed false claim, since it was never presented as final. The real failure being exposed here predates this retrospective entirely: an earlier claim, made elsewhere in the project's status record, that item 4 had closed, when its acceptance rows in fact remained untested and incomplete in the actual test-status document. The retrospective-compilation process did not repeat that earlier failure — it came close to silently inheriting it by summarizing from memory, but the deliberate decision to check the primary source before finalizing caught it. That check is the safeguard working correctly, not a mistake being made and then corrected.
- **Finding:** A fresh, real extraction of the actual test-status document, requested specifically to verify a provisional draft before finalizing it, revealed that a prior claim of item 4's closure had never actually been reflected in that document: all four real acceptance criteria still read as untested, with no later entry ever revisiting them.
- **Real verification then performed, criterion by criterion, pulled from the actual completion report rather than restated from memory:**
  - **OVERVIEW-U1** (a repository with undetected framework information shows an honest non-detection state, not a guess): executed for real against a real running screen; real evidence, no LLM call involved. **Agent-verified.**
  - **OVERVIEW-U2** (a repository with correctly-detected framework information is not over-corrected to the non-detection state): executed for real against a real running screen; real evidence, no LLM call involved. **Agent-verified.**
  - **EXPORT-U1** (the structured data export represents undetected framework information as a real null value, not an invented label): executed for real via a real function call against real data; no LLM call is involved in this export path at all. **Agent-verified.**
  - **EXPORT-U2** (the prose repository-summary export communicates non-detection honestly, on both of its two possible generation paths): the deterministic, non-LLM generation path was executed for real, with its exact real wording captured. The second, LLM-generated path was NOT force-triggered — deliberately, to avoid spending real, limited API quota on a live call — and was instead checked by direct code inspection, confirming both paths draw from the same underlying data and pass through the same single generation call site. **This sub-path is Code-reviewed only; it was not executed live.**
- **Whether all four rows were genuinely eligible to close:** Item 4 was closed with mixed evidence: three criteria Agent-verified through execution, while EXPORT-U2 retains a Code-reviewed-only LLM sub-path alongside its Agent-verified deterministic path. It was not Live-verified by direct person confirmation in this pass, and should not be described as such.
- **What caught it:** A deliberate decision not to trust memory for a section whose entire template instruction was to pull directly from the primary record, followed by a fresh, real extraction of that record.
- **Fix/disposition:** The test-status document's original rows were updated in place with the real evidence and real tiers above.
- **Verification tier:** Mixed — OVERVIEW-U1, OVERVIEW-U2, EXPORT-U1, and EXPORT-U2's deterministic path were Agent-verified through real execution; EXPORT-U2's LLM-generated sub-path remains Code-reviewed only. The original recording gap was separately Agent-verified through direct comparison with the test-status document.
- **Reusable lesson:** Checking a provisional summary against its primary source before finalizing it is what prevented this document from silently inheriting an earlier, real recording gap — worth treating as confirmation the practice works, not as a new instance of the mistake it exists to catch. And separately: a claim of completeness with a mixed evidence tier underneath it should be summarized at its lowest real component, not its highest.


---

## 4. Where the process deviated from — or wasn't covered by — `principles.md`, `orchestrator.md`, `roles/`, or `playbooks/`

### Category 1 — Existing guidance followed and demonstrably effective

**1. Checkpoint/commit discipline**
- **Source:** `principles.md` #7; `orchestrator.md`'s mandatory task-packet checkpoint step.
- **What actually happened:** Used consistently across the reviewed packets — a real, mandated checkpoint step and required `git status`/HEAD reporting before and after. Directly connected to how **#8** (a stale HEAD claim) was caught: the receiving agent's checkpoint check compared the stated expectation against real repository state before acting, and reported the mismatch.
- **Distinction:** Checkpointing is not the same mechanism as completion-report validation, and **#7** demonstrates the difference precisely. The checkpoint step did not prevent the unauthorized file from being staged — nothing in the pre-commit process constrained the actual staged diff. The problem was exposed afterward, by the orchestrator inspecting the real committed file count against the expected count. The broader checkpoint discipline worked as designed; the specific gap it left is exactly what Category 4's staged-diff proposal exists to close.
- **Verification tier:** Agent-verified (real `git status`/HEAD checks across reviewed packets).

**2. Verification tiers**
- **Source:** `playbooks/verification-tiers.md`; `principles.md` #8.
- **What actually happened:** The framework was not applied perfectly on first attempt in every case — **#4/#5** were initially described too loosely as "Live-verified" before being corrected to "Agent-verified against the real development system." The framework's real value is that it repeatedly enabled these corrections and prevented the final record from retaining an inflated tier. That the tiers held up under repeated scrutiny — including scrutiny of this retrospective's own drafting (**#43**) — is the actual evidence the framework worked.
- **Verification tier:** Agent-verified throughout, including the corrections themselves.

**3. Spec-drift rule**
- **Source:** `principles.md` #3 ("every such change gets a one-line entry in `docs/10-decisions/`").
- **What actually happened:** The rule was applied repeatedly, but not uniformly via its literal mechanism. Some corrections received real, dedicated ADR treatment — **#21/#23**'s rollback-granularity correction as an amendment within ADR-009; **#39**'s reanalysis-semantics correction as ADR-011. Others did not receive a dedicated one-line ADR entry as literally specified — **#1**'s Gemini→Groq correction was handled via direct document edits without a dedicated ADR; **#40**'s false-citation fix was handled via document corrections and a future-work note. **Once divergences were surfaced, the rule's underlying intent was repeatedly honored: they were recorded or corrected rather than knowingly left as silent contradictions.** This does not imply the rule prevented drift, or was applied uniformly before discovery — **#38, #39, #40, and #43** all show real disagreements that persisted for a long time before being found.
- **Verification tier:** Agent-verified (each correction traceable to a real commit; ADR presence or absence checked directly).

**4. Failure-path-testing playbook — deliberately induced cases only**
- **Source:** `playbooks/failure-path-testing.md`.
- **What actually happened:** The playbook's method — deliberately inducing real failures rather than simulating them — was genuinely applied in specific cases: **#37**'s PREPROC-03 bypass used deliberately constructed oversized test archives; one of the three real failures behind the embedding swap's SWAP-05 gate was a deliberate process kill. Other real failures were not deliberately induced in the playbook's sense: the real out-of-memory event underlying **#35** was observed, not deliberately recreated; the session interruption referenced in the swap arc's evidence may not have been deliberately induced at all. These naturally occurring failures supplied real, useful evidence, but are a different category from the playbook's deliberate-induction method.
- **Verification tier:** Agent-verified (real induced conditions where deliberate; real observed conditions where not).

**5. `visual-parity-review.md`**
- **Source:** The provisional playbook, triggered once for item 5's observability panel.
- **What actually happened:** The Inter font defect (**#36**) was correctly classified in the real parity report's own classification table as a genuine **Fail**, not "Environment variance." The playbook's real demonstrated value was correctly separating a genuine, real Fail from the item it was found in and classifying it as independent/pre-existing rather than blocking item 5's closure. A separate, genuinely environment-dependent finding in the same report (a rendering-width difference across two tested viewports) was the one correctly classified as "Environment variance" — the two should not be conflated.
- **Verification tier:** Agent-verified (parity evidence) + Live-verified (person's own visual confirmation).

---

### Category 2 — Existing guidance missed, violated, or applied too late

**1. The placement-always-Claude-Code project rule, violated once**
- **Source:** ADR-005 (project-specific).
- **What actually happened:** Deviated from once under real usage-limit pressure; the deviation is the proximate context in which **#7** occurred. Reaffirmed immediately afterward.
- **Verification tier:** Agent-verified (the reaffirmation and its reasoning are on record).

**2. `roles/security-reviewer.md` + `playbooks/security-review.md` — arguably should have been invoked, was not**
- **Source:** `orchestrator.md`'s situational-routing list — the stated trigger includes "external inputs" and "elevated failure risk," not authentication alone.
- **What actually happened:** Item 7's real work touched public repository/ZIP content parsing and binary-vs-text classification (**#32**, **#37**), import transaction and database-failure handling (**#32**), and a real safety-boundary bypass on the 500MB import budget (**#37**) — all plausibly within "external inputs" and "elevated failure risk" as the trigger is actually worded. Authentication remaining deferred to V2/V3 does not, on its own, establish this specific trigger's other conditions were absent. The honest record is that this guidance was arguably applicable and was not invoked — not that its non-invocation was checked and correctly found inapplicable. No retroactive security review was performed as part of compiling this retrospective; **the gap is recorded, not resolved, and is carried forward as an open decision in Section 9.**
- **Verification tier:** Agent-verified that the trigger's literal wording covers external-input handling; not verified whether a security review would have found anything, since one was never run.

---

### Category 3 — Situations not covered by existing guidance, requiring improvisation

*(Checked directly against the current kit source files before being listed here.)*

**1. Merge-not-rebase as a standing branch-update rule**
- **Checked against:** `principles.md`, `orchestrator.md` — neither addresses merge-vs-rebase mechanics. No coverage found.
- **What was improvised:** A project-specific rule adopted because `PROJECT-STATE.md` asserts specific commit hashes as fact, and a rebase would silently invalidate any hash already recorded as true. Direct context for **#8**.
- **Verification tier:** Agent-verified (every merge round confirmed prior hashes survived as ancestors, checked individually).

**2. Benchmark ground-truth curation methodology**
- **Checked against:** `roles/qa-engineer.md` covers testing existing behavior, not constructing a new measurement instrument. No file addresses this.
- **What was improvised:** The agent-proposes/person-verifies split by category difficulty, the "test files are never valid ground truth" rule, content-verification-over-filename-inference as a standing requirement. Connects to **#2, #3, #9–#11, #19–#22**.
- **Verification tier:** Person-verified (the ground truth itself) + Agent-verified (methodology execution).

**3. The NVDA manual-testing protocol**
- **Checked against:** `playbooks/automated-tooling-blindspots.md` establishes why manual testing is needed but not how to conduct one.
- **What was improvised:** The complete guide — setup, per-scenario purpose/steps/non-leading criteria, results forms, recovery instructions — built from scratch. Produced seven real audit findings: six confirmed product defects and one reported heading defect that did not reproduce on investigation, per **#25–#31**'s exact record.
- **Verification tier:** Live-verified (the protocol's real output, both the confirmed defects and the one non-reproducing report).

**4. The deletion gate protocol**
- **Checked against:** No file addresses safe deletion of real data specifically; `principles.md` #7 covers drastic/irreversible actions generally but not a gate mechanism for agent-proposed deletions.
- **What was improvised:** The full protocol, invented for Item 7's real cleanup need — not established guidance that was merely applied. Connects to **#34**, and to **#4/#5**'s discovery that made it necessary.
- **Verification tier:** Agent-verified (the gate observed correctly refusing three of four proposed deletions).

**5. The mixed coding-agent routing policy**
- **Checked against:** `docs/10-decisions/adr-tool-setup.template.md` addresses choosing a tool for a project; nothing addresses operating two agents concurrently under a routing policy.
- **What was improvised:** The policy, through two real iterations — a context-weight split, then refined to a type-based split after **#7** demonstrated the weight-based version's judgment-call seam was itself a failure point. Concrete observed outcomes: Claude Code correctly stopped at multiple real gates rather than guessing (**#2**, and others across the swap arc); the one real routing failure was **#7** itself, under the weight-based policy's since-abandoned exception.
- **Verification tier:** Agent-verified (the concrete incidents cited, not an aggregate performance judgment).

**6. Cross-document citation verification**
- **Checked against:** `principles.md` #3 covers spec-vs-code drift specifically; no file addresses verifying one document's citation of another.
- **What was improvised:** Nothing formal — caught incidentally (**#40**) while performing an unrelated correction.
- **Verification tier:** Agent-verified (direct read of both documents involved).

**7. Multi-version benchmark comparability rules**
- **Checked against:** No file addresses versioning a benchmark's own measurement definition.
- **What was improvised:** The `manifestVersion` locking mechanism and the explicit non-comparability rule across versions. Connects to **#10, #11, #23, #24**.
- **Verification tier:** Agent-verified (tested in practice across the v1.0.0→v1.1.0 transition and held).

**8. Falsifiable-hypothesis benchmark design**
- **Checked against:** No file addresses designing test cases specifically capable of disproving a working hypothesis.
- **What was improvised:** The matched-pair query design and the deliberate no-competitor control-query category — the mechanism that produced **#21**'s falsification. The design successfully falsified the leading hypothesis, but the designed control group contained only three queries — decisive against the specific proposed mechanism within this benchmark's real evidence, not an exhaustive proof of the replacement diagnosis.
- **Verification tier:** Agent-verified (the design's real output — a genuine falsification, on a small but real control sample).

---

### Category 4 — Guidance that should now be added, clarified, or revised

**1. Clarify `orchestrator.md`'s "name exactly which files changed" habit.** Related guidance existed but did not cover this failure precisely — it addresses *what* changed, not *whether a change has actually happened yet*. **#6** is the direct result. A one-line addition — "never describe a file as changed in past tense until the task producing that change has actually run and been confirmed." *Connects to #6.*

**2. Add an explicit hash/state-freshness convention to `PROJECT-STATE.template.md` or `orchestrator.md`.** Any stated commit hash in a handoff document should be dated, and receiving agents explicitly instructed to verify HEAD independently. *Connects to #8.*

**3. Add a "verify staged diff before commit" step to the kernel or checkpoint discipline.** `principles.md` #7's checkpoint rule was shown, in **#7**, to be insufficient on its own in a dirty worktree. A concrete addition: before any commit, confirm the exact staged path list matches the authorized file list for the task. *Connects to #7.*

**4. Add a documentation-citation-verification step to the spec-drift principle.** When one document cites another as the source of a requirement, the citing claim should be checked against the actual cited document's content. *Connects to #40.*

**5. Shared-mutable-document merge reconciliation — a cautiously labeled candidate, not a proven pattern.** Parallel work on shared mutable documents created an observed reconciliation risk, but the retrospective did not catalogue the incidents with enough precision to support a new general rule. Retain this as a project-specific candidate for future guidance if the pattern recurs and is documented more systematically.

**6–9. Four candidates for the framework-review conversation** (candidates only, not recommendations already eligible for promotion — the kit's own two-project promotion rule requires independent recurrence elsewhere):
- The mixed coding-agent routing policy.
- The benchmark-design methodology (ground-truth curation split, versioned comparability, falsifiable-hypothesis test design).
- The manual/live-testing protocol structure.
- The deletion gate protocol.


---

## 5. Ad hoc decisions made that the current kit doesn't cover

**Threshold for inclusion:** a decision qualifies for this section only if it is a **material** decision — one that changed scope, acceptance evidence, product behavior, or future obligations — **and** its substantive answer was not already supplied by an existing principle, role file, playbook, or a prior recorded rule from earlier in this same project. Applying orchestrator.md's decision-making *process* (lay out tradeoffs, recommend, get confirmation) does not by itself exempt a decision from this section — that process is covered guidance regardless of content; what matters is whether the *content* of the answer was dictated by something already on record.

### Completeness check across all seven Upgrade items

The eight candidates specifically raised for review, evaluated against the threshold:

| Candidate decision | Verdict | Governing source, if omitted |
|---|---|---|
| Re-scoping item 4 from a detection fix to verification/regression-proofing after the headline defect did not reproduce | **Qualifies** | The decision-making process was covered (orchestrator.md's decision habits); the substantive content of the re-scope itself was not dictated by any rule. |
| Choosing honest `Unknown` semantics for undetected framework facts, rather than inventing a label | **Omitted** | Governed by prior recorded project precedent: Symbols' empty-state treatment and Export's deterministic-fallback pattern, both explicitly cited as the basis for this choice at the time it was made. |
| Requiring a person-operated NVDA pass instead of treating automated accessibility checks as equivalent | **Omitted** | Directly governed by `playbooks/automated-tooling-blindspots.md`, which states automated tooling passing is not evidence an issue isn't there, and names manual testing as covering a structural blind spot automated tooling cannot. |
| Canceling proposed fixture deletions after the deletion gate found real dependencies | **Omitted** | Governed by the deletion-gate protocol's own already-established stop condition (Section 4, Category 3, item 4) — canceling on a found reference was the protocol's own explicit rule being followed. |
| Choosing non-ready semantics and fixture renaming rather than special-casing reconciliation logic for test data | **Qualifies** | No existing principle addresses whether production logic should special-case for the benefit of preserving a specific test fixture's literal state. |
| Deferring IMPORT-04 rather than introducing branch-selection feature work during closeout | **Omitted** | Governed by `principles.md` #4 (no invented scope) and an already-established, repeatedly-applied project pattern of deferring real-but-out-of-scope findings. |
| Fixing PREPROC-03 immediately because it was small and safety-adjacent | **Qualifies** | No existing rule sets a size/risk threshold for fixing something immediately versus deferring it during closeout. |
| Correcting reanalysis documentation while deferring destructive delete-and-replace implementation | **Qualifies, narrowly** | The documentation-correction half is directly governed by `principles.md` #3. The separate decision *not* to implement the described destructive behavior as a side effect of that correction was not dictated by anything else. |

### Qualifying ad hoc decisions

**1. Re-scoping item 4's substantive target, once its premise didn't reproduce**
The decision to redefine item 4's actual deliverable — from "fix a confirmed detection bug" to "verify detection is correct and add a permanent regression guard" — once the originating defect failed to reproduce against current code. No rule dictated this specific redirection. Formalized in ADR-010.

**2. Non-ready semantics over special-cased reconciliation for a QA fixture**
Once the poller's reconciliation fix (Section 3, #33) was known to flip a specific `analyzing`-state QA fixture to `failed`, the decision was to accept that outcome and rename the fixture and its tests to reflect the fixture's real contract (a non-ready-state gate, not specifically an analyzing-state gate) — rather than adding special-case logic to production reconciliation to preserve the fixture's original literal state. Reasoned directly: a failed repository is a valid, stable fixture for a non-ready gate, and special-casing production behavior for test convenience was rejected as the wrong direction. Formalized in the test rename and its accompanying comments.

**3. Choosing to fix PREPROC-03 within the current closeout after explicit review, rather than deferring it to future scope**
Once the large-text-file bypass of the 500MB safety budget was found (Section 3, #37), the fix received an explicit decision and confirmation before execution — small diff, safety-adjacent, worth fixing now. This is proportional scoping, not an inconsistency with IMPORT-04's much larger deferral: the two outcomes were based on materially different size and risk profiles, not on an arbitrary or contradictory standard.

**4. Declining to implement destructive reanalysis semantics as a side effect of correcting the documentation describing them**
Distinct from the documentation correction itself (governed by `principles.md` #3): the decision that a real, described-but-unbuilt destructive behavior (file-row delete-and-replace on reanalysis) should not be implemented merely because correcting the document that described it created an opportunity to do so. Formalized in ADR-011, with the implementation explicitly left as a separate, future architectural decision.

**5. Benchmark-construction judgment family** — three related but distinct decisions, none dictated by any template, grouped here because they share a common thread:
   - **5a.** Negotiating DOC-08's ground-truth wording between naturalness and verifiable uniqueness — resolved across three real iterations, ending in an explicit, acknowledged trade-off.
   - **5b.** Per-query classification judgment calls in the widened set — most notably, classifying a documentation query about a caching feature as a genuine "control" specifically because that feature's real implementation lived in an external dependency, not in any file of the repository itself.
   - **5c.** Adding the golden benchmark suite as new scope during the original Layer 1 interview, and sequencing it ahead of the embedding-swap evaluation it would end up gating — one of the phase's most consequential ad hoc calls, since the swap's later hold decision depended entirely on this infrastructure existing first.

**6. Evaluation-validity and future-candidate constraint family** — three related decisions about how strictly to treat a newly-discovered measurement risk:
   - **6a.** Sequencing the v1.1.0 re-evaluation — running the already-embedded candidate model's evaluation first, snapshotting its embeddings, then migrating schema and re-embedding the baseline model second — specifically to avoid an otherwise-necessary multi-hour re-embed of already-evaluated work.
   - **6b.** The five-point acceptance bar constructed for any future embedding-candidate mitigation proposal, built to prevent a future proposal from being evaluated more loosely than the original candidate was.
   - **6c.** Treating batch size 1 as a hard requirement for this specific model's comparable evaluation runs, immediately upon discovering its batch-composition sensitivity (Section 3, #14) — not asserted as permanent. Batch size 1 remains mandatory for this model's comparable benchmark runs unless batch invariance is later demonstrated and the evaluation is deliberately re-baselined; ADR-009 does not forbid reconsideration.

**7. Recording the final hold decision's evidentiary architecture**
Two decisions, consolidated as one shared judgment about recording a mixed-evidence outcome honestly: first, insisting a criterion which failed on the approved benchmark be recorded as *failed* — separately from the genuinely open question of whether that failure *generalizes* beyond the tested sample; second, explicitly recording that Chat's multi-chunk retrieval means file-level Top-1 is not a direct proxy for real answer quality, while still holding the decision on a separately, independently failing criterion (Top-3). No template governs either judgment; both were constructed for this decision and formalized in ADR-009's final decision section.

**8. Flagging, but not investigating, a Chat retrieval-quality tangent found mid-audit**
During the NVDA accessibility audit, two reasonable-sounding Chat questions both returned no-evidence responses against a real repository — a real, potentially product-relevant finding, clearly outside that audit's scope. Flagging it once, explicitly, without pursuing it further within that task, was a one-time, unguided scope-boundary decision — no playbook governs this boundary, and no claim is made here that this establishes a reusable norm for future cases. **This decision is recorded only as an unowned flag in `testing.md`, without an ADR, scoped task, or disposition.** Its unresolved disposition is a product-quality loose end, not a kit-guidance question — Section 9 decides among investigating it as scoped future work, retaining it as an evidence-gathering watch item, or closing it as insufficient evidence of a retrieval defect.


---

## 6. Prune and consolidate — not just append

*A direct audit of the kit's own files (`principles.md`, `orchestrator.md`, `roles/`, `playbooks/`, `README.md`, `CHANGELOG.md`, templates) for duplication, contradiction, and accreted bloat — independent of this project's own experience, though one finding below is directly corroborated by it.*

### Missing release record / cross-file completeness gap

**1. `CHANGELOG.md` has no V4.2 entry, despite the kit being at V4.2 everywhere else** — `README.md` extensively references "V4.2," its own provisional-items ledger, and specific V4.2 file additions; the kit's own governing documents (`orchestrator.md`, `principles.md`) are the V4.2 versions actually in use throughout this project. `CHANGELOG.md` itself ends at "V4.1 — 2026-07-19." README and the active files identify V4.2; `CHANGELOG.md` simply fails to record it — an omission, not two files making conflicting claims. This is not a theoretical finding — it was already independently discovered and recorded by this project's own ADR-007, at the moment of kit adoption, when the changelog mechanism's "first real update-propagation event" found its own source document missing the entry it needed. Restated here because Section 6 asks for an audit of the kit files themselves. **Not resolved by this project** — correctly identified as the next kit release's responsibility, per `playbooks/kit-release-review.md`, not a mid-project kit edit.

### Duplication

**2. `principles.md` #7 and `kernel/AGENTS-KERNEL.md.template` rule 5 — deliberate, and well-guarded**
Both state the same drastic-action/human-only rule in different words. This is not a defect: the kernel file explicitly names `principles.md` as canonical and states its own drift-detection condition. Flagged here only because Section 6 asks for duplication to be surfaced regardless of how well-managed — this is the pattern other deliberate duplications in the kit should be modeled on.

**3. `principles.md` #5's security-baseline sub-rules and `roles/security-reviewer.md`'s Invariants — real, unmanaged overlap, with the finding scoped precisely**
`principles.md` #5 states, among its baseline NFRs: authorization checked per-endpoint, access denied by default with trusted-side enforcement, and security-sensitive behavior requiring negative tests. `roles/security-reviewer.md`'s own Invariants section restates substantially the same three rules in close paraphrase. What can actually be established: the current rules substantially overlap; this duplication may well be intentional, since a role file needs to remain operationally self-contained rather than requiring an implementer to cross-reference `principles.md` mid-task; and the one real, missing element is an explicit canonical-source/cross-review statement — neither file states which is canonical, and no drift-detection language exists between them, unlike the well-guarded #7/kernel pair above. **This finding is scoped to the duplication itself.** No wording drift between the two sources has actually been demonstrated, and this project's separate, already fully-covered finding (Sections 4 and 8: the security-reviewer role was never invoked this phase despite item 7's work plausibly meeting the trigger) is not shown to have any causal connection to this duplication — the role went uninvoked regardless of whether its content was accurate, current, or duplicated. **Recommended action:** retain the operational summary in the role file as-is; explicitly identify `principles.md` #5 as the canonical source; add a requirement that the role file be reviewed whenever that principle changes.

### Accreted bloat

**4. `playbooks/responsive-css-debugging.md`'s embedded, dated field note — pruning action made explicit**
The playbook's closing note ("Note from real testing (2026-07-25)...") is a specific, dated incident narrative embedded directly in an otherwise general procedural playbook. **Recommended action:** distill the reusable instruction — correct diagnosis doesn't guarantee correctly-scoped execution, so the actual diff should be checked even when the fix seems well understood — into the playbook's main procedure as a standing instruction; then move or remove the dated project-specific anecdote from the general playbook, so the lesson survives without retaining historical narrative as permanent procedural text.

### Adjacent finding — doesn't cleanly fit the three named categories, flagged per the section's own instruction not to leave gaps unchecked

**5. `RETROSPECTIVE.template.md`'s two-project promotion rule doesn't define what counts as a "project"**
The template does not define whether a new phase or engagement on the same codebase counts as a second project for its own promotion rule. **This retrospective uses the conservative rule: same-codebase continuation is one project-level evidence stream, not independent recurrence.** Section 7 will use that interpretation unless the framework review explicitly adopts another definition. **Recommended:** define "independent project" in the template using at least a distinct codebase or an independently initiated engagement as the threshold, so repeated use within one long project cannot satisfy the promotion rule by volume alone.


---

## 7. Two-project promotion rule — before adding anything permanent

Per the template's classification table and Section 6's now-established conservative rule: **every finding in this document, however many times a pattern occurred, is one project's evidence.** This project is project 2 on the kit, same Trailhead codebase as project 1 — a same-codebase continuation, not independent recurrence, regardless of internal repetition. Nothing below is eligible for immediate promotion on this project's evidence alone unless a severe safety/data-loss/irreversible-action justification applies.

### Part A — reusable kit-guidance candidates, classified

*Only candidates whose substance could apply to a different project entirely — not this specific codebase's specific bugs.*

| Candidate | Classification table target | Status | Source |
|---|---|---|---|
| The deletion-gate protocol | Applies to a specific task type → `playbooks/` | **First observation — hold.** Genuinely proven once (Section 3 #34), correctly prevented real data loss. Although safety-relevant, immediate promotion is unnecessary because the existing drastic-action principle (`principles.md` #7) already supplies a baseline safeguard; the new, detailed protocol can remain provisional until independently exercised on a second project, without leaving destructive actions unguided in the meantime. | Section 4, Cat. 3 §4 |
| Benchmark-design methodology (curation split; falsifiable-hypothesis control design; version locking and non-comparability) | Applies to a specific task type → `playbooks/` (or a new dedicated one) | **First observation — hold.** Real, positive evidence (directly produced Section 3 #21's falsification), constructed entirely within this one project. | Section 4, Cat. 3 §2, 7, 8 |
| The manual/live-testing protocol structure | Applies to a specific task type → `playbooks/` | **First observation — hold.** Real, strong evidence (seven real audit findings), but tested only in a screen-reader-specific context; unproven generalization to other manual-verification domains. | Section 4, Cat. 3 §3 |
| The mixed coding-agent (placement-always / implementation-by-complexity) routing policy | Applies to a specific task type → `adr-tool-setup.template.md`'s guidance, or a new playbook | **First observation — hold, with a caveat.** No further routing incident is recorded after the type-based policy was adopted, following one real violation under a weaker, earlier version (Section 3 #7). Absence of a further recorded incident is not proof of overall performance or optimality — it is what the record shows, no more. | Section 4, Cat. 3 §5 |
| Staged-diff verification before commit | Candidate for `principles.md` #7 or the kernel | **First observation — hold.** The gap it addresses (Section 3 #7) is real and the proposed fix is small and generic — but it has zero implementations or uses; there is evidence its absence caused a real problem, not evidence the proposed mechanism itself works. |
| Hash/state-freshness dating convention for handoff documents | Candidate for `PROJECT-STATE.template.md`/`orchestrator.md` | **First observation — hold.** Implemented and used repeatedly within this project (Section 3 #8 and its aftermath) — real evidence the convention functions as intended, but only within one project's internal, repeated use. |
| Merge-not-rebase as a rule specifically for hash-bearing handoff records | Candidate for `orchestrator.md` or `PROJECT-STATE.template.md`'s git-workflow guidance | **First observation — hold; conditionally applicable to projects whose durable records depend on stable commit identities**, not generalized into a universal merge-over-rebase rule. | Section 4, Cat. 3 §1 |
| Past-tense file-claim clarification | Applies to `orchestrator.md`'s Communication habits specifically | **First observation — hold.** Small, precise, genuinely reusable regardless of project; evidenced by exactly one incident (Section 3 #6). |
| Documentation-citation-verification step | Applies to `principles.md` #3 specifically | **First observation — hold.** A real, distinct sub-case of spec drift (Section 3 #40) not currently covered by the existing rule's literal text. |
| `playbooks/visualization-prompting.md`'s credit-exhaustion section — proposed wording split | Revision to an existing, already-provisional playbook | **Not a new-item candidate** — a proposed correction to an existing provisional item's own wording (Section 8, item 5a). |

**Insufficiently evidenced — held without proposing kit promotion:**

| Candidate | Status |
|---|---|
| Shared-mutable-document merge reconciliation guidance (Section 4, Category 4, item 5) | **Insufficiently evidenced candidate — hold without proposing kit promotion.** Deliberately retained only as a cautiously evidenced, project-specific candidate — the incidents were real but not catalogued with enough precision this round to support designing shared guidance from them. More precise recurrence should be catalogued before any shared guidance is designed. |

**Every underlying need identified in Part A is real, and every one is worth carrying into the framework-review conversation explicitly as a hold, not a promotion** — though, as noted above, staged-diff verification specifically remains a proposed mechanism with zero uses, a different evidentiary status than the items with real, observed application.

### Part B — product-specific findings, explicitly out of promotion scope

The following categories of findings from Sections 3–6 are **not eligible for this table at all** — they concern Trailhead's own codebase, not reusable kit guidance — and are grouped here so their exclusion is a stated decision, not a silent omission:

- **Trailhead-specific product defects and their fixes** (Section 3, #4, #5, #17, #18, #32–#37): `boxen`'s NUL-handling and transactionality, `got`'s reconciliation, the benchmark tooling's checksum and completeness-gate fixes, `embeddings.ts`'s batching, the Inter font resolution, PREPROC-03's bypass.
- **Trailhead-specific documentation corrections** (Section 3, #1, #2, #3, #9–#11, #21, #23, #39, #40): provider drift, corpus/database specification errors, ground-truth rationale, ranking methodology, rollback granularity, reanalysis semantics, the false citation. The pattern's own structural significance is addressed separately in Section 9.
- **The seven NVDA audit findings: six confirmed product defects and one reported heading defect that did not reproduce** (Section 3, #25–#31).
- **Trailhead-specific ad hoc product/technical decisions** (Section 5): the DOC-08 wording, the v1.1.0 sequencing, the acceptance bar for a future embedding candidate, PREPROC-03's proportional-fix decision, and the rest.
- **The embedding-swap hold decision itself, and its full evidentiary arc** (Section 3, #13–#24). Its methodology is captured in Part A; the decision's actual content and outcome has no promotion candidacy of its own.
- **Documented, uncorroborated historical-report findings** (Section 3, #12).

None of these are omitted by oversight — each is excluded because it fails Part A's threshold, not because it lacks value.

### Part C — corrections and maintenance outside the promotion rule

*These are fixes or clarifications to existing kit records, not new patterns requiring two-project recurrence before they can even be corrected. Final application of each still belongs to the framework-review decision.*

1. **Missing V4.2 `CHANGELOG.md` entry** (Section 6, finding #1) — a completeness gap in an existing kit record, to be filled at the next kit release per `playbooks/kit-release-review.md`.
2. **Explicit canonical-source/cross-review statement between `principles.md` #5 and `roles/security-reviewer.md`'s Invariants** (Section 6, finding #3) — a cross-reference addition, not a new practice.
3. **Distilling the responsive-CSS lesson and moving/removing the dated anecdote** in `playbooks/responsive-css-debugging.md` (Section 6, finding #4) — an editorial pruning action on existing text.
4. **`principles.md` #7 and `kernel/AGENTS-KERNEL.md.template` rule 5** (Section 6, finding #2) — reviewed as intentional, canonically guarded duplication; retain unchanged. No consolidation action required.
5. **Defining "independent project" in `RETROSPECTIVE.template.md`** (Section 6, finding #5) — the two-project rule's own undefined term is a maintenance/definition gap in the rule itself. Section 7 has used the conservative interpretation throughout this document; the framework review should resolve the definition explicitly.

**Two unresolved routing triggers, existing guidance not applied — tracked here, disposition reserved for Section 9:**

6. **`roles/security-reviewer.md` + `playbooks/security-review.md`** — the guidance exists; its trigger was arguably met by item 7's real work and the role was not invoked. Whether to perform a bounded review now, or explicitly accept and defer it, remains open for Section 9.
7. **`playbooks/documentation-planning.md`** — the guidance exists; its trigger genuinely fired (item 6's fixes made the README's screen-reader-limitations line stale) but the playbook was never invoked. Whether the trigger's routing language needs clarification, or this was simply a one-time application miss, is a distinct diagnostic question recorded here as unresolved.


---

## 8. Provisional-item verdicts — mandatory, none skipped

Per `RETROSPECTIVE.template.md`, every V4.2-marked provisional or provisional-speculative item gets a verdict here. Eight ledger items, per `README.md`. Verdicts distinguish four states: **not triggered**, **triggered but not invoked**, **partially evaluated**, and **successfully used once** — these are not interchangeable, and none collapse into a single confirmed/unused binary.

**1. `playbooks/session-recovery.md` — RETAIN PROVISIONAL (one successful project-level observation)**
Triggered once, real: during item 3's embedding-swap dry run, a background re-embed process was interrupted with no completion record. The exact interrupted state found: real database inspection was required before resuming, and the playbook's core instruction — diagnose real state before resuming, never trust the prior report — was followed directly. This state and its recovery concern the embedding-swap dry run's own incomplete-run tracking, not item 7's separate `got` orphaned-repository/job-reconciliation defect (**#5, #33**); the two are distinct and should not be conflated. The recovery worked exactly as the playbook describes: real state was checked, nothing was trusted from the prior, incomplete report, and the interruption became reinforcing evidence for the swap's failure-resilience testing rather than lost work. One successful use within one project is real, valuable evidence — it does not, on its own, satisfy the kit's two-project confirmation standard. Retain provisional.

**2. `playbooks/design-handoff.md` + its template — RETAIN PROVISIONAL, with a proposed timing clarification**
Used once, item 5's observability panel. Real value delivered: the implicit-wrapper-context step caught a genuine ambiguity, the prototype-shortcut step correctly excluded a mock-only review affordance from the shipped spec, and the process surfaced a real gap in the approved mock (no loading state existed) resolved deliberately rather than left to an implementer's guess. **A real deviation from the written procedure's implicit assumption, proposed as a clarification for the next revision:** the playbook assumes handoff happens adjacent to implementation. In this project, four other Upgrade items shipped between the panel's approval and its actual implementation; the handoff was deliberately written early to freeze the artefact's inventory before drift could occur across that gap. This worked, but the playbook should explicitly address non-adjacent handoff-to-implementation timing. One successful use within one project; retain provisional pending independent recurrence.

**3. `playbooks/visual-parity-review.md` — RETAIN PROVISIONAL (one successful project-level observation)**
Used once, item 5's panel. Found one genuine, correctly-classified Fail (**#36**) and one genuine Environment-variance classification, correctly distinguished from each other rather than conflated. A real environment limitation (screenshot capture failing this session) was correctly worked around per the playbook's own sanctioned computed-style/DOM-geometry alternative, with the resulting evidence's real limits stated rather than overclaimed. The human final-validation gate was honored — an explicit, direct confirmation, not assumed from the artefact's existence. One successful use within one project; retain provisional.

**4. `roles/security-reviewer.md` + `playbooks/security-review.md` + the security template — RETAIN PROVISIONAL (triggered but not invoked; effectiveness not evaluated)**
Never invoked this project. Auth remained explicitly deferred to V2/V3 throughout, which was the reason cited whenever this trigger was considered. However, item 7's real work — public repository/ZIP content parsing and binary-classification logic, import transaction handling, a real safety-boundary bypass on the 500MB import budget — plausibly falls within the trigger's actual stated conditions ("external inputs," "elevated failure risk"), independent of the auth question. This is a missed-trigger-or-application question, not a clean non-applicability finding, and the record cannot say whether invoking it would have found anything, since it was never run. **Carried forward to Section 9 as an unresolved routing issue** — whether to perform a bounded review of the external-input changes now, or explicitly accept and defer that review.

**5a. `playbooks/visualization-prompting.md`'s credit-exhaustion section — PARTIALLY EVALUATED / RETAIN PROVISIONAL**
Used once, item 5's panel build — but under a different condition than the section describes. The written procedure addresses recovery when generation credits run out unexpectedly mid-project. In this project's actual use, the code-first working mode the section recommends was chosen deliberately, by decision, not forced by an actual credit-exhaustion event — credits were never observed to run out this round. This establishes only that the fallback working mode was usable as a deliberate choice; it does not evaluate exhaustion detection or the actual transition into that fallback under real exhaustion conditions, which is what the section is specifically written to cover. Partially evaluated — the section's own wording should be revised to separate "the fallback mode works, chosen deliberately" from "exhaustion-triggered recovery works," since only the first has real evidence behind it.

**5b. `playbooks/visualization-prompting.md`'s tool-comparison section — NOT TRIGGERED**
No head-to-head comparison between visualization or coding tools occurred this project — Magic Patterns was the only tool used throughout. Not triggered; provisional items get one more project before a removal decision applies.

**6. `orchestrator.md`'s "Decision habits" section — RETAIN PROVISIONAL (strong evidence within one project, awaiting independent recurrence)**
Used dozens of times across this project, at essentially every substantive fork: item 3's multiple reopen/adopt/hold decisions, item 4's re-scoping, item 6's fix-grouping confirmation, item 7's IMPORT-04 deferral, and the coding-agent routing policy's own iteration. What the record actually establishes: no recorded decision bypassed the person's confirmation gate — every fork was presented with real tradeoffs and a reasoned recommendation, then held for explicit approval before proceeding. Several decisions were legitimately reopened later when better evidence arrived (item 3's reopen after the boundary review, most notably) — those reversals were driven by new evidence, not by an unauthorized default being acted on without confirmation. The record cannot establish "zero regretted defaults," since regret is not something this record can measure; what it can establish is that the confirmation gate itself was never bypassed. Extensive, consistent use within one project; retain provisional pending independent recurrence on a second project.

**7. `roles/art-director.md` + `playbooks/creative-direction-exploration.md` + its template — NOT EVALUATED THIS PROJECT**
Not triggered this Upgrade phase — its UI work was entirely scoped fixes and additions to an already-approved design system, with no moment requiring new visual identity or creative direction. This project's record does not establish whether the ledger considers this item eligible for evaluation on project 1 as well; absence of any mention in this project's own record is not evidence about a different project's history. Record only what this project establishes: unused, not evaluated this project. Marker retention follows the ledger's own actual lifecycle rule for speculative items.

**8. `playbooks/documentation-planning.md` + its template — RETAIN PROVISIONAL (trigger occurred, playbook not invoked, therefore effectiveness not evaluated)**
This project's actual trigger condition — "existing reader documentation has become false" — genuinely occurred: the public README's screen-reader-limitations line went stale the moment item 6's accessibility fixes shipped, and was genuinely corrected. But the correction happened as an ad hoc addition bundled into an unrelated closeout task (item 7's Group C), not via this playbook's own structured procedure. The trigger firing and the playbook being invoked are two different events, and only the first happened here — the ad hoc fix does not validate the playbook's own procedure. **Carried forward to Section 9 as an unresolved routing issue** — a real trigger condition fired correctly while the corresponding tool sat unconsulted, worth surfacing as its own finding about how situational-routing triggers get missed in practice.


---

## 9. Summary for the framework-review conversation

*Ranked priority order. Each item states its Section 7 promotion status where applicable.*

### The two highest-value findings

**1. Project records repeatedly described the system more confidently or completely than the implementation and evidence justified**
Six real cases across four different Upgrade items: provider drift (#1), the never-instantiated benchmark corpus (#2), the incompatible-database spec (#3), the false FK-index citation (#40), the reanalysis-semantics divergence (#39), and the IMPORT-04 branch-selector gap (#38). **These are not all the same failure mode** — Gemini→Groq is provider drift, not an unbuilt feature; IMPORT-04 genuinely describes behavior never implemented; the corpus was planned but never instantiated. What unites them is the umbrella pattern above, not a single mechanism.

**They were caught through fresh primary-source verification of several kinds** — execution, database inspection, code tracing, and cross-document comparison — **not execution alone.** Reanalysis semantics and the false index citation in particular were exposed partly through direct code/document comparison rather than by running anything.

This is the most consequential finding in the retrospective because it is a claim about *how this project's recording practice fails* structurally, independent of any single document or feature.

**Proposed structural question for the framework-review conversation:** whether every satisfied acceptance criterion must cite evidence appropriate to the claim — executable evidence where feasible, with any lower-tier boundary stated explicitly. (Not every legitimate criterion is automatically executable; the existing evidence-tier framework already supplies the more accurate rule.) **This proposed rule is itself first observation — hold**, not eligible for permanent kit adoption on this project's evidence alone. The individual methodology candidates this pattern motivated (documentation-citation-verification, the credit-exhaustion wording split) are likewise held per Section 7, Part A.

**2. The embedding-swap arc as a complete demonstration of rigor paying for itself — hypothesis, falsification, corrected diagnosis, honest hold**
Entries #13–#24 together are the strongest evidence in this project that a slower, more careful evaluation produces a *better* decision than a faster one. The original 8-query documentation evaluation **could have supported adopting a model that the widened benchmark later showed had a broader documentation-retrieval regression.** The widened evaluation reduced each query's influence on the cutoff result, added deliberately designed controls, and tested whether the original explanation survived new evidence — it did not (#21), and was replaced by a better-supported diagnosis (#22), a categorically more valuable outcome than a more confident version of the same wrong answer. The final decision (#24) also models recording a mixed-evidence outcome honestly, distinguishing "failed" from "may not generalize." **Promotion status:** the benchmark-design methodology is held at first observation (Section 7, Part A); the decision's content is Trailhead-specific (Part B) with no promotion candidacy — its value here is entirely as a worked example of the methodology.

### Everything else real, in descending priority

**3.** The complete NVDA audit-to-fix-to-reconfirmation cycle (#25–#31, plus the manual-testing protocol) — strongest evidence that a required manual-verification step, done by a first-time non-expert operator with a well-built guide, finds real defects automated tooling structurally cannot. Held at first observation.

**4.** The mutual orchestrator/agent error-catching record (#6, #7, #8, #43) — real evidence the verification discipline runs in both directions. The one real violation (#7) and its correction are as valuable as the successes.

**5.** The deletion-gate protocol (#34) — one clean, high-stakes save. Held at first observation; not urgent for promotion since `principles.md` #7's baseline covers the safety ground meanwhile.

**6.** The mixed coding-agent routing policy's evolution (#7 and its correction) — a policy that failed once, was diagnosed precisely, and was corrected to a judgment-free rule. Held at first observation, with the explicit caveat that "no further incident" is not proof of optimality.

**7.** Section 6's kit-audit findings (Section 7, Part C) — five real, low-drama maintenance items with no promotion candidacy, ready for the next kit release.

### The three carried-forward open items — final decisions

**A. Security review — COMPLETED. Real outcome recorded below, not merely a decision to review.**

The bounded review was decided, run, and closed within this
retrospective's own compilation. **What it actually found, rather than
what was hoped for:**

- **Two real bypass paths neither item 7 nor any prior verification
  had looked for.** (4c) Symlink entries called `getData()` with no
  size bound of any kind, taking an early `continue` before the
  repository budget was ever consulted. (4d) The general path
  allocated before checking, so a single heavily-compressed entry
  could attempt an allocation far exceeding the budget before being
  rejected.
- **The proposed fix was gated on an assumption that had to be
  proven first, and this gate mattered.** The review's own
  recommendation rested on checking `entry.header.size` — an
  attacker-controlled value — with the claim that a hostile lie
  "could only cause rejection, never a bypass." That claim was
  unverified. The operator required it be proven before any fix
  shipped. **It was proven, with real evidence:** `adm-zip` allocates
  at most the declared size (`Buffer.alloc(_centralHeader.size)`) and
  passes `maxOutputLength` to `zlib.inflateRawSync`, so an
  under-reported entry throws rather than over-allocating —
  demonstrated with a real 300KB payload patched to declare 4096
  bytes, and separately confirmed for the STORED (non-zlib) path via
  CRC failure. Had the invariant failed, the header check would have
  shipped as theater.
- **Both findings fixed and verified**, with actual-byte accounting
  retained (the header check is early rejection, not a replacement).
  Regression clean against the known baseline.
- **Severity re-assessed S3 → S2 for both**, with reasoning recorded
  in both directions: reachable against the code as it stood (not
  latent), but genuinely limited in impact — local memory exhaustion
  of a local-only tool, no execution, exfiltration, escalation, or
  persistence. Narrowing worth stating: the header-lie vector is
  specific to operator-supplied ZIP uploads, since GitHub generates
  its own zipballs.
- **`docs/07-architecture/security.md` did not exist** — a required
  input for the security-reviewer role, meaning the role could not
  fully operate as designed on its first invocation. Now created,
  with the threat model, accepted-risk posture, and this review's
  findings.
- **Four residual risks explicitly accepted by the operator**
  (2b temp-directory disk exhaustion — accepted and deferred, with OS
  cleanup stated as neither guaranteed nor relied upon; 1c
  indexed-but-empty ambiguity — accepted and deferred as S4 with
  intended future behavior recorded; the post-fix ~500MB
  single-buffer residual — accepted, with the explicit note that this
  is a *buffer* ceiling, not a *process* ceiling; and the
  no-authentication posture — accepted **conditionally**, for local
  single-operator use only, explicitly not authorizing public,
  shared, hosted, or untrusted-network deployment, with any such move
  triggering a new review before deployment).
- **A borrowed-guarantee dependency recorded rather than assumed:**
  the `adm-zip` protection requires Node >= 15; this repo's real
  enforcement comes entirely from Next.js's own binary hard-gating at
  >= 18.17.0, which could change on a Next upgrade without this repo
  noticing — and does not cover the test/typecheck/db/benchmark
  scripts at all, meaning the bounded invariant test, not the runtime
  floor, is the actual regression signal. An `engines` declaration
  was added and described honestly as a compatibility declaration
  producing an npm warning, **not** hard enforcement.

**The decision that generated the most value here was requiring the
invariant be proven rather than assumed.** The review's own
recommendation was sound in direction and unverified in its critical
premise; the gate is what separated a real fix from a plausible one.
That is the same lesson as finding #1 above, arriving one more time,
in the closing act of this retrospective's own compilation.

**B. Documentation-planning routing — DECIDED: a broader routing-process gap, not an isolated miss.**
Do not revise the documentation-planning trigger's wording unless a direct reread finds it ambiguous — its existing trigger appears clear. But the miss is not isolated: **this same phase also plausibly missed the security-review trigger.** Two different situational tools went uninvoked when qualifying work emerged inside broader, already-running tasks. The better-supported diagnosis: **situational triggers can be overlooked when qualifying work appears incidentally during an already-running task.** Carried forward as a **first-observation candidate** for a general trigger re-check at material scope changes or closeout. `playbooks/documentation-planning.md` remains provisional — its effectiveness is still unevaluated, since it was never invoked.

**C. Chat retrieval-quality tangent — DECIDED: close as insufficient evidence, with explicit reopening conditions.**
The unowned flag is closed now. **This does not mean Chat was tested and cleared** — it means two incidental questions, from one repository in one session, do not justify opening a new investigation. Reopen only if one of the following occurs: a reproducible failure on a benchmark-grounded question; repeated similar failures across repositories; a real user report with enough detail to reproduce; or new retrieval evidence directly implicating this behavior.
