# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A and MVP-B
shipped and publicly released. Current phase: **Trailhead Upgrade**
(project 2 on Starter Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — Layer 1 COMPLETE (2026-07-27), pending the kit's own
done-check.** Scope decided, priority confirmed, PRD Upgrade section
written into `product-prd.md` (revised in place, history preserved).
Per principles #6, Layer 1 formally closes when Layer 2's owner
confirms it can start without guessing — that confirmation happens as
the first act of the next round's Layer 2 open.

## Standing project rules (this phase)
- **All repo file placement/commits are Claude Code tasks** with a
  full task packet every round (person's standing instruction).
- Same-codebase-continuation qualifier on all retrospective §8
  verdicts and promotion recommendations.

## Provisional-items trail (V4.2 — feeds retrospective §8, may not be blank)
- 2026-07-27 — trail opened. No provisional item triggered yet.
- 2026-07-27 — security-reviewer/security-review deliberately not
  triggered: auth deferred to V2/V3. Re-evaluate when observability
  touches API surfaces.

## Upgrade scope — FINAL (2026-07-27, full detail in product-prd.md)
Priority order: 1 doc-drift fix (Gemini→Groq) → 2 golden benchmark
suite (core metrics; baseline on current model BEFORE swap) → 3
embedding model swap → 4 framework misdetection fix ("unknown"
allowed) → 5 LLM observability (visibility only) → 6 screen-reader
pass + fixes → 7 testing closeout (IMPORT-04, PREPROC-03 boundary,
Dashboard/Explorer rows).
Out: quota enforcement; auth (→V2/V3); blueprint V1 items; benchmark
perf metrics (runtime/indexing/memory — **deferred to V1 scope,
carried not dropped**); all Group C items; persistence; query
rewriting.

## Key decisions
- **ADR-007 (2026-07-27):** Starter Kit V4.2 adopted; re-copy
  committed and verified (amended commit `3dcf1ad`, 18 files). Kit
  CHANGELOG had no V4.2 entry at adoption — recorded for the
  retrospective's propagation-mechanism report.
- **Upgrade scope + priority (2026-07-27):** per interview; benchmark
  added at the person's own initiative — recorded in PRD.
- All prior decisions unchanged.

## Open questions
- None blocking. Framework-review conversation for retrospective
  findings remains a separate track, unchanged.

## Current blocker
None.

## Last completed action
PRD Upgrade section written (product-prd.md revised in place);
placement task issued — 2026-07-27.

## Next valid moves
1. **Open Layer 2:** confirm Layer 1 done from the UX seat, then
   decide which items need UX-flow work. Orchestrator's preliminary
   read (to be tested, not assumed): items 4, 5, 6 touch UI (Overview/
   Export "unknown" display; observability surface placement; screen-
   reader fixes) — items 1, 2, 3, 7 likely need no new flows.
2. Then architecture light-pass check: does ADR-004's stack cover the
   benchmark harness and observability, or is a new ADR needed?

## Files changed last round
- `docs/01-product/product-prd.md` (Upgrade section appended;
  provider-drift correction note added; MVP-B history preserved)
- `PROJECT-STATE.md` (this file)
