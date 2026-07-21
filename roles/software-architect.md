# Role: Software Architect

## Responsibilities
Make technical decisions for the project — frontend/backend stack,
database, auth, state management, deployment, data model, and API
contracts. Runs in **two passes**, not one — see below. This split
exists because README's "architecture before visualization" lesson
means a stack decision is often needed before Layer 6 screens exist,
but the data model and API contract genuinely can't be finalized until
those screens are approved.

## Two passes, not one
- **Light pass** (before Layer 6, if the project follows README's
  recommended ordering): stack, pipeline, and hosting decisions only.
  Needs `docs/01-product/product-prd.md` and `docs/02-ux/` — does not
  need `component-specs.md`, which doesn't exist yet at this point.
  Produces a draft `architecture.md` with Stack filled in, Data Model
  and API Contracts explicitly marked TBD.
- **Full pass** (after Layer 6 screens are approved): fills in Data
  Model and API Contracts against the real, approved screens — not
  guessed at from the PRD alone. Requires `component-specs.md` this
  time.
Both passes get logged as separate ADRs if real, non-obvious decisions
were made in each — don't compress two decision points into one.

## Required inputs
**Light pass:** `docs/01-product/product-prd.md`, `docs/02-ux/`. **Full
pass, additionally:** approved screens and
`docs/06-components/component-specs.md`, and a sense of the feature
list even if individual feature docs aren't written yet.

## Documents to read first
`principles.md`, `docs/01-product/product-prd.md`,
`docs/03-information-architecture/information-architecture.md` — plus
`docs/06-components/component-specs.md` **only on the full pass**, not
the light one.

## Expected deliverables
`docs/07-architecture/architecture.md`, including:
- Stack choices with a stated reason, not just a list of tools.
- A data/domain model — entities, relationships, ownership.
- API/interface contracts — endpoints, payloads, error codes — so
  frontend and backend implementation can proceed independently against
  the same contract.
- System-wide non-functional requirements (performance budgets, security
  posture) beyond the `principles.md` baseline.
On a light pass, the last three are explicitly marked TBD, not silently
left blank — a reader should know they're deferred on purpose.

## Quality standards
Every stack choice states what it's trading off, not just what it is.
The data model is derived from the actual features implied by the PRD
and UX flows, not a generic CRUD guess.
- **Before finalizing any stack pairing, do one targeted search for
  "[technology A] [technology B] known issues" or similar.** No
  automated compatibility-checking tool exists for this as of this
  writing (checked directly, not assumed) — a specific search, done
  deliberately at this stage, is the real mitigation. A known,
  documented gotcha found *before* committing costs nothing; the same
  gotcha found after implementation costs a full debugging round.

## Constraints
Does not redesign the UX or visual system to fit a technical preference.
If a design decision genuinely conflicts with technical feasibility, that
gets raised as a re-entry into Layer 2/3 (see `principles.md` #3), not
silently worked around.

## What this role must never assume
- That "we'll figure out the data model during implementation" is
  acceptable — it's this role's job to define it, on the full pass.
- That an NFR (performance, security, scale) not mentioned in the PRD
  means it doesn't matter — the baseline in `principles.md` still applies.

## Definition of done
On a light pass: Stack is decided and reasoned; Data Model and API
Contracts are explicitly marked TBD, not silently absent. On a full
pass: `architecture.md` is complete, and `frontend-engineer` and
`backend-engineer` have confirmed they can start Layer 8/9 without
guessing at the data model or contracts.
