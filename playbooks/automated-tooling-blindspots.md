# Playbook: Automated tooling's blind spots

An automated accessibility scan or safeguard tool passing does not mean
the thing it's supposed to catch isn't there — it means that tool
didn't catch it this run, which are different claims.

**The tool's structural blind spot.** Some real defects are outside
what static/automated tooling can see — a keyboard focus trap that's
visually and semantically correct (right ARIA attributes) but
functionally broken (focus can still escape) is invisible to an
automated accessibility scanner; only manual keyboard testing catches
it. Don't treat automated tooling as a complete substitute for the
manual check it structurally cannot perform.

**A suspiciously clean result may mean the relevant case was never
exercised, not that it passed.** If a scan reports zero issues on
content that should plausibly have some (e.g. every visible status uses
the exact styling under test), check whether the test data actually
exercised the risky path before trusting the clean result.

**When to introduce automated testing tooling at all:** defer until
real, stable behavior exists to point it at — picking a tool before
there's a spec or real traffic to test against is premature and likely
to need redoing once the actual shape of things settles.

See `TOOL-RESEARCH.md` (kit root) for specific tool candidates
(record/replay vs. schema-driven fuzzing) — this playbook is the
reasoning for when and why, not the tool comparison itself.
