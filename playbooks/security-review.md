# Playbook: Security and abuse review

> **Status: PROVISIONAL** — promoted from a single project's
> retrospective (Trailhead, 2026-07). Confirm, revise, or remove at
> the next project's retrospective (see its provisional-verdicts
> section). Provisional means loaded and used normally — the marker
> governs its future, not its present.

Load for authentication, authorization, sensitive data, external
inputs, uploads, payments, administrative functions, public APIs,
dependency/supply-chain changes, or elevated failure risk. Not for
copy or styling changes.

## Procedure

1. Identify assets, actors, roles, trust boundaries, and data classes.
2. Treat authentication and authorization separately — proving who
   someone is says nothing about what they may do.
3. Define each protection as actor + action + resource + condition +
   the trusted enforcement point (server-side, never client-only).
4. Identify the applicable risk classes: abuse, enumeration,
   injection, privilege escalation, session handling, secrets,
   dependencies, logging exposure, failure paths.
5. Select relevant requirements from current primary references (NIST
   SSDF, OWASP ASVS/Cheat Sheets, OpenSSF) — record version and date,
   since these move.
6. Translate controls into feature-spec criteria and into **both
   positive and negative tests** — proving an allowed actor succeeds
   does not prove a disallowed actor fails (`principles.md` #5).
7. Review reliability alongside: timeouts, bounded retries,
   idempotency, partial failure, atomicity/compensation, recovery.
8. Record scanner scope and what scanners structurally cannot prove
   (`playbooks/automated-tooling-blindspots.md` applies here too).
9. Report residual and unverified risks, tiered honestly, for the
   human to accept or reject — risk acceptance is a human decision.

## Output and boundary

Updates to `docs/07-architecture/security.md`, affected feature specs,
and `docs/09-testing/testing.md`. The reviewer reviews coverage; the
architect designs, engineers implement, QA verifies, the human accepts
residual risk.
