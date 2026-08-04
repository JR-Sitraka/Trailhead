# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B
shipped and publicly released. **The Trailhead Upgrade phase
(project 2 on the Starter Kit, V4.2, ADR-007) is COMPLETE.**

## Phase
**COMPLETE — no phase currently in progress.** All seven Upgrade
items closed, the bounded security review run and its residual risks
formally accepted, and the phase retrospective compiled and committed.

**Hash convention:** `6ec1cb8` is the
retrospective-placement milestone, not a current-HEAD claim — a
recorded HEAD self-invalidates on the next push; check `git log` for
actual HEAD. Prior milestones: `e1e273e` (security
acceptances recorded), `74cf228` (security remediation), `78afe5f`
(security.md created).

## The seven Upgrade items — final outcomes
| Item | Outcome |
|---|---|
| 1. Doc-drift fix | DONE — Gemini→Groq corrected across all active docs |
| 2. Golden benchmark suite | COMPLETE — real corpus, versioned manifests, committed baseline; the phase's most load-bearing new infrastructure |
| 3. Embedding model swap | **CLOSED: HELD** — evaluated rigorously across ~10 rounds, 3/4 criteria decisively met, held on a real documentation-retrieval regression. Candidate preserved, not rejected; a five-point acceptance bar recorded for any future reconsideration |
| 4. Framework misdetection | CLOSED — premise didn't reproduce; re-scoped via ADR-010 to verify + regression-guard; "Unknown" display shipped |
| 5. LLM observability | CLOSED, merged — real implementation, visual parity, human-confirmed |
| 6. Screen-reader accessibility | CLOSED, merged — 7 real audit findings from a live NVDA pass, all addressed and live-reconfirmed |
| 7. Testing closeout | CLOSED — plus three real pre-existing product bugs found and fixed, and one honest deferral (IMPORT-04) |

## Security posture — reviewed and formally accepted (2026-08-03)
A bounded security review of item 7's preprocessing/import changes
was run, found two real bypass paths (symlink entries and general
zip-bomb allocation) that no prior verification had looked for, and
both were fixed after the critical invariant behind the fix was
**proven rather than assumed**. Severity re-assessed S3→S2 with
recorded reasoning. `docs/07-architecture/security.md` now exists
with the threat model and posture.

**Four residual risks explicitly accepted by the operator** — see
`security.md` for full wording: temp-directory disk exhaustion
(deferred); indexed-but-empty data-integrity ambiguity (deferred,
S4); the post-fix ~500MB single-buffer residual (**a buffer ceiling,
not a process ceiling**); and the no-authentication posture, accepted
**conditionally for local single-operator use only** — explicitly not
authorizing public, shared, hosted, or untrusted-network deployment.
**Any move toward remote access, multi-user use, or public/LAN
exposure triggers a new security review and an authentication
decision before deployment.**

## Retrospective — committed
`RETROSPECTIVE.md`'s fourth section (`6ec1cb8`): 9 sections, 43
numbered findings, each carrying its own evidence tier. Its headline
finding: **project records repeatedly described the system more
confidently or completely than the implementation and evidence
justified** — six real cases, caught through fresh primary-source
verification — execution, database inspection, code tracing, and
cross-document comparison.

## Framework review — COMPLETE (2026-08-04)
Run as a separate conversation, per the kit's own process. Four
changes landed on the starter kit; roughly twenty findings were
declined or held, each with a recorded reason.

**Starter-kit remote `main`: `2e4ecdf8cfcc5033bce0461bdebed6a13dbdfc1a`.**
**Unreleased maintenance only** — no version label, no tag, no GitHub
release. The V4.2 structure itself is unchanged; these sit above it.

| Landed change | File |
|---|---|
| "Second project" defined in the two-project promotion rule | `RETROSPECTIVE.template.md` §7 |
| Version label corrected V4 → V4.2 | `README.md` line 1 |
| Stale V3-comparison framing replaced | `README.md` lines 3-5 |
| `Unreleased` maintenance accounting | `CHANGELOG.md` |

All eight V4.2 provisional and provisional-speculative markers were
reviewed and **retained unchanged**: the Upgrade is a second phase of
the same codebase, which the newly-defined second-project gate does
not satisfy.

**Durable records — read these rather than re-deriving anything:**
- Kit-review decisions, every decline with its reason, and the held
  maintenance findings → starter-kit `CHANGELOG.md`, `Unreleased`
  entry.
- Project findings, first-observation candidates, and the provisional
  verdicts they rest on → this repo's `RETROSPECTIVE.md`, Upgrade
  section (§7-§9).

## Real, deliberately deferred work (not part of any current phase)
- IMPORT-04 branch selection — real, unimplemented, honestly deferred
- Documentation-retrieval mitigation study (item 3's held decision)
- Cloud-embedding scoping — raised, never scoped
- FK indexes — absent, unmeasured, low priority
- Temp-directory cleanup; the `read_failed` skip-reason fix
- V1 blueprint items (structural graphs, impact analysis)
- Pre-existing MVP-A/B test gaps carried forward untouched (see
  `testing.md`)

## Current blocker
None.

## Last completed action
Framework review completed; the approved change set merged
fast-forward and pushed to starter-kit `main` at `2e4ecdf` —
2026-08-04. Trailhead itself was at
`7869d757bcbd7311e22e90aab4e09914796e36c0` immediately before this
state update, unchanged throughout the review.

## Next valid moves
1. Scope a new Trailhead product phase from the deferred-work list
   above.
2. Or: leave the project in its current completed, stable state until
   new product evidence justifies reopening a deferred item.
3. Either way — read this file and `RETROSPECTIVE.md` first.
