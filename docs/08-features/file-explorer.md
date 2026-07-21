# Feature: File Explorer

**Purpose:** Let a user browse a repository's actual file tree and
read a specific file's source with line numbers.

**User Story:** As a developer, I want to browse the file structure
and open individual files, so that I can read the actual code behind
what Overview and Symbols summarize.

**Functional Requirements:**
- Render the full file tree (folders expandable/collapsible, files
  selectable).
- Render the selected file's content with line numbers, read-only.
- Mark skipped/not-analyzed files distinctly in the tree.
- Selecting a skipped file shows an explanatory message instead of
  code content.
- Reachable directly from a Search result (jump to a specific
  file/line), not only via manual browsing.

**Non-Functional Requirements:** None beyond baseline. Desktop-primary
per `design-tokens.md` — no mobile-specific behavior required.

**Inputs:** File/folder selection (click).

**Outputs:** Rendered tree state and source content.

**Business Rules:**
- File content is served per-file (`GET /api/repositories/:id/files/*path`),
  not bundled into the tree response — the tree payload deliberately
  excludes `content` (`architecture.md`) to keep it lightweight for
  large repositories.
- Skipped files remain visible in the tree (never silently hidden) —
  this is the flow doc's explicit error/edge requirement, not
  optional.

**Validation Rules:** N/A — read-only, no user-entered data beyond
selection.

**Error States:**
- Requested file path doesn't exist → 404, tree should not have
  offered it as selectable in the first place (a real invariant to
  test, not just an API-level concern).
- Repository not yet `ready` → 409, same reasoning as Overview.

**Edge Cases:**
- A file that's skipped for a *different* reason than the built
  mock's example (1MB limit) — e.g. an unsupported syntax extension —
  should show its actual specific reason, not a generic "not
  analyzed" message. The built screen demonstrated one reason; the
  real backend needs to surface whichever real reason applies
  (`File.skipReason`).
- Deeply nested folder structures — the built mock only demonstrates
  2-3 levels of nesting; real repositories may go deeper. No specific
  depth limit is stated in the PRD, so none should be invented here —
  worth flagging if this becomes a real UX problem during
  implementation rather than assuming it's fine.

**Accessibility:** File tree buttons are real `<button>` elements
(tab-reachable) per the built source — full keyboard-only tree
navigation (arrow keys between siblings, per typical tree-view
patterns) was not implemented in the mock and should be a real
decision during implementation, not assumed to work by default from
plain buttons alone.

**Analytics:** None specified for MVP-A.

**Dependencies:** Depends on Repository Inventory/Structural Analysis
having populated `File` rows (including `content` for non-skipped
files). Is also the jump-target for Search results and (conceptually)
Symbols rows, though neither of those cross-screen links is wired up
in the MVP-A mocks — a real implementation task, not a design gap.

**Acceptance Criteria:**
- [ ] The full file tree renders and expand/collapse works for every
      folder.
- [ ] Selecting a non-skipped file shows its real content with
      accurate line numbers.
- [ ] Selecting a skipped file shows its specific skip reason, not a
      generic message.
- [ ] A file tree entry for every file that exists in the repository
      is present, including skipped ones.

**Out of Scope:** Editing, any write capability, inline symbol
annotation within the source view (that's Symbols' job) — all
explicitly excluded per the brief this screen was built from.
