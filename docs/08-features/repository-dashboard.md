# Feature: Repository Dashboard

**Purpose:** Let a user see all imported repositories at a glance and
manage them (open, reanalyze, delete) — the product's entry point.

**User Story:** As a developer, I want to see every repository I've
imported, its analysis status, and manage it from one place, so that
I don't have to remember what I've imported or hunt for it.

**Functional Requirements:**
- List all `Repository` records with name, status pill, last-analyzed
  commit SHA, and last-analyzed relative time.
- Filter the list by status (All/Ready/Analyzing/Queued/Failed).
- Client-side text filter by name/path (the Dashboard screen's
  "Filter repositories" search — kept per the person's decision to
  retain this unrequested-but-useful Magic Patterns addition).
- Per-repository actions: Open (navigates to Overview), Reanalyze,
  Delete.
- "Add repository" entry point opens the import flow (see
  `repository-import.md`).

**Non-Functional Requirements:** No pagination in MVP-A — an explicit
architecture decision (`architecture.md`), not an oversight, given no
stated need at this scale.

**Inputs:** None beyond user interaction (clicks, filter/search
text).

**Outputs:** Rendered list; triggers navigation or the Reanalyze/
Delete actions below.

**Business Rules:**
- "Open" is only meaningfully actionable when status is `ready` — per
  the built screen, the Open button is disabled otherwise.
- Reanalyze and Delete are always available regardless of status
  (per the built screen — no status gate on those two actions).

**Validation Rules:** N/A — this screen has no direct data-entry
inputs of its own (import validation lives in `repository-import.md`).

**Error States:**
- `GET /api/repositories` fails → the list should show a clear error
  state, not an empty list indistinguishable from "zero repositories
  imported" (a real gap to close during implementation — the built
  mock only demonstrates the zero-repositories case, not a fetch
  failure case, since it has no real backend yet).

**Edge Cases:**
- Zero repositories imported → true empty state ("No repositories
  yet — import one to get started"), distinct from "zero results
  match the current filter" — both states exist in the built screen,
  confirmed via `dashboard-review.md`.
- A repository stuck in `analyzing` far longer than expected → no
  specific timeout/stale-job UI is specified for MVP-A; this is a
  real gap, worth flagging for `docs/09-testing/testing.md` to check
  during QA rather than silently assuming it never happens.

**Reanalyze (manual) — sub-feature detail:**
- Triggers `POST /api/repositories/:id/reanalyze`.
- Rejected with 409 if an `AnalysisJob` is already queued/running for
  that repository (`ux-user-flows.md`'s explicit duplicate-trigger
  rule) — the UI should surface this as a clear message, not a silent
  no-op.
- On success, prior `File`/`Symbol` rows are superseded (see
  `architecture.md`'s reanalysis semantics) — the repository's last
  successful state remains visible and should read as stale while the
  new job runs, per blueprint §4.4 (even though MVP-A has no
  dedicated staleness UI beyond the status pill going to `analyzing`).

**Delete — sub-feature detail:**
- Requires explicit confirmation via the Modal component
  (`component-specs.md`) before the delete actually happens — this
  was the one real Fail found and fixed during the Dashboard's
  compliance review; the confirmation step is not optional.
- Triggers `DELETE /api/repositories/:id`; 409 if a job is currently
  running (must be cancelled first, then deletion proceeds — not: the
  delete is rejected outright).
- Cancelling the confirmation dialog leaves the repository list
  completely unchanged.

**Accessibility:** `aria-modal`/`aria-labelledby` on the delete
confirmation dialog (present per `component-specs.md`'s Modal spec);
focus defaults to Cancel, not Delete, on open. Full keyboard-only
flow through the list and dialog remains Unverified per every
screen's honest accessibility line — worth a real test pass before
implementation is called done.

**Analytics:** None specified for MVP-A.

**Dependencies:** Depends on Repository Import (creates the rows this
screen lists) and every workspace screen (Open navigates into them).

**Acceptance Criteria:**
- [ ] All imported repositories appear with correct status, SHA, and
      relative time.
- [ ] Status filter and text filter both narrow the visible list
      correctly, including in combination.
- [ ] Reanalyze on a repository with no active job succeeds; on one
      with an active job returns 409 and the UI reflects it clearly.
- [ ] Delete requires confirmation; cancelling changes nothing;
      confirming removes the repository.
- [ ] Zero-repositories and zero-filter-results are visually and
      textually distinct states.

**Out of Scope:** Team collaboration, billing, any bulk actions
(bulk-delete, bulk-reanalyze) — none requested, none built.
