# Global Principles

These rules apply to every project built from this kit. They do not change
per-project. If a rule below conflicts with something in a project-level
doc, this file wins unless the project doc explicitly overrides it and says why.

**Precedence among the kit's own files:** this file is the constitution —
it wins over `orchestrator.md`, `README.md`, and every `roles/*.md` file
if they ever conflict. `orchestrator.md` defines the planning assistant's
behavior and may cite this file but never restates a rule with different
meaning. `README.md` describes process and ordering, not rules — if it
ever states something that reads as a rule, that's a bug in README, not
a second source of truth. Every cross-cutting concept used by more than
one file (like the verification tiers below) is defined once, here —
other files reference it, they don't redefine it.

## 1. Ambiguity escalation

If a spec doesn't answer a question an agent needs to proceed, the agent
must stop and ask — not invent an answer and continue. This applies to
every role in `/agents`, at every layer. "The spec didn't say" is never a
justification for a guess; it's a trigger to raise the question back to
whoever owns that document.

## 2. Review split: compliance vs. quality

Every review checkpoint in this framework is split into two passes:

- **Agent pass (compliance)** — checks against something already written
  down: tokens, IA hierarchy, acceptance criteria, accessibility baseline.
  Produces a pass/fail/unverified list (see the verification tiers below —
  a static check often can't confirm everything; an honest "can't verify
  this from what I have" is a valid outcome). No subjective judgment.
- **Human pass (quality)** — checks things a spec can't fully encode: does
  this make sense, does this flow feel right, is this the right call even
  if it's technically compliant. This is never delegated to an agent.

Compliant *and* honestly-unverified output both reach the human pass —
only a genuine fail is blocked before that point. An item marked
Unverified is not stuck; it's a flag for the human to look at directly,
not a dead end. The human is always the final gate on quality; the agent
is always the gate on drift.

## 3. Spec drift policy

When implementation reveals a spec was wrong or incomplete:

- The spec is updated, not silently ignored. Code and docs that disagree
  is treated as a bug in the docs.
- Every such change gets a one-line entry in `docs/10-decisions/` (see the
  ADR template) — what changed, why, what it invalidates upstream.
- If the change invalidates a decision in an earlier layer (e.g. an
  architecture change breaks a UX assumption), that upstream doc is
  reopened. This framework is a loop with re-entry points, not a strict
  one-way pipeline.

## 4. No invented scope

No role may add a feature, flow, field, or requirement that isn't traceable
to a document upstream of it. If something seems obviously missing, that's
an escalation (rule 1), not an invitation to fill the gap.

**Exception worth naming:** if an agent independently adds the same
unrequested thing across multiple, separate generations, that's a signal
worth taking seriously, not a violation to strip out reflexively. Convergent
unprompted behavior often means the spec has a real gap the agent is
compensating for. Formalize it explicitly (update the spec, log why in an
ADR) rather than either silently keeping it undocumented or silently
deleting it.

## 5. Baseline non-functional requirements

Unless a project's `07-architecture/architecture.md` overrides these
explicitly, every project inherits:

- Accessibility: WCAG AA minimum.
- Every feature spec's "Error States" section is mandatory, not optional.
- Every externally-facing input has a stated validation rule — "trust the
  client" is never acceptable as a default.
- **Secrets and credentials are never hardcoded in source** — API keys,
  database URLs with embedded passwords, tokens: environment variables
  only, and confirm `.env`/equivalent is actually in `.gitignore` before
  the first commit, not assumed. Agents write hardcoded secrets by
  default unless told not to — this must be stated, not inferred.
- **Authorization is checked per-endpoint, not assumed from
  authentication alone.** Being logged in and being allowed to access
  *this specific resource* are different checks; a feature spec that
  only says "requires login" hasn't specified authorization.

## 6. Definition of done, project-wide

A layer is "done" when its output document is complete AND the next role
in the chain has confirmed they have everything they need from it — not
when the author feels finished. If the next role has to guess anything,
the layer isn't done.

## 7. Drastic or irreversible actions default to human-only

Rule 1 (ambiguity escalation) covers ordinary uncertainty. This is a
stricter case: if an instruction is ambiguous about *who* should carry
out a drastic, disruptive, or irreversible action — restarting a
machine, deleting data, force-pushing over history, revoking access,
anything with a real cost if done at the wrong moment — an agent must
never resolve that ambiguity by acting. Default to reporting the
situation and waiting for a person to decide and act, even if a note
somewhere could plausibly be read as authorizing the agent to do it
itself. A note written with a human reader in mind is not the same as
an instruction to an agent, and must not be treated as one. Getting
this wrong once (interrupting real, in-progress work with zero warning)
costs far more than asking unnecessarily every time.

This is one instance of a broader default: **commit or branch before any
batch of agent-driven changes.** A bad edit that's one `git revert` away
is a non-event; the same edit with no checkpoint behind it is a real
loss. Cheap, unconditional, applies regardless of how careful the agent
or the instructions were.

## 8. Verification has four tiers

This is the kit's single most cross-cutting concept, used by
`orchestrator.md`, `roles/repo-mapper.md`, `docs/09-testing/`, and
`RETROSPECTIVE.template.md`. The canonical tier definitions live in
`playbooks/verification-tiers.md` — one file, loadable by the coding
agent (which never reads this one) and by the planning assistant alike,
so the definitions can't drift into conflicting versions across files.
No other file redefines them; this section states the policy. Never
round a lower tier up to a higher one for the sake of a tidy summary:

1. **Live-verified (person)** 2. **Agent-verified** 3. **Partially
verified** 4. **Code-reviewed only** — full definitions, the
clean-build caveat, and the structurally-correct-vs-correct-content
rule: `playbooks/verification-tiers.md`. When compiling any task packet
that requires tiered reporting, that playbook goes in the packet's
required context.
