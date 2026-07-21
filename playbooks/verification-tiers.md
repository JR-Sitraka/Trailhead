# Playbook: Verification tiers — canonical definitions

These are the kit's canonical tier definitions. `principles.md` #8
states the policy and points here; role files and task packets point
here; no other file redefines these. This playbook exists so a coding
agent — which never loads `principles.md` — can still comply with any
instruction that says "report at an honest tier."

**Load this playbook whenever a task requires tiered reporting** —
any audit, test-status, or completion report that distinguishes
verified from inferred.

Never round a lower tier up to a higher one for the sake of a tidy
summary:

1. **Live-verified (person)** — the person themselves ran the
   request/response or clicked through the real UI and confirmed the
   result directly.
2. **Agent-verified** — the coding agent produced real evidence (an
   actual request/response, actual database rows, an actual test run)
   but the person hasn't independently confirmed it yet. Real, but a
   lower tier than person-verified — say so explicitly rather than
   letting "the agent tested it" quietly read as equivalent to "I
   confirmed it."
3. **Partially verified** — some but not all cases exercised, at
   either tier above.
4. **Code-reviewed only** — logic traced, never actually executed.
   This is not the same as "untested" — traced logic is real evidence,
   just the weakest tier. A genuinely untested item (nothing checked
   at all) is a gap to state plainly, not a tier of this taxonomy.

A clean build or passing type-check is not itself a tier — it rules
out one narrow class of error and proves nothing about the other
three.

**Structurally correct code is not the same as correct content:** code
that compiles, matches the requested layout, and passes every tier
above can still contain fabricated names, rewritten copy, leaked
fields from an unrelated section, or placeholder values presented as
real ones. Verifying a tier confirms the code runs as written — it
doesn't confirm the content inside it is true. Check both.
