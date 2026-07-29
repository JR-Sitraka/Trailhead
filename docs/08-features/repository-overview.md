# Feature: Repository Overview

**Purpose:** Give a user a fast, honest, template-generated read of
what a repository is — stack, entry points, structure, and what
wasn't analyzed — without needing an LLM summary.

**User Story:** As a developer who just opened a repository, I want
an immediate structural summary, so that I understand the codebase
before browsing it file by file.

**Functional Requirements:**
- Detect and display: primary language, framework, package manager,
  build tool, test framework.
- List entry point file paths.
- List modules/packages with their paths.
- List detected configuration files.
- One-line description of the detected testing approach.
- Explicit "Not analyzed" section listing skipped files and reasons.
- Facts are template-generated from real detected data — never
  LLM-generated prose (a hard MVP-A/MVP-B boundary, not a style
  choice).

**Non-Functional Requirements:** None beyond baseline — this is a
read-only, fast-loading screen by design (denormalized fields on
`Repository`, per `architecture.md`, avoid any aggregation query at
request time).

**Inputs:** None beyond the repository ID in the URL — this screen
has no user-entered data.

**Outputs:** The rendered facts table.

**Business Rules:**
- Detection happens once per `AnalysisJob` and is denormalized onto
  `Repository` (`primaryLanguage`, `framework`, `packageManager`,
  `buildTool`, `testFrameworkSummary`) — Overview never recomputes
  these at render time.
- "Entry points" and "Configuration files" are drawn from `File` rows
  with `category` set to `entrypoint`/`config` respectively
  (`architecture.md`) — detection of *which* files get that category
  happens during Structural Analysis/Repository Inventory processing,
  not on this screen.

**Validation Rules:** N/A — read-only screen.

**Error States:**
- Repository not yet `ready` (still `queued`/`analyzing`/`failed`) →
  this screen shouldn't be reachable in that state per the flow doc
  (Explore repository's entry point requires `ready`); if reached
  anyway, show the current status clearly rather than a broken facts
  table.

**Edge Cases:**
- A repository with zero detected entry points, zero config files, or
  an undetectable framework → each section should say so plainly
  (e.g. "No entry points detected") rather than rendering an empty
  list with no explanation — consistent with the "honest about
  limitations" design principle, though this exact copy wasn't
  explicitly demonstrated in the built mock (its data was always
  populated) — worth confirming this state is designed, not just
  assumed to "handle itself."
- A repository that hit the 5,000-file truncation limit → the "Not
  analyzed" section should say so explicitly, not just list individual
  skipped files as if the picture were otherwise complete.

**Accessibility:** Section headings should be real heading elements
for screen-reader navigation between the six fact sections — not
confirmed in the built mock (styled as `<h2>`-equivalent visually, not
verified as semantically correct); worth checking during
implementation.

**Analytics:** None specified for MVP-A.

**Dependencies:** Depends on Repository Inventory/Structural Analysis
having populated `Repository`'s denormalized fields and the relevant
`File` rows. Feeds nothing else directly (a terminal screen in the
navigation sense).

**Acceptance Criteria:**
- [ ] All six sections render correctly for a repository with a
      typical Next.js/TypeScript structure.
- [ ] The "Not analyzed" section accurately lists every skipped file
      and its real reason, for a repository that had skips.
- [ ] A repository with no skips shows an appropriately empty/absent
      "Not analyzed" section rather than a misleading placeholder.
- [ ] No LLM-generated text appears anywhere on this screen.

**Out of Scope:** LLM-generated summaries, external-service detection
beyond what's stated in the confirmed MVP-A scope, confidence scoring
— all MVP-B.

---

# Upgrade phase amendment (2026-07-27) — "Unknown" detection state (item 4)

Supersedes this spec's treatment of undetectable stack facts; the
Edge Case above ("undetectable framework → say so plainly") is now a
first-class requirement, not a hoped-for behavior:

- **Detection may return "Unknown" for any heuristic stack fact**
  (framework, and by the same rule build tool / test framework /
  package manager where the heuristic lacks real evidence). "Unknown"
  is a confident, honest answer — the fix for the documented
  misdetection class (`got` reported as "Express") is that low-
  evidence detection stops guessing.
- **Display:** the stack section renders "Unknown" as an ordinary
  value in the muted register — visually normal, not an error or
  warning state. Consistent with the project's honest-empty-state
  precedent.
- **Additional acceptance criteria:**
  - [ ] OVERVIEW-U1: A repository whose framework the heuristic
        cannot support with real evidence displays "Unknown" — not a
        guessed framework (verified against a real repo from the
        misdetection class, e.g. a non-framework library).
  - [ ] OVERVIEW-U2: A repository with strong framework evidence
        still detects correctly (no over-correction to Unknown —
        measured by the benchmark's framework-detection metric).
- The detection-threshold mechanics live in the analysis layer, not
  this screen; this amendment fixes what the screen may claim.

---

# Amendment (2026-07-28, ADR-010) — item 4 re-scoped

The framework misdetection this amendment was written against **does
not reproduce** (see ADR-010 for the evidence). The "Unknown" display
semantics above stand unchanged — a null detection still has to
render honestly. What changes is the nature of the work:

- **OVERVIEW-U1 is now a verification criterion:** across the
  benchmark corpus, detection either reports a well-evidenced
  framework or declines to guess — verified by the benchmark's
  framework-detection metric, not by shipping a threshold change.
- **OVERVIEW-U2 stands unchanged** (no over-correction).
- No detection-logic change ships unless corpus verification surfaces
  an actual confident wrong answer.

---

# Verification result (2026-07-28) — gap found and scoped

Kilo Code's real-server verification (`GET /repositories/.../overview`,
`GET .../export/json`, `got` repository, framework `null`):

- **Overview: GAP.** `src/app/repositories/[id]/overview/page.tsx:115`
  renders `"Not detected"` for every null stack fact — the amendment
  requires `"Unknown"` in the ordinary muted register. **Fix scoped:
  display-label change only** (`displayValue` fallback string), across
  all five stack fields, not just framework. Underlying `null` data
  flow must NOT change.
- **JSON export: VERIFIED.** `src/server/services/export.ts:118-124`
  correctly passes `null` through untouched — no guessed value, no
  "Unknown" string. No change needed.
- No existing test asserts the literal "Not detected" string
  (grep-confirmed) — the fix carries no regression risk to current
  tests; a new test asserting "Unknown" for a null-framework repo is
  the one addition needed.
