# Feature: Repository Import

**Purpose:** Get a repository (public GitHub URL or ZIP upload) into
the system as a `Repository` record and queue its first analysis.

**User Story:** As a developer, I want to import a repository by URL
or ZIP file, so that I can start understanding its structure without
manual setup.

**Functional Requirements:**
- Accept a public GitHub repository URL, with optional branch
  selection when the repo has more than one branch.
- Accept a ZIP file upload as an alternative source.
- Capture the commit SHA (GitHub: from the selected branch's HEAD;
  ZIP: treat the archive contents as the snapshot identity).
- Create a `Repository` row and an initial `AnalysisJob` (status
  `queued`) in the same operation — per
  `docs/07-architecture/architecture.md`'s `POST /api/repositories`.

**Non-Functional Requirements:** None beyond the project-wide
baseline (`principles.md` #5) and the size limits below, which are
this feature's actual performance boundary.

**Inputs:** GitHub URL + optional branch (text), or a ZIP file
(binary, multipart upload).

**Outputs:** A `Repository` record with status `queued`, immediately
visible in the Dashboard list.

**Business Rules:**
- Multiple `Repository` records may point at the same source URL —
  no uniqueness constraint. Re-importing the same repo is allowed and
  creates a separate entry (explicit decision, not an oversight — no
  MVP-A flow requires deduplication).
- ZIP-sourced repositories always start as `source: 'zip'`,
  `sourceUrl: null`; GitHub-sourced always `source: 'github'` with a
  non-null `sourceUrl`.

**Validation Rules:**
- GitHub URL must match a `github.com/<owner>/<repo>` pattern and be
  publicly reachable — reject otherwise (400).
- ZIP file must be under 150 MB compressed (PRD size limits) — reject
  over that (413).
- ZIP file must actually be a valid ZIP archive — reject otherwise
  (400).

**Error States:**
- Invalid/unreachable GitHub URL → 400, reject before creating any
  record.
- Private GitHub repo → 400, with a message distinguishing this from
  "doesn't exist" (private repos are out of MVP-A scope, not a
  transient failure) — per `ux-user-flows.md`'s Import flow.
- ZIP exceeds 150 MB → 413, reject before upload completes.
- ZIP is not a valid archive → 400.
- User navigates away mid-upload → import abandoned cleanly, no
  partial `Repository` row persisted.

**Edge Cases:**
- Repository exceeds 500 MB unpacked or 5,000 files after filtering →
  import still succeeds; `AnalysisJob.truncated` is set `true` and
  this is surfaced in Overview's "Not analyzed" section, not silently
  dropped.
- GitHub repo has zero branches beyond default → branch selector is
  skipped entirely, not shown empty.

**Accessibility:** Standard form accessibility — labeled inputs,
visible focus states, error messages associated with their field via
`aria-describedby`. No feature-specific requirement beyond the
project baseline.

**Analytics:** None specified for MVP-A — no analytics infrastructure
exists in this phase's scope.

**Dependencies:** Feeds directly into Safe Preprocessing (this
feature validates *source reachability*; Safe Preprocessing validates
*archive/content safety* — two different concerns, see that spec) and
queues the `AnalysisJob` that Repository Overview/File Explorer/
Symbols/Search all eventually depend on.

**Acceptance Criteria:**
- [ ] A valid public GitHub URL creates a `Repository` with status
      `queued` and a matching `AnalysisJob`.
- [ ] A valid ZIP under 150 MB does the same.
- [ ] An invalid URL, private repo, oversized ZIP, or invalid ZIP is
      rejected with the correct error and creates no `Repository` row.
- [ ] Branch selector appears only when the GitHub repo has more than
      one branch. — **NOT IMPLEMENTED. Deferred, see below.**

---

## Branch selection — CURRENT vs. DEFERRED (recorded 2026-08-02, item 7)

Added after real verification found this spec described behavior that
was never built. Recorded here rather than silently left, per
`principles.md` #3.

### Current, shipped behavior
- A GitHub import **always uses the repository's default branch** and
  records that branch's resolved HEAD commit SHA. The archive is
  fetched at that same commit.
- **No branch selector exists in the shipped UI.**
  `AddRepositoryModal.tsx` contains no branch control of any kind.
- `POST /api/repositories` does accept an optional `branch` form
  field, and `fetchGithubRepoInfo` does return the repo's full branch
  list — but the value is **discarded**: `route.ts` computes
  `selectedBranch` and never uses it, and `fetchGithubRepoInfo` takes
  no branch argument, always resolving
  `/commits/${default_branch}`. Passing `branch` is therefore a
  silent no-op, not a partial implementation.

**Real evidence (2026-08-02):** importing `octocat/Hello-World` with
`branch=test` recorded `7fd1a60b…` (the HEAD of `master`, the default
branch) rather than `b3cbd5bb…` (the real HEAD of `test`), verified
against GitHub's API directly. Covered by `tests/import-branch.test.ts`.

### Deferred scope — real future work, not a bug fix
Full multi-branch support is a genuine feature with a UI and a backend
half, and needs its own deliberate planning pass rather than being
patched in during a closeout:
1. Branch discovery surfaced to the client, and a **conditional**
   selector that appears only when a repo has more than one branch
   (and is skipped entirely, not shown empty, when it does not).
2. Threading the selected branch through SHA resolution
   (`fetchGithubRepoInfo` gaining a branch argument).
3. Threading it through zipball retrieval so content and SHA come from
   the same commit.
4. Deciding the interaction with `commitSha` integrity (ADR-006) —
   an import must still never succeed with a missing commit identity.

**This is a deferral, not a defect awaiting a fix in this phase.** The
functional requirement above ("from the selected branch's HEAD")
describes the deferred target state, not current behavior.

**Out of Scope:** Private repositories, OAuth, organization accounts,
automatic re-sync on new commits, local-path ingestion — all
explicitly excluded per the PRD.
