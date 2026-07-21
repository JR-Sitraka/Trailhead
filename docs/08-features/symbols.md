# Feature: Symbols

**Purpose:** Extract and expose a browsable index of a repository's
functions, classes, interfaces, imports, and exports, distinct from
free-text search.

**User Story:** As a developer, I want to see what functions, classes,
interfaces, imports, and exports exist in a repository without reading
files directly, so that I can quickly orient myself in unfamiliar code
and understand its module surface.

**Functional Requirements:**
- Parse JS/TS source (via `web-tree-sitter`, per ADR-002) to extract
  functions, classes, interfaces, imports, and exports, each with file
  path and line range.
- List extracted symbols, filterable by kind (Function/Class/
  Interface/Import/Export/All) — **extended 2026-07-19** to add
  Import/Export, resolving the display-surface gap flagged below.
- Each symbol row reads as a jump target to its definition location in
  File Explorer (wiring the actual navigation is an implementation
  task; the screen's design already accounts for it).

**Non-Functional Requirements:** Kind filtering happens server-side
(`GET /api/repositories/:id/symbols?kind=...`) — an explicit
architecture decision, not the client-side filtering the mock
demonstrated, since a real backend may hold far more symbols than the
mock's fixed 10.

**Inputs:** Kind filter selection.

**Outputs:** Filtered symbol list.

**Business Rules:**
- Symbols are extracted during the same `AnalysisJob` that populates
  `File` rows — a `Symbol` always belongs to a `File`, which belongs
  to a `Repository` (`architecture.md`).
- **Resolved 2026-07-19:** imports and exports are now displayed on
  this screen, filterable as their own kinds. Route declarations
  still surface in Repository Overview's facts table instead, per
  `information-architecture.md`'s explicit scope note — that
  distinction is unchanged, only the imports/exports gap was closed.
- An import and an export can legitimately point at overlapping
  file/line territory as a function's own definition (e.g. `export
  function getPayments` appears both as a Function-kind symbol at its
  definition and as an Export-kind symbol marking the module's export
  surface) — this is intentional, not a duplicate-data bug, and
  matches how real static-analysis tools typically model exports as a
  distinct reference from the definition itself.

**Validation Rules:** N/A — no user-entered data beyond the filter
selection.

**Error States:**
- Repository not yet `ready` → 409, consistent with Overview/Explorer.

**Edge Cases:**
- **Zero symbols extracted for a repository** (e.g. an unsupported
  file-type-only repo that still passed preprocessing) → explicit
  empty state required per the flow doc. **This was an honestly-
  flagged gap on the built mock** — the empty-state code path exists
  but wasn't demonstrated as reachable with the mock's fixed data.
  This acceptance criterion must be verified against a *real* zero-
  symbol repository during implementation, not assumed to work because
  the code looks right.
- A repository with symbols numbering in the hundreds or thousands —
  the mock only demonstrates 10; no pagination or virtualization was
  specified or built. Worth a real decision before this becomes a
  performance problem, not an assumption that it'll be fine.

**Accessibility:** Filter chips lack `aria-pressed` on the active
state currently (`component-specs.md`'s `FilterChipGroup` finding) —
should be added here specifically, since kind filtering is this
screen's primary interaction.

**Analytics:** None specified for MVP-A.

**Dependencies:** Depends on Structural Analysis (part of the same
`AnalysisJob` as Repository Inventory) having populated `Symbol` rows.
Its rows are meant to jump into File Explorer — see that feature's
Dependencies note on this same cross-link.

**Acceptance Criteria:**
- [ ] Every function, class, interface, import, and export
      tree-sitter can extract from a typical TS/JS repository appears
      with correct kind, name, and file:line.
- [ ] Kind filtering (including Import and Export) returns the
      correct subset, server-side.
- [ ] A repository with zero extracted symbols shows the required
      empty state — **verified against a real zero-symbol case**, not
      just code-reviewed.

**Out of Scope:** Free-text search (a separate screen/feature),
inline source preview within a row, semantic/fuzzy symbol matching.
