# ADR-010: Re-scope Upgrade item 4 — framework misdetection does not reproduce

**Status:** Accepted

**Date:** 2026-07-28

**Numbering note:** ADR-009 is reserved for the embedding-model choice
(item 3, imminent). This decision landed first in time; the gap is
deliberate, not a missing document.

**Context:** Upgrade item 4 was scoped from the implementation
retrospective's finding #7 — framework misdetection, with
`sindresorhus/got` reported as "Express." Benchmark stage A imported
`got` through the real pipeline into `trailhead_bench` and detection
returned `framework: null`. Root cause established from real
evidence: got's `package.json` carries no framework in
`dependencies` (`express` appears only in `devDependencies`, which
`detectStackFacts` does not scan). **`null` is correct behavior; the
misdetection does not reproduce against current code.**

Implementing a threshold change against a defect with no failing case
would mean changing detection logic with nothing to prove the change
worked — rejected on those grounds.

**Decision:** Item 4 is re-scoped from **fix** to **verify and
regression-proof**:
1. Confirm across the benchmark corpus that detection either reports
   a well-evidenced framework or declines to guess — no confident
   wrong answers anywhere in the corpus.
2. Keep the "Unknown" display semantics already specified
   (`repository-overview.md`, `export.md` amendments): a null
   detection has to render somehow, and rendering it as an honest
   "Unknown" — with `framework: null` in JSON — remains the correct
   product behavior regardless of how the value arose.
3. Make the benchmark's framework-detection metric the permanent
   guard against regression.

**Consequences:**
- OVERVIEW-U1 becomes a verification criterion against the corpus
  rather than a fix criterion; OVERVIEW-U2 (no over-correction)
  stands unchanged.
- No detection-threshold code change ships this phase unless the
  corpus verification actually surfaces a confident wrong answer.
- **Known limitation, recorded not hidden:** only 1 of 5 corpus repos
  (Trailhead → Next.js) has a positive framework case, so the metric
  largely measures correct declining. Adding a repo with a different
  real framework (Express, Vue) would strengthen it — a candidate
  corpus addition, not a blocker.
- The original finding stays valid as history: it was real when
  observed. Why it no longer reproduces (intervening fix vs.
  different conditions) was not investigated — a deliberate scope
  call, noted for the retrospective.
