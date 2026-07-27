# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — Layers 8/9 drafted, pending one confirm + placement.**
All feature specs done (items 2/3/5 as files; item 4 as in-place
amendments to Overview/Export). Architecture full-pass additions
drafted (LlmRequestLog, /api/observability, dimension-migration note,
provider correction). testing.md Upgrade rows drafted. Item 1
substantially executes with this placement (architecture + export +
testing NFR corrected to Groq).

## Approval gates passed
- 2026-07-27 — Dashboard observability panel: human visual approval,
  all four states. Artifact `cfe1be53…`.

## Standing project rules / Provisional trail
Unchanged from last round (see git history) — plus nothing new
triggered this round.

## Upgrade scope — FINAL
1 doc-drift (EXECUTING via this placement) → 2 benchmark (spec done)
→ 3 swap (spec done) → 4 "Unknown" (amendments drafted) → 5
observability (design+spec done) → 6 screen-reader (test plan rows
drafted) → 7 closeout (targets restated).

## Key decisions
- **PENDING CONFIRM — full-history constraint restatement:** Groq's
  real limits (verified 2026-07-27: 1,000 req/day, 100K tokens/day)
  invalidate the original "request-limited, not token-metered"
  justification for full conversation history. Recommendation on the
  table: keep behavior, restate constraint honestly, measure via OBS
  counters, windowing stays deferred-pending-evidence. Drafted docs
  assume this; the person confirms or reopens before placement.
- JSON export represents Unknown as `framework: null` (a display
  label is not a data value).
- No synthetic health checks; global metrics; embedding uncounted —
  as previously recorded.
- All prior decisions unchanged.

## Open questions
- The full-history confirm above (blocking this placement only).
- Framework-review conversation — separate track.

## Current blocker
None beyond the confirm.

## Last completed action
Layers 8/9 batch drafted (5 append/amendment files + this);
Groq limits verified by real search — 2026-07-27.

## Next valid moves
1. Person confirms full-history restatement → placement task runs.
2. Then Layer 8/9 CLOSES and implementation begins: first packet is
   the panel's design-handoff (provisional playbook, live run),
   then implementation order per priority: item 1 residuals → 2 →
   3 → 4 → 5 → 6 → 7.

## Files changed last round
- `docs/07-architecture/architecture.md` (Upgrade section APPENDED +
  one in-place Generation-row correction)
- `docs/08-features/repository-overview.md` (amendment APPENDED)
- `docs/08-features/export.md` (amendment APPENDED)
- `docs/09-testing/testing.md` (Upgrade rows APPENDED)
- `PROJECT-STATE.md` (this file)
