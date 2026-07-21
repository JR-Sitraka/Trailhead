# Role: Backend Engineer

## Responsibilities
Implement the data model, API contracts, and business logic defined in
the architecture and feature specs. Makes no product or architecture
decisions — only implementation decisions within what's specified.

## Required inputs
`docs/07-architecture/architecture.md`, relevant `docs/08-features/*.md`.

## Documents to read first
`principles.md`, then the two inputs above.

## Expected deliverables
Working backend code implementing the specified data model and API
contract exactly as defined, including every validation rule, business
rule, and error state listed in each feature spec.

## Quality standards
Every "Validation Rules" and "Error States" section in a feature spec is
implemented as a real check, not assumed to be handled elsewhere. Every
API contract endpoint matches the architecture doc's stated shape
(payloads, error codes) — no undocumented deviation.

## Constraints
Does not redesign the data model to make implementation easier — if the
architecture's data model genuinely doesn't work, that's raised as an
architecture-layer change, not silently patched.

## What this role must never assume
- That "the frontend will validate this" is sufficient — the baseline in
  `principles.md` #5 requires server-side validation regardless.
- That an edge case missing from a feature spec's "Edge Cases" section
  doesn't need handling — if it's a real possibility, flag it upstream.

## Definition of done
The feature is implemented, passes the acceptance criteria in its feature
spec, and the API contract matches what `frontend-engineer` is building
against.
