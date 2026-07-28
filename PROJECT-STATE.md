# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 2 (benchmark) STAGE A COMPLETE; at the ground-truth
gate.** Harness, bench DB, corpus import, manifest, and unapproved
candidates all real and verified (branch `upgrade/benchmark-harness`,
HEAD `db7f43327e701bb64384329b9a60cc675b1aa5fc`; main HEAD
`600a4bc387ff8a6a43243ba4cc3dcee61f5031ca` = the ADR-008 placement).

## Approval gates passed
- 2026-07-27 — observability panel visual approval (all four states).
- *(OPEN: benchmark ground-truth gate.)*

## Benchmark corpus — REAL, imported and verified (2026-07-28)
`trailhead_bench` (pgvector 0.8.5), all five pinned and re-verified
via independent SQL:
| Repo | files | symbols | chunks |
|---|---|---|---|
| JR-Sitraka/Trailhead (`19221f3d…`) | 225 | 1047 | 1471 |
| sindresorhus/got | 127 | 1666 | 2481 |
| sindresorhus/escape-string-regexp | 13 | 6 | 15 |
| openai/DALL-E | 11 | 0 | 22 |
| sindresorhus/awesome | 23 | 0 | 50 |
Verified: BENCH-01, BENCH-02 (fail-fast exercised for real),
BENCH-07. Agent-verified tier; not person-confirmed.

## RESOLVED: the `got` framework question (2026-07-28)
`framework: null` for `got` is **correct behavior, not
misdetection** — evidence: got's `package.json` carries no framework
in `dependencies` (`express` is a devDependency, which
`detectStackFacts` does not scan). **The "got reported as Express"
case from the implementation retrospective does NOT reproduce against
current code.** Consequence: item 4's premise needs re-grounding —
decision pending with the person (re-scope to verification +
regression-proofing / hunt for a reproducing case / proceed as
written). Ground truth for got's `knownFramework` should be
null/unknown once the item-4 semantics land.

## Ground-truth review — orchestrator's pass on the 24 candidates
- **Systemic flag:** 9 candidates (KC-04, KC-05, KC-08, SEM-03,
  DOC-03, DOC-04, DOC-05, DOC-07, DOC-08) had ground truth chosen by
  **filename inference, not content reading** — contaminated
  provenance in a benchmark built to detect filename bias. Each needs
  content verification before approval.
- SEM-02: ambiguous (two files, vague question) — rewrite or drop.
- KC-07 / SEM-05: near-duplicates on the same file+concept — keep one.
- DOC-02: near-tautological (question names the file in all but
  path) — rewrite or drop.
- **Manifest-wide rule to adopt:** test files are never valid ground
  truth; the question is always "where is this implemented."
- Yield: 15 of 24 usable as-is.

## Standing project rules / Coding-agent trial
Claude Code trial evidence continues strongly positive (stopped at
the missing-file gate rather than reconstructing PROJECT-STATE.md
from context; independent SQL verification; honest tier separation
between "file exists" and "file answers the question"). **Person's
verdict still owed.**

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged; `session-recovery.md` still untriggered.

## Upgrade scope — status
1 doc-drift — substantially DONE. **2 benchmark — stage A DONE, at
ground-truth gate.** 3 swap — gated on BENCH-04; ADR is ADR-009.
**4 "Unknown" — premise re-grounding decision pending (see above).**
5 observability — handoff frozen. 6 screen-reader — plan placed.
7 closeout — carries boxen zero-files + got orphaned-state.

## Open questions
- Item 4 re-scoping decision (a/b/c) — recommendation on record: (a).
- Framework-review conversation — separate track.

## Current blocker
The human ground-truth gate (by design).

## Last completed action
Candidate review pass completed; got-detection question resolved;
trap-authoring worksheet issued — 2026-07-28.

## Next valid moves
1. Person: authors 8 trap queries (4 got / 4 Trailhead); decides
   item 4's re-scoping; verdicts the 9 flagged candidates.
2. Then: approved set written into `manifest.json` (status flipped),
   stage B (BENCH-03/04/05/06) → committed baseline.
3. Then item 3 (swap) research → ADR-009.

## Files changed last round
- `PROJECT-STATE.md` (this file)
