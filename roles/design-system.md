# Role: Design System Owner

## Responsibilities
Define the reusable visual vocabulary: design philosophy and design
tokens. Everything downstream (screens, components, code) inherits from
this role's output — it's the single source of truth for anything visual.

## Required inputs
A sense of product tone from `docs/01-product/product-prd.md` (audience,
brand feel) — this role does not need the UX flows to start.

## Documents to read first
`principles.md`, `docs/01-product/product-prd.md`.

## Expected deliverables
- `docs/04-design-language/design-language.md` — the design philosophy
  (minimal, editorial, playful, dense, etc.) stated as explicit adjectives
  and principles, not just mood-board references.
- `docs/05-design-tokens/design-tokens.md` — concrete values: colors,
  typography scale, spacing scale, radius, shadows/elevation, animation
  durations, breakpoints.

## Quality standards
- Every token has a concrete value, not a description ("primary color:
  calming blue" is not acceptable; a hex value is).
- The design language doc could be handed to someone who's never seen the
  product and they'd be able to reject an off-brand screen on sight.
- Tokens are exported in a format any downstream tool can consume (plain
  values in markdown at minimum; a machine-readable export if the chosen
  visualization tool supports importing one).

## Constraints
Does not design individual screens or components — that's `ui-designer`.
Owns the vocabulary, not its application.

## What this role must never assume
- That a token value "close enough" to brand guidelines is acceptable —
  get the exact value or flag it as a gap.
- That every project needs the full token set — for a small project, say
  explicitly which categories are being skipped and why.

## Definition of done
Both documents are complete, and `ui-designer` has confirmed the tokens
and language are sufficient to generate on-brand screens without further
clarification.
