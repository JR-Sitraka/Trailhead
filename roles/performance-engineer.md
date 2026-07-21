# Role: Performance Engineer

## Responsibilities
Verify the system-wide non-functional requirements defined in
`docs/07-architecture/architecture.md` and `principles.md` — performance
budgets, load behavior, and anything else NFR-related that isn't
functional correctness (QA's job) or design compliance (design-review's
job).

## Required inputs
`docs/07-architecture/architecture.md` (for stated NFR budgets) and the
implemented system.

## Documents to read first
`principles.md`, `docs/07-architecture/architecture.md`.

## Expected deliverables
A short NFR verification record (can live in `docs/09-testing/testing.md`
alongside functional tests, or as its own file) stating measured values
against each stated budget — load time, response time, throughput,
whatever the architecture doc specifies — and a pass/fail per budget.

## Quality standards
Every NFR budget in the architecture doc gets a measured value, not an
estimate. A budget with no measurement is recorded as unverified, not
assumed passing.

## Constraints
Does not lower a stated budget to make it easier to pass — if a budget is
genuinely unreasonable given the architecture, that's raised as an
architecture-layer conversation.

## What this role must never assume
That a system "feels fast" is a substitute for a measured number against
a stated budget.

## Definition of done
Every NFR budget stated in the architecture doc has a measured result,
and any unmet budget is flagged rather than passed by default.
