# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. Current phase: **Trailhead Upgrade** (project 2 on Starter
Kit V4.2, ADR-007, same codebase).

## Phase
**Upgrade — PLANNING COMPLETE (Layers 1–9). Implementation phase
opening.** All specs, architecture, and test rows placed (`a4647e1`).
Design handoff for the panel written and frozen ahead of its turn in
the order.

## Approval gates passed
- 2026-07-27 — Dashboard observability panel: human visual approval,
  all four states (artifact `cfe1be53…`).

## Standing project rules (this phase)
- All repo file placement/commits are Claude Code tasks, full packet
  every round.
- Same-codebase-continuation qualifier on §8 verdicts/promotions.

## Provisional-items trail (V4.2 — feeds retrospective §8)
- 2026-07-27 — security-reviewer deliberately not triggered (auth →
  V2/V3; observability endpoint is read-only, no auth surface, no
  sensitive data — re-evaluated at spec time, still not triggered).
- 2026-07-27 — credit-exhaustion section: code-first used by choice,
  exhaustion not re-observed (honest nuance for §8).
- **2026-07-27 — `playbooks/design-handoff.md` USED (first live run
  of the phase).** Produced `docs/06-components/design-handoff.md`
  for the observability panel. Notable for §8: the playbook's
  implicit-wrapper-context step caught a real ambiguity (Dashboard's
  `max-w-6xl` container vs. the panel's own margin); its
  prototype-shortcut step caught the mock-only cycler; the loading
  state was an unlisted gap the playbook's structure surfaced anyway.
  Also a real timing finding: the playbook says "after approval,
  before implementation" — here those are separated by four other
  work items, so the handoff was written early to freeze the
  artefact. Worth reporting whether that early-freeze reading holds.
- `playbooks/visual-parity-review.md` — scheduled, runs after the
  panel is implemented (item 5).

## Upgrade scope — FINAL, with status
1 doc-drift — **substantially DONE** (architecture Generation row,
  export/testing NFR corrections placed); residual sweep of any
  remaining stale mentions folds into item 5's work.
2 benchmark — spec done, **next to implement**.
3 swap — spec done; hard-gated on BENCH-04 baseline; ADR-008 pending.
4 "Unknown" — amendments placed.
5 observability — design + spec + handoff done; implement after 4.
6 screen-reader — test plan rows placed.
7 closeout — targets restated in testing.md.

## Key decisions
- **CONFIRMED 2026-07-27 (was pending last round): full conversation
  history is KEPT**; the Groq token-ceiling reality (1,000 req/day,
  100K tokens/day, verified) is stated honestly in architecture.md
  rather than triggering a behavior change; OBS counters make it
  measurable; windowing stays deferred-pending-real-evidence.
- Loading state for the panel = the metrics-unavailable treatment
  (decided in the handoff, not left to the implementer).
- All prior decisions unchanged.

## Open questions
- **Benchmark curation scope** — the query set + ground truth is real
  human work (the PRD names it as the honest cost). How it gets
  produced is the first implementation fork: person-curated from
  scratch, or agent-proposed candidates that the person verifies and
  edits. Not yet decided.
- Framework-review conversation — separate track.

## Current blocker
None.

## Last completed action
Design handoff written and frozen; full-history decision recorded as
confirmed (correcting last round's stale PENDING text) — 2026-07-27.

## Next valid moves
1. Place this round's two files.
2. Decide the benchmark-curation fork, then compile the first
   implementation task packet (item 2, benchmark harness) — with
   checkpoint step, preflight, and playbooks-considered-and-excluded
   line, per orchestrator.md.

## Files changed last round
- `docs/06-components/design-handoff.md` (new)
- `PROJECT-STATE.md` (this file)
