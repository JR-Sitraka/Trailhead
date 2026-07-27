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
