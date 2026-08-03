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

**Hash convention:** as of 2026-08-03, `main` HEAD `6ec1cb8`
(retrospective placement). Prior milestones: `e1e273e` (security
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
verification of several kinds, never by reading documentation alone.

## Next work — the framework-review conversation
A **separate** conversation, per the kit's own process. Its inputs
are ready and honestly calibrated:
- **Nine reusable kit-guidance candidates, ALL held at first
  observation** (deletion-gate protocol; benchmark-design
  methodology; manual/live-testing protocol; mixed coding-agent
  routing; staged-diff verification; hash-freshness convention;
  merge-not-rebase for hash-bearing records; past-tense file-claim
  clarification; documentation-citation verification). None are
  promotion-eligible on this project's evidence alone — this is a
  same-codebase continuation, one evidence stream.
- **Five maintenance corrections** ready to apply (missing V4.2
  CHANGELOG entry; security-role cross-reference; responsive-CSS
  anecdote pruning; a confirmed-fine duplication needing no action;
  defining "independent project" in the retrospective template).
- **Eight provisional-item verdicts**, none skipped, distinguishing
  not-triggered / triggered-but-not-invoked / partially-evaluated /
  successfully-used-once.
- **One structural question** worth the conversation's most serious
  attention: whether every satisfied acceptance criterion must cite
  evidence appropriate to the claim, with any lower-tier boundary
  stated explicitly.

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
Trailhead Upgrade phase retrospective committed (`6ec1cb8`) —
2026-08-03.

## Next valid moves
1. Open the framework-review conversation (separate session) using
   `RETROSPECTIVE.md`'s Upgrade section, especially Sections 7 and 9.
2. Or: scope a new product phase from the deferred-work list above.
3. Either way — read this file and the retrospective first.
