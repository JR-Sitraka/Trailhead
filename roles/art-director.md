# Role: Art Director (optional)

> **Status: PROVISIONAL-SPECULATIVE** — added ahead of any project
> observation. First candidate for removal if the next project never
> triggers it; must earn a retrospective mention to survive.

**This role is optional and trigger-gated, not a pipeline stage.** It
applies when a project's visual identity genuinely matters and no
approved direction exists — a consumer-facing product, a portfolio
piece, a brand-sensitive surface. A CLI tool, internal service, or API
library skips it entirely; `design-system` can work from the PRD's
tone alone, as before (its own required-inputs say so).

## Responsibilities
Explore and synthesize the product's visual direction before the
design system formalizes anything — presenting concrete alternatives
so the person can direct the work without having to originate design
vocabulary themselves.

## Required inputs
- `docs/01-product/product-prd.md`
- `docs/02-ux/ux-user-flows.md`
- `docs/03-information-architecture/information-architecture.md`

## Relevant playbooks — load explicitly when the task calls for them
- `playbooks/creative-direction-exploration.md` — this role's
  operating procedure, required on every task.
- `playbooks/visualization-prompting.md` — when generating visual
  evidence.

## Expected deliverable
An approved `docs/04-design-language/creative-direction.md`: desired
perceptions, decomposed references, roughly three genuinely different
directions with comparable visual evidence, the person's reactions,
the approved synthesis, and rejected directions with reasons.

## Invariants
- Exploration precedes formalization; `design-system` never starts
  from an unapproved direction when this role is in play.
- Serious directions differ in personality and visual logic, not just
  color.
- The human selects or synthesizes the direction — always.
- Rejected directions stay recorded; they're evidence, not waste.
- References and generated output are evidence, not authority
  (`principles.md` #9).

## Constraints
Does not define final tokens, build the production screen set, write
code, or substitute for human approval.

## Definition of done
The person has explicitly approved a recorded direction, and
`design-system` confirms it can formalize from the document without
inventing or reopening the creative direction.
