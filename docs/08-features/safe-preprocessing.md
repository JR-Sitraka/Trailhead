# Feature: Safe Preprocessing

**Purpose:** Treat every imported repository as untrusted content and
neutralize the real attack surface (path traversal, symlink escape,
code execution) before anything is parsed or stored — per blueprint
§4.5 and `principles.md`'s baseline, carried into the PRD's confirmed
size limits.

**User Story:** As the platform operator, I want every import
processed as hostile input by default, so that a malicious repository
can't compromise the analysis environment or exfiltrate data.

**Functional Requirements:**
- Strip `.git`, `node_modules`, build/output directories, and binary
  files before any parsing happens.
- Validate every path inside a ZIP archive against traversal
  (`../`) before extraction.
- Reject or neutralize unsafe symlinks (targets outside the
  archive/repo root).
- Enforce the confirmed size limits: 150 MB ZIP compressed, 500 MB
  unpacked post-filter, 5,000 files indexed, 1 MB per-file parse
  ceiling.
- Never execute repository code, install dependencies, or run package
  scripts, under any circumstance.

**Non-Functional Requirements:** This is itself a non-functional/
security requirement layered under Repository Import — no additional
NFRs beyond the baseline.

**Inputs:** The raw imported archive or cloned repository contents
(from Repository Import).

**Outputs:** A filtered, safe file set ready for Repository Inventory/
Structural Analysis to consume — or an outright rejection if the
archive itself is unsafe.

**Business Rules:**
- A ZIP containing path traversal or unsafe symlinks is rejected
  **entirely** — this is a security rule, not a soft warning; no
  partial import happens.
- Files exceeding the 1 MB per-file limit are not parsed, but are
  still listed in the file tree, marked skipped with a reason (per
  `architecture.md`'s `File.skipped`/`skipReason` fields) — this is
  different from the outright-reject case above; individual oversized
  files don't fail the whole import.

**Validation Rules:**
- Every archive path checked against traversal before any file is
  written to disk.
- Every symlink's resolved target checked against the archive/repo
  root before being followed.
- File count checked against the 5,000 limit during traversal, not
  after — stop indexing further files once the limit is hit, and mark
  the job `truncated`.

**Error States:**
- Path traversal detected → reject the whole import (422), no
  `Repository` row created (if caught during initial import) — see
  Repository Import's error states for the user-facing version of
  this.
- Unsafe symlink detected → same as above.
- Zero supported files found after filtering → reject (422) with a
  specific reason, not a generic failure.

**Edge Cases:**
- A file that's individually safe but pushes the repo over 500 MB
  unpacked or 5,000 files → the import continues, `truncated` is set,
  remaining files past the limit are not indexed (not silently
  included, not silently dropped without a trace).
- An archive with zero `.git`/`node_modules` to strip (already clean)
  → proceeds identically, no special-casing needed.

**Accessibility:** N/A — this is a backend/security feature with no
direct UI surface. Its outputs (skip reasons, truncation) surface
through Repository Overview and File Explorer, whose accessibility
requirements are specified there.

**Analytics:** None specified for MVP-A.

**Dependencies:** Runs immediately after Repository Import accepts a
source, before Repository Inventory or Structural Analysis touch
anything.

**Acceptance Criteria:**
- [ ] A ZIP with a path-traversal entry is rejected outright, no
      partial data persisted.
- [ ] A ZIP with a symlink pointing outside the archive root is
      rejected outright.
- [ ] A repository at exactly the size/file-count limits imports
      successfully; one file over any limit triggers the correct
      partial/truncated/rejected behavior per the rule it violates.
- [ ] No repository code is ever executed, no dependencies installed,
      regardless of what the repository contains (e.g. a malicious
      `postinstall` script in `package.json` is never run).

**Out of Scope:** Runtime execution of any kind, dependency
installation, test execution, git-history analysis — all explicitly
excluded per the PRD, and this feature's job is specifically to make
sure none of that ever happens by accident.
