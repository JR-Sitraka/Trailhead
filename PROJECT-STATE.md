# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — item 3: widening APPROVED (gate 2 passed). v1.1.0
execution in flight.**

**Hash convention:** as of 2026-07-30, `main` HEAD `4e6745a` (the
prior round's placement commit; this round's commit lands on top of
it). Branch `upgrade/embedding-swap-bench` at `c76b463`.

## Widening — APPROVED by the person (2026-07-30)
**DOC-08 final wording (person's, supersedes both prior versions):**
*"Where does the project direct me for both adding an awesome list
and creating one of my own?"* → `contributing.md`. Preserves the
verified uniqueness (only file pointing to both destinations) while
phrasing it as a plausible contributor task. **The person explicitly
accepts the small remaining naturalness tradeoff required to make the
ground truth unambiguous.**

**DOC-09 through DOC-17 APPROVED**, with diagnostic classifications
recorded explicitly (person's, to be written into the manifest — not
left implicit):
- **Matched code/documentation intent pairs** (test intent
  separation, not just topic): DOC-09 ↔ SEM-07 (timeout docs vs.
  implementation); DOC-10 ↔ KC-04 (retry docs vs. calculation);
  DOC-11 ↔ KC-05 (error meaning vs. error-class implementation);
  DOC-15 ↔ KC-02 (preprocessing policy vs. path-traversal/security
  implementation).
- **Documentation controls, no meaningful in-repo code counterpart:**
  DOC-12 (caching substantially implemented by the external
  `cacheable-request` dependency — control, not mixed competition),
  DOC-16 (`KNOWN-GOOD.md`), DOC-17 (`README.md`).
- **Other mixed code/documentation:** DOC-13 (hooks/extension
  points), DOC-14 (TypeScript client and progress typing).
- **DOC-15 caveat retained:** `testing.md` is a legitimate secondary
  competitor; does not invalidate the query as long as
  `safe-preprocessing.md` remains the best answer to the approved
  reject-vs-skip wording.

**Measurement interpretation — APPROVED language (person's):** the
widened run is **more resistant to individual cutoff movements, NOT
statistically powerful.** The existing 1.0.0 reports remain valid for
their original manifest, must not be overwritten, and are not
directly interchangeable with the widened run.

## CRITICAL SEQUENCING — avoids a ~9h re-embed
One pgvector column holds one dimension for the whole database (the
constraint the SWAP-06 review established). `trailhead_bench`
currently holds Jina@768. Migrating back to 384 for MiniLM
**destroys** the Jina embeddings. Therefore:
1. **Run Jina under v1.1.0 FIRST** — corpus intact, benchmark re-run
   only, no re-embedding, fast.
2. **Snapshot Jina@768 to side tables** (tooling already built for
   SWAP-06) so it can be restored without re-embedding.
3. Then migrate to 384, re-embed MiniLM (~30 min), run MiniLM under
   v1.1.0.
4. On adoption, **restore Jina from snapshot** rather than
   re-embedding (~9h saved).
Doing MiniLM first would force a full Jina re-embed later — the
expensive path, avoided.

## Item 3 — REOPENED, unchanged reasoning (ADR-009)
q8's three wins stand (known_code +37.5pp, trap-rate −12.5pp,
semantic Top-1/Top-3 both +14.3pp). Criterion 4 needs confident
measurement under v1.1.0 before a final adoption call.

## Coding-agent policy — unchanged
Placement always Claude Code; this execution task is complex/
hard-gated → Claude Code.

## Provisional-items trail (V4.2 — feeds retrospective §8)
Unchanged.

## Upgrade scope — status
1 doc-drift — substantially DONE. 2 benchmark — v1.0.0 COMPLETE;
**v1.1.0 in progress.** **3 swap — REOPENED; widened comparison in
flight.** 4 "Unknown" — CLOSED. 5 observability — handoff frozen.
6 screen-reader — plan placed. 7 closeout — boxen + got orphaned-
state + check-got.ts + BATCH_SIZE length-awareness.

## Open questions
- The v1.1.0 comparison result (in flight) → final adoption call.
- Cloud-embedding scoping — deferred.
- Intent-aware ranking / dual embedding strategies — future scoping.
- `scripts/check-got.ts` disposition (item 7).
- Framework-review conversation — separate track.

## Current blocker
None.

## Last completed action
Widening approved with the person's final DOC-08 wording and explicit
diagnostic classifications; critical sequencing identified (Jina
first, snapshot, then MiniLM) — 2026-07-30.

## Next valid moves
1. Place this file.
2. Claude Code: v1.1.0 manifest write → Jina run → snapshot →
   migrate → MiniLM re-embed → MiniLM run → four-criteria comparison.
3. Person makes the final adoption call on real widened evidence.

## Files changed last round
- (pending this round's placement)
