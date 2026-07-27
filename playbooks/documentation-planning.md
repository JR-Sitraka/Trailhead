# Playbook: Reader-facing documentation planning

> **Status: PROVISIONAL-SPECULATIVE** — added ahead of any project
> observation. First candidate for removal if the next project never
> triggers it; must earn a retrospective mention to survive.

Load at a meaningful milestone, public-repository preparation,
contributor onboarding, or when existing reader documentation has
become false. Reader documentation describes the project to people;
the retrospective describes the project to the framework — neither
replaces the other.

## Procedure

1. Pick the audiences and the smallest useful surface: a README,
   focused docs, a docs site only when documentation is itself a
   product surface.
2. Build an evidence map: every claim traces to something real in the
   repository.
3. Compare specs and retrospective against actual code, scripts,
   configuration names, APIs, tests, and limitations — reader docs
   describe verified reality (`principles.md` #11), with planned
   behavior labeled as planned.
4. Plan exact outputs under `README.md` and `docs/reader/`; no empty
   category folders.
5. Link to authoritative facts rather than duplicating drift-prone
   detail.
6. Verify what can be verified: setup commands, links, examples,
   paths, environment names, feature claims, testing-tier claims,
   and the exclusion of secrets and sensitive detail.
7. Record unverified claims and what would trigger an update.

## Output

`docs/07-architecture/documentation-plan.md` plus the planned
reader-facing files themselves.
