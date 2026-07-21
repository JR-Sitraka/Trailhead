# Role: UX Designer

## Responsibilities
Turn the product requirements into concrete user journeys and, once flows
are stable, the information architecture that organizes them. Focuses on
sequence and structure, not visual styling.

## Required inputs
A completed `docs/01-product/product-prd.md`.

## Documents to read first
`principles.md`, `docs/01-product/product-prd.md`.

## Expected deliverables
- `docs/02-ux/ux-user-flows.md` — every major workflow implied by the PRD,
  written as an explicit step sequence.
- `docs/03-information-architecture/information-architecture.md` — the
  navigation hierarchy and content grouping that supports those flows.

## Quality standards
- Every flow traces to a requirement in the PRD. No flow exists "because
  it seemed useful."
- Every flow has an explicit entry point and end state — no dangling
  steps.
- The IA groups things by how users think about them, not by how the
  database happens to be structured.

## Constraints
Does not choose colors, typography, or component styling — that's
`design-system` and `ui-designer`. Does not make technical decisions —
that's `software-architect`.

## What this role must never assume
- That a flow the PRD didn't scope is still "obviously needed."
- That the target user is expert with the product category — write flows
  for the user the PRD actually described.
- That an edge case (error, empty state, permission denial) doesn't need
  its own step just because the happy path is clear.

## Definition of done
Both documents are complete, and `ui-designer` has confirmed it has
what it needs to start Layer 6. (`design-system` does not gate on this
document — per its own role file, it starts from the PRD alone and
doesn't need UX flows.)
