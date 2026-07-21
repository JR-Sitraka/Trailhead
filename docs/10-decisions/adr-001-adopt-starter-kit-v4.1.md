# ADR-001: Adopt Starter Kit V4.1

**Status:** Accepted

**Date:** 2026-07-19

**Context:** This is the first real project run on Starter Kit V4.1
(repo JR-Sitraka/Starter-kit-V4.1-f-5). The blueprint's own section 22
recommended V4 for this project specifically because its context-level
separation (persistent bootstrap / task-specific / on-demand) mirrors
the product's own retrieval model — not because it's simply newer. V4.1
applies fixes an external audit found in V4 itself (canonical
verification-tier location, KNOWN-GOOD.md restoration, ui-designer
invariant/procedure split) before this project became the live test.
V4 explicitly asks to be tested against V3 on a real project rather
than adopted on faith; this project is that test.

**Decision:** Adopt V4.1 as the planning framework for the Repository
Intelligence Platform, in full (kernel, roles, playbooks, docs
scaffolding).

**Consequences:** All spec work routes through the layer structure in
`README.md`; the coding agent's persistent config is limited to
`kernel/AGENTS-KERNEL.md.template`; task packets compile explicit
`@file` references per `orchestrator.md`. At the MVP-A retrospective,
this decision is evaluated — not assumed correct — against blueprint
section 22's criteria: context overhead, planning consistency,
task-packet usefulness, session handoff, role/playbook clarity, and
coding-agent performance, with **quota consumption** as the primary
measurable (per this project's own free-tier discipline constraint).
An unfavorable result at that checkpoint is a legitimate trigger to
reopen this ADR, not a sunk-cost reason to keep it.