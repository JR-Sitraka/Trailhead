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
