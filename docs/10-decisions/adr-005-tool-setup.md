# ADR-005: Implementation tool setup

**Status:** Accepted

**Date:** 2026-07-20

**Update (2026-07-21, second):** Clarifying "manual relay... no direct
file-writing role" for Claude Code, since literal practice diverged
from the literal wording without actually violating the decision's
intent. Confirmed with the person: Claude Code has been used
exclusively to mechanically write exact, orchestrator-provided
markdown content (PROJECT-STATE.md, KNOWN-GOOD.md, architecture.md,
ADR files, testing.md) into their exact stated repo paths — no
interpretation, no original content, no code, no implementation
decisions. Kilo Code alone has done every round of actual
implementation work (schema, routes, preprocessing logic, tests) via
the task packets specified for it.

**Clarified rule going forward:** Claude Code may be used as a
mechanical file-writer for exact, pre-specified content handed to it
verbatim — this does not constitute "wiring it into the repo" in the
sense this ADR's original decision was protecting against. Claude Code
must NOT be given code-writing tasks, ambiguous instructions, or asked
to make any implementation decision, however small — that remains
exclusively Kilo Code's role. If this line ever gets blurry in
practice (e.g. asking Claude Code to "fix a typo" that requires
judgment about intent), stop and treat it as a real second-agentic-tool
decision requiring its own conversation, not an extension of this
carve-out.

**Context:** MVP-B Slice 1's planning is complete (PRD through
testing, all 9 layers). Before implementation starts, this project
needs a real, decided tool setup — not a default silently inherited
from the PRD's original placeholder framing ("Kilo Code as default...
open to evaluation").

**Decided:**

- **IDE / editor:** Cursor.

- **Agentic coding tool:** Kilo Code as primary. Claude Pro and
  ChatGPT Plus remain available, but explicitly as **manual, chat-only
  fallback** when Kilo Code stalls — not a second agentic tool, not
  wired into the repo, no direct file-writing role. This is a
  clarification of the PRD's original framing, not a change to it: the
  PRD already named these as "fallback resources," and this ADR
  defines precisely what "fallback" means in practice (a person
  manually relaying guidance, not a tool with its own write access).

- **Model:** Kilo Code's **Auto Free** tier (`kilo-auto/free`) —
  confirmed (search, 2026-07-20) to be a real, built-in Kilo Code
  model tier that automatically routes requests to zero-cost hosted
  models, no manual configuration required. Direct match for this
  project's standing zero-spend discipline (`product-prd.md`'s
  Constraints section), applied here to development tooling cost, not
  just the product's own runtime LLM calls. Revisit if Auto Free's
  output quality proves insufficient for real implementation work —
  Kilo Code's per-task model assignment makes stepping up to a paid
  model for specific hard tasks a config change, not a re-architecture.

- **MCP servers:**
  - **Chrome DevTools MCP (official Google) — added.** The one
    clear, justified addition: `TOOL-RESEARCH.md` already names
    browser-inspection tooling as "the highest-value category found so
    far" for exactly the kind of pre-merge self-check
    `frontend-engineer.md` calls for, and Slice 1's actual first
    implementation work is porting five already-approved Magic
    Patterns mocks (Dashboard/Overview/Explorer/Symbols/Search/Ask)
    into real Next.js code — direct DevTools access to confirm actual
    computed styles/rendering closes the loop `frontend-merge-checks.md`
    describes, rather than relying on "it builds and looks right."
  - **Design-system tooling — deliberately not added.** Its stated use
    case in `TOOL-RESEARCH.md` is auditing an *existing* codebase's
    already-written design system — not a fit for greenfield
    implementation from an already-approved, already-formalized
    `component-specs.md`. Nothing to extract that isn't already
    written down.
  - **API-testing tooling — deliberately not added.** `TOOL-RESEARCH.md`
    itself: "defer until real, stable behavior exists to point it at —
    picking a tool before there's a spec or real traffic to test
    against is premature." No real endpoints exist yet. Revisit once
    `architecture.md`'s API contracts are actually implemented.

- **Subagent / multi-agent delegation:** single-agent-linear, the
  kit's existing reasoned default — unchanged, but now reinforced by
  tool-specific evidence, not just the general research
  `TOOL-RESEARCH.md` already cites: Kilo Code's own "Orchestrator
  mode" is reported (search, 2026-07-20) to cost roughly 2-3x more
  tokens than single-agent mode for comparable tasks — a concrete,
  same-tool data point on top of the general multi-agent-overhead
  findings already on record. The two narrow exceptions
  (`TOOL-RESEARCH.md`'s context-quarantine-for-read-heavy-exploration,
  and fresh-session-not-subagent for review passes) still apply
  unchanged.

**Decision:** Cursor + Kilo Code (Auto Free tier) as primary
implementation setup; Claude Pro/ChatGPT Plus as manual fallback only;
Chrome DevTools MCP added; design-system and API-testing tooling
deliberately deferred; single-agent-linear delegation, unchanged from
the kit's existing default.

**Consequences:**
- `kernel/AGENTS-KERNEL.md.template` should be copied to the project
  root as `AGENTS.md` (or Kilo Code's equivalent persistent-instructions
  location) now that a real tool is decided — this wasn't done earlier
  specifically because this ADR was deliberately deferred until now.
- Zero-spend discipline now extends to development tooling, not just
  the product's own runtime — worth remembering if Auto Free's
  quality ever forces a real conversation about paying for a stronger
  model; that would be a genuine, real decision to make explicitly,
  not a silent scope-creep of the "zero-spend" framing.
- Chrome DevTools MCP being added here means `frontend-merge-checks.md`
  and `ui-code-integration.md`'s playbook guidance about browser-
  inspection tooling is no longer hypothetical for this project — it's
  a real, available tool starting now, and task packets for porting
  the Magic Patterns mocks should reference it explicitly where
  relevant, per `orchestrator.md`'s task-packet-compilation mechanism.
- No cloud/hosted infrastructure decision was made here (Postgres
  remains local-only per `architecture.md`, unchanged) — this ADR is
  scoped to the coding-agent tool setup only, not a deployment
  decision.

---

# Amendment (2026-07-28) — mixed coding-agent policy adopted

**Trial outcome:** Claude Code, trialed across the full item-2
benchmark implementation (stage A discovery gate, ADR-008 corpus/DB
resolution, ground-truth review, ranking-rule change, symbol
verification support) — **satisfactory, confirmed by the person.**
Evidence on record in PROJECT-STATE's history: stopped correctly at
two distinct gates rather than guessing or inventing; caught the
orchestrator asserting an unwritten artifact into PROJECT-STATE;
chose merge-over-rebase for a stated principled reason and verified
it held across six real branch divergences; declared explicitly what
it had NOT verified (permalinks never opened).

**Decision — mixed-tool policy, not a full switch:**
- **Claude Code** for tasks that are context-heavy, require holding
  multiple stacked amendments/decisions in view, or produce a
  hard-gated artifact other work depends on.
- **Kilo Code** for routine, well-specified, single-purpose tasks —
  adopted starting 2026-07-28, primarily to conserve Claude usage.
- **The orchestrator states the intended tool at the top of every
  task packet from this point forward**, with a one-line reason, so
  the routing decision is a stated fact in the packet, not an
  implicit default.

**Mechanical note:** no new environment check is required for this
switch — Kilo Code's persistent-instructions behavior (loads
`AGENTS.md` every session; only `@file` mentions are genuinely
selective) is the behavior this kit's task-packet format was already
designed against (see kernel/README rationale). Packets built for
Claude Code transfer to Kilo Code without adjustment on that count.

**Consequence:** logged as this decision's home per the kit's own
switching guidance (evaluate jointly, log as an ADR-005 update, not a
silent swap) — satisfied here.
