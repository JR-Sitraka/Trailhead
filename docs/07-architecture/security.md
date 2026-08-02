# Security and Reliability — Trailhead

**Owner:** Software Architect
**Reviewer:** Security Reviewer
**Applicability:** Required — the project accepts external inputs (GitHub
repositories and uploaded ZIP archives) and has material failure risk in
its preprocessing path.

**Created 2026-08-02**, as security review finding **S-0**: this file was
named as a required input by `roles/security-reviewer.md` but did not
exist. The first real security review of this project (item 7 closeout,
scoped to preprocessing/import) ran without it and recorded its absence
as a finding. This document is that gap being closed.

---

## Risk level

- **Level: Standard.**
- **Reason:** no authentication, no protected user data, no payments, and
  no network exposure by design — but every import is untrusted external
  input processed by a real archive parser, which is a genuine attack
  surface. The risk is concentrated almost entirely in one place
  (`src/server/services/preprocessing.ts`), not spread across the app.

## Assets and data classification

| Asset/data | Classification | Storage | Exposure | Retention |
|---|---|---|---|---|
| Imported repository file contents | Untrusted public code | `files.content` (Postgres `text`) | Local UI only | Until repository deleted (cascade) |
| Repository/job metadata | Non-sensitive | Postgres | Local UI + local API | Until deleted |
| Embeddings | Derived, non-sensitive | `embedding_chunks` (pgvector) | Never exposed raw | Until deleted |
| `GITHUB_TOKEN` | **Secret** | `.env`, server-side only | Never sent to client | Operator-managed |
| `GROQ_API_KEY` | **Secret** | `.env`, server-side only | Never sent to client | Operator-managed |
| Extracted archive contents (transient) | Untrusted | `os.tmpdir()` during preprocessing | Local filesystem | Best-effort delete — see finding 2b |

## Trust boundaries and actors

- **Client:** the operator's own browser. Not a trust boundary of
  consequence — there is one user and no privilege separation.
- **Server:** Next.js route handlers + the in-process poller. **This is
  the real trusted enforcement point.** All validation happens here.
- **Database:** local PostgreSQL, trusted, not internet-exposed.
- **External services:** GitHub API (read-only PAT), Groq (generation).
  Both are outbound-only.
- **Administrative interfaces:** none.
- **Actors and roles:** a single local operator. There is no second role,
  and therefore no privilege boundary to escalate across.

**The real trust boundary is content, not identity.** Every imported
archive and every GitHub repository's contents are untrusted input, no
matter who asked for the import. The operator is trusted; what they
import is not.

## Identity and sessions

- **Authentication provider/mechanism:** **None.** Deliberate scope
  decision, recorded in `architecture.md` and stated plainly in
  `README.md`'s Known limitations.
- **Session/token behavior:** N/A — no sessions exist.
- **Recovery / Revocation / Sensitive-action reauthentication:** N/A.

**Consequence, stated rather than implied:** anyone who can reach this
app on the network can import, delete, or reanalyze any repository. It
is designed for local, single-operator use and must not be deployed
publicly reachable without adding real authentication first.

## Authorization

| Actor | Action | Resource | Condition | Trusted enforcement point |
|---|---|---|---|---|
| Local operator | Import / delete / reanalyze | Any repository | None — unrestricted by design | N/A (no authorization layer exists) |
| Untrusted archive content | Be parsed / stored | Preprocessing pipeline | Must pass traversal, symlink, size and binary checks | `validateZipSafety()` in `preprocessing.ts` — server-side |

Default is deny **for content**, not for actors: an archive that fails
any safety rule is rejected outright rather than partially imported.
There is no actor-level authorization to enforce, because there is only
one actor. Authentication alone is not authorization — here there is
neither, by decision.

## Abuse and threat cases

| Threat/abuse case | Control | Required negative test | Residual risk |
|---|---|---|---|
| Path traversal via archive entry name | `validatePathTraversal()` rejects any `..` segment before extraction; whole archive rejected (422) | `tests/preprocessing.test.ts`, `tests/security-review-preprocessing.test.ts` | None known |
| Symlink escaping the archive root | `resolveAndCheckSymlink()` resolves and compares against root; whole archive rejected | `tests/preprocessing.test.ts` | None known |
| **Oversized symlink body forcing a large allocation (finding 4c)** | **Declared-size guard: `entry.header.size > 4096` → `SecurityError`, rejected before `getData()`** | `tests/preprocessing-size-header-guard.test.ts` | See "Accepted residual" below |
| **Zip-bomb / over-declared entry forcing a large allocation (finding 4d)** | **Declared-size checked against remaining 500MB budget before `getData()`; real decompressed bytes still charged afterwards** | `tests/preprocessing-size-header-guard.test.ts` | See "Accepted residual" below |
| Repository-wide unpacked-size exhaustion | 500MB budget charged per entry; truncation, or rejection if zero files indexed | `tests/preprocessing-size-boundary.test.ts` (under / exactly at / over / parse-ceiling bypass) | None known |
| File-count exhaustion | 5,000-file cap, checked during traversal | `tests/preprocessing.test.ts` | None known |
| Unstorable content (NUL bytes) poisoning a batch insert | Full-content NUL scan reclassifies as `binary_file` | `tests/import-integrity.test.ts`, `tests/security-review-preprocessing.test.ts` | None known |
| Execution of imported repository code | Nothing is ever executed — no install, no scripts, no eval. Files are read as inert bytes | `tests/preprocessing.test.ts` (malicious `postinstall`, `install.sh`, `Makefile`) | None known |
| Partial/orphaned state after a failed import | Repo + job + files inserted in a single `db.transaction` | `tests/import-integrity.test.ts` | Temp-dir residue only — finding 2b |
| Secret leakage to client | Tokens read server-side only; never serialized into any response | — (no negative test yet) | Unverified; no known exposure path |

## Sensitive-data rules

- **Collection minimization:** no personal data is collected. Imported
  content is public repository code.
- **Logging exclusions:** repository *content* is never logged. Poller
  logs carry UUIDs and file paths only. Secrets are never logged.
- **Encryption:** none at rest — local single-operator database, no
  protected data class. Outbound calls to GitHub/Groq use HTTPS.
- **Deletion/retention:** deleting a repository cascades to files,
  symbols, chunks, and jobs. No soft-delete, no archival copy.

## Reliability

- **External dependency failure:** GitHub failures surface as 400/502
  before any row is created. Groq failures degrade to a deterministic
  fallback (Export) or a 502 (Chat) — never a fabricated answer.
- **Bounded timeouts/retries:** no retry loops in the import path — a
  failure fails cleanly rather than amplifying. The `AnalysisJob`
  30-minute timeout is specified but **not implemented** (open gap,
  tracked in `testing.md`).
- **Idempotency:** imports are deliberately *not* idempotent —
  re-importing the same URL creates a separate repository, an explicit
  product decision.
- **Atomic or compensatable transitions:** the repo+job+files insert is
  atomic. The poller's own status transitions are individual statements,
  not a transaction — acceptable because the poller is single-instance
  and reconciliation exists.
- **Partial-failure reporting:** per-file parse errors are isolated and
  logged; the job continues. Truncation is recorded on the job rather
  than silently dropping files.
- **Recovery behavior:** orphaned repositories (in `queued`/`analyzing`
  with no live job) are reconciled to `failed` at the start of each poll
  tick, so nothing polls forever.

## Selected controls and references

- **OWASP** — *File Upload Cheat Sheet* and *Denial of Service Cheat
  Sheet* (consulted 2026-08-02): validate archive entries before
  extraction; bound decompressed size; never trust attacker-supplied
  metadata as the sole control. Applied directly to findings 4c/4d.
- **CWE-409** (Improper Handling of Highly Compressed Data / "zip bomb")
  — the exact class of findings 4c and 4d.
- **CWE-22** (Path Traversal) — covered by `validatePathTraversal`.
- **CWE-59** (Link Following) — covered by `resolveAndCheckSymlink`.
- **Non-applicable controls and reason:** ASVS V2 (Authentication),
  V3 (Session Management), V4 (Access Control) — no identity model
  exists by explicit scope decision, so these are not gaps to close but
  requirements that do not apply at this project's current scope. They
  become applicable the moment authentication is added.

## Findings from the item 7 security review (2026-08-02)

Scope of that review: **only** the preprocessing/import changes made
during item 7's closeout. It was explicitly **not** a whole-application
audit. Areas covered: NUL/binary classification, import transactionality,
the zero-file guard, and the 500MB budget.

| # | Finding | Severity | Disposition |
|---|---|---|---|
| **4c** | Symlink-attributed entries called `entry.getData()` with **no size bound of any kind** — that branch `continue`s before the repository-wide budget is ever consulted. A hostile archive could declare a large symlink body and force the allocation. | **S2** (re-rated from S3 — see below) | **REMEDIATED 2026-08-02.** Declared-size guard: a symlink entry declaring more than 4,096 bytes is rejected as a `SecurityError` before `getData()` is called. Real symlink targets are short filesystem paths, so nothing legitimate is affected. |
| **4d** | `entry.getData()` performs `Buffer.alloc(entry.header.size)` from the archive's **declared** size before the real byte accounting could bound it, so an over-declaring entry forced the allocation first and was rejected only afterwards. | **S2** (re-rated from S3 — see below) | **REMEDIATED 2026-08-02.** The declared size is now checked against the remaining 500MB budget before `getData()`. The pre-existing actual-byte accounting is **retained unchanged** and remains the real enforcement. |
| **2b** | `validateZipSafety()` writes untrusted archive contents to `os.tmpdir()` before the transaction opens. Cleanup is best-effort (`try{}catch{}` in a `finally`), so a crash or an unusual filesystem error can leave the directory behind. | S3 | **DEFERRED — residual risk accepted pending a decision.** Repeated failed imports can accumulate orphaned temp directories and consume disk. **This is not self-limiting, and OS temp cleanup must not be relied on as a guarantee** — its behavior is platform- and configuration-dependent and may never run. A deliberate cleanup pass (e.g. sweeping stale `trailhead-*` directories at startup) is the real fix, and has not been implemented. |
| **1c** | A file whose UTF-8 read fails is stored as `skipped: false, content: null` — it appears successfully indexed but has no body, with no reason recorded. | S4 (data integrity, not security) | **DEFERRED.** Intended future behavior: `skipped: true, skipReason: "read_failed"`, so the state is honest and visible in Explorer rather than ambiguous. |
| **3d** | The zero-file guard runs, then updates the repository to `ready` in a separate statement. A second concurrent worker could insert files in between. | S3 | **NO CURRENT ACTION.** Unreachable today: the poller is single-instance and in-process. **Explicit re-review triggers: implementing reanalysis concurrency, or moving to multi-worker polling.** Either change reopens this as a real security/reliability item. |
| **S-0** | `docs/07-architecture/security.md` did not exist. | S4 | **CLOSED** — this document. |

### Severity re-assessment of 4c and 4d (required, recorded either way)

**Prior rating: S3 ("latent / defense-in-depth"). Final rating: S2.**

The original S3 understated both. Using the review's own scale — S1 =
exploitable now with real harm; S2 = exploitable now with limited harm
*or* requiring local access; S3 = latent or conditional on future
changes — neither finding was latent. Both were reachable against the
code as it stood:

- **Exploitability is real, not hypothetical.** The ZIP-upload path is
  fully attacker-controlled: an uploaded archive controls its own
  central-directory header values, including the declared uncompressed
  size, and the symlink path had no size bound whatsoever.
- **But impact is genuinely limited.** The worst case is local memory
  exhaustion or a process crash of a local-only developer tool.
  No code execution, no data exfiltration, no privilege escalation, no
  persistence; the import transaction rolls back, and recovery is a
  restart.
- **It requires operator action** — someone must choose to import the
  hostile archive.

Exploitable now + limited harm + requires local access is the definition
of **S2** on this scale. Recording the correction rather than quietly
keeping the tidier original number.

**One narrowing worth stating:** the *GitHub* import path is materially
less exposed than the ZIP path. GitHub generates the zipball itself, so
an attacker controls repository file contents but not the ZIP header
declarations. The header-lie vector is specific to operator-supplied
ZIP uploads.

## Verification

- **Automated:**
  - `tests/preprocessing-size-header-guard.test.ts` — 11 tests. Proves
    the adm-zip invariant the 4c/4d fix depends on, and the guards'
    real behavior through `validateZipSafety`.
  - `tests/security-review-preprocessing.test.ts` — 7 tests. Adversarial
    NUL-classification probes, symlink handling, traversal.
  - `tests/preprocessing-size-boundary.test.ts` — the 500MB budget at,
    under, over, and via the parse-ceiling bypass.
  - `tests/import-integrity.test.ts` — transactional rollback, NUL
    poisoning, zero-file guard.
  - `tests/preprocessing.test.ts` — traversal, symlinks, no-execution.
- **Manual:** none for this review. No person has independently
  reproduced these findings — everything below Live-verified tier.
- **Scanner scope and limitations:** **no security scanner (SAST, SCA,
  dependency audit) was run at any point.** This review was manual code
  tracing plus targeted bounded tests. It structurally cannot prove the
  absence of vulnerabilities elsewhere in the application, and it did
  not look. `npm audit` has never been run as part of it.
- **Unverified risks:**
  - **The 4c/4d fix rests on an adm-zip/Node behavior, not on our own
    code.** `adm-zip`'s `inflater.js` only passes `maxOutputLength` to
    zlib when the Node major version is **≥ 15**. This project runs
    **Node 20.13.0**, so the bound is active. Runtime-floor status,
    established by reading real files (2026-08-02):
    - **Real enforcement, but borrowed:** `next/dist/bin/next` hard-exits
      (`process.exit(1)`) on Node < 18.17.0, so `dev`/`build`/`start`/
      `lint` are genuinely gated well above the ≥ 15 the invariant needs.
      That guarantee comes from a third-party binary's internal check —
      a Next upgrade or a change of runner could alter it without
      anything in this repo noticing.
    - **`package.json`'s `engines` field (`>=18.17.0`, added 2026-08-03)
      is a repository-owned compatibility declaration, NOT hard
      enforcement.** Under the current `engine-strict=false` npm
      behavior it produces a warning on an unsupported version, nothing
      more. It is documentation with a machine-readable shape.
    - **The non-Next scripts bypass the gate entirely** (`test`,
      `typecheck`, `db:*`, `benchmark:*` run under `vitest`/`tsc`/`tsx`).
      The bounded invariant test in
      `tests/preprocessing-size-header-guard.test.ts` is therefore the
      actual regression signal for this protection, not the runtime floor.
    - No startup version check exists in application code, and none was
      added — a deliberate scope decision, not an oversight.
  - Secret non-leakage has no negative test.
  - Everything outside the four reviewed areas is simply unexamined.

## Approval and accepted residual risk

- **Reviewed by:** Claude Code, acting as `roles/security-reviewer.md`
  (review) and `roles/backend-engineer.md` (remediation), 2026-08-02.
  **Agent-verified tier throughout — not independently confirmed by a
  person.**
- **Human decision:** **RECORDED 2026-08-03.** The operator has reviewed
  the four outstanding items and decided each one. These are the
  operator's decisions; they are distinct from — and rest on — the
  Agent-verified evidence above, which no person has independently
  reproduced. Accepting a risk is not the same as verifying the evidence
  for it.

  1. **2b — temporary-directory disk-exhaustion residual: ACCEPTED AND
     DEFERRED.** Accepted for this local, single-operator release. OS
     temp cleanup is neither guaranteed nor relied upon as a mitigation.
     A defensive cleanup pass remains future work, to be reconsidered if
     repeated residue is observed, if disk exhaustion actually occurs, or
     if imports become concurrent or long-running.

  2. **1c — indexed-but-empty data-integrity ambiguity: ACCEPTED AND
     DEFERRED.** Accepted as an S4, non-security limitation. The intended
     future behavior is retained as specified: `skipped: true`,
     `skipReason: "read_failed"`. Reopen if the failure path becomes
     reproducible, or if a real user encounters an unexplained empty
     indexed file.

  3. **4c/4d post-fix single-buffer residual: ACCEPTED.** Accepted as the
     designed local import budget. Recorded explicitly, so the shape of
     what was accepted is not lost:
     - One decompression buffer may approach the remaining budget.
     - **Total Node/process memory can exceed that amount**, because other
       allocations are live at the same time. The ~500MB figure is a
       **buffer ceiling, not a process ceiling** — it does not bound
       overall process memory.
     - Lowering the overall budget, or adding a separate per-entry budget,
       is a future product/performance decision. Revisit on real
       memory-pressure evidence rather than pre-emptively.

  4. **No authentication: ACCEPTED CONDITIONALLY**, for continued local,
     single-operator use only. **This acceptance does NOT authorize
     public, shared, hosted, or untrusted-network deployment.** Any move
     toward remote access, multi-user use, or public/LAN exposure
     triggers a new security review and an explicit authentication and
     authorization decision *before* deployment — not after.

- **Date:** 2026-08-03 (operator decisions recorded). Document originally
  created 2026-08-02.

**Per `roles/security-reviewer.md`'s invariant, this document does not
declare the system secure.** It records evidence, tiers, and residual
risk for human acceptance.
