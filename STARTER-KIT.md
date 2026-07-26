# Project Starter Kit — V4

**This is a parallel structure, not a replacement for V3.** Built to be
tested against V3 on a real project, not adopted on faith — see
`CHANGELOG.md` for why this exists and what changed structurally.

A reusable specification framework for AI-assisted product development.
Copy this whole folder into a new project's repo root, then work
through the layers in order.

## How it fits together — three context levels, not one flat pile
```

principles.md <- the constitution: rules + cross-cutting
definitions. Read by the PLANNING ASSISTANT,
in full, once per project. Not injected into
the coding agent's persistent config.
orchestrator.md <- how the planning/review chatbot behaves,
including how it compiles task packets for
the coding agent (the actual routing
mechanism — see that file's own section on it)
kernel/AGENTS-KERNEL.md.template
<- the ONLY thing that should be configured as
the CODING AGENT's persistent instructions.
Deliberately tiny — read it, you'll see why.
roles/ <- invariants only: small, severe, always-true
rules for one role. Loaded per-task by being
named in the generated prompt, not persistent.
playbooks/ <- detailed procedures, loaded only when a
specific task actually calls for one —
explicit @file mention in the prompt, never
configured as a standing rule.
PROJECT-STATE.template.md
<- authoritative, frequently-updated status —
the actual mechanism for session handoff.
KNOWN-GOOD.template.md <- per-project environment facts + incident-
derived hard rules. Read by the coding agent
on every task if present (kernel rule 7).
docs/01-product/ ... <- project-specific content, filled in per layer

```

**Why the split:** confirmed directly (not assumed) that at least one
real coding tool treats persistent-instruction files and explicitly-
`@`-mentioned files very differently — the first loads every session
regardless of relevance, the second only when actually referenced. A
role file full of detailed procedures, configured as a persistent rule,
costs real context on every single task even when 90% of it doesn't
apply. Splitting invariants (cheap, always relevant) from playbooks
(detailed, situational) and routing the latter explicitly per task is
the actual fix — not just reorganizing files for human readability.

## Starting from an existing codebase

If there's already code — your own past work, or someone else's
repository — that's `roles/repo-mapper.md`'s job; read
`playbooks/existing-codebase-mapping.md` for the actual rules (it
carries most of this role's operating detail, load it every time this
role is used). Rejoin the normal order below at step 4 once as-built
docs exist.

## Order of operations

1. Copy this kit into `<your-project>/`.
2. Start with `roles/product-manager.md` and `docs/01-product/`. A
   structured brainstorm — the agent's job is making sure the interview
   covers every question, not deciding anything for you.
3. `ux-designer` owns both `docs/02-ux/` and
   `docs/03-information-architecture/` — one role, two deliverables.
4. `design-system` owns `docs/04-design-language/` and
   `docs/05-design-tokens/`.
5. `ui-designer` produces visual screens per user flow. Screens go
   through the review split in `principles.md` #2 before being written
   back as a spec — a compliant *or* honestly-Unverified result reaches
   the human pass; only a genuine fail is blocked.
6. Approved screens get written up in `docs/06-components/`.
7. `software-architect` → `docs/07-architecture/`, in two passes (light,
   before Layer 6; full, after) — see that role file for the mechanics.
8. `docs/08-features/` — one file per feature.
9. `qa-engineer` → `docs/09-testing/`, using `playbooks/failure-path-testing.md`
   and `playbooks/automated-tooling-blindspots.md` where the task calls
   for them.
10. `docs/10-decisions/` collects ADRs for any point a later layer
    forced a change to an earlier one — expected, see `principles.md` #3.
11. At MVP/V1 completion, compile a retrospective — see "At project
    completion" below, including the two-project promotion rule before
    anything gets added back to the shared kit.

## Before implementation starts

- Copy `kernel/AGENTS-KERNEL.md.template` to the project root as
  `AGENTS.md` (or your tool's equivalent persistent-instructions
  location), filled in for the actual project. Keep it as small as the
  template — this is the file that costs context on every single task.
- Copy `PROJECT-STATE.template.md` to the project root as
  `PROJECT-STATE.md` and keep it current from the start, not just once
  things get complicated.
- Copy `KNOWN-GOOD.template.md` to the project root as `KNOWN-GOOD.md` —
  it starts nearly empty and earns its entries as the project runs.
- Fill in `docs/10-decisions/adr-tool-setup.template.md`. See
  `TOOL-RESEARCH.md` at the kit root for researched candidates —
  verify freshness before trusting a name from there.

## At project completion

Compile `RETROSPECTIVE.template.md` into a real `RETROSPECTIVE.md`
while the project's full context is still loaded, then bring it to a
separate conversation for a framework review — including the
two-project promotion rule (section 7) before anything gets added to
the shared kit permanently.

## This is a loop, not a pipeline

If a later layer invalidates an earlier decision, reopen the earlier
document, log why in `10-decisions/`, and move forward again.

## Lesson carried over from V3: architecture runs in two passes

A light architecture pass (stack, pipeline, hosting only) before
picking a visualization tool often works better than the numbered order
suggests. `roles/software-architect.md` formalizes this as light pass /
full pass — read that file for the mechanics.

## Sizing the process

Not every project needs every layer at full weight, and not every
project needs every playbook. The templates are ceilings, not
requirements.
