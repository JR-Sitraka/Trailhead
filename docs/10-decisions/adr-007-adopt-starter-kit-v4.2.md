# ADR-007: Adopt Starter Kit V4.2 for the Trailhead Upgrade phase

**Status:** Accepted

**Date:** 2026-07-27

**Context:** Trailhead's MVP-A and MVP-B were planned and built on
Starter Kit V4.1. The Trailhead Upgrade phase (project 2 on the kit)
adopts **V4.2**, which promotes several of Trailhead's own
retrospective findings into marked PROVISIONAL / PROVISIONAL-SPECULATIVE
kit items ahead of the two-project rule (ledger: kit `README.md`).

This is the **kit's first real update-propagation event** — the exact
scenario the kit CHANGELOG's own preamble says it exists to serve
("this file exists so a project can at least tell how stale its copy
is"). The phase-close retrospective must report how well the changelog
mechanism actually served it.

**Finding recorded at adoption time, for that retrospective:** the kit
CHANGELOG **has no V4.2 entry** — it ends at V4.1 (2026-07-19). The
propagation mechanism's first real use began with its source document
missing. The re-copy list below was therefore derived from the kit
README's "Provisional items in V4.2" ledger and the V4.2 files' own
headers, not from a changelog entry. Per this project's own binding,
the changelog fix belongs to the next kit release
(`playbooks/kit-release-review.md`), not to a mid-project kit edit.

**Decision:** Adopt V4.2 for the whole Upgrade phase. Re-copy the
changed/new files below from the V4.2 kit repo into Trailhead's kit
folders, replacing the V4.1 copies. Provisional items load and run
normally when triggered; each use or deliberate skip is logged in
`PROJECT-STATE.md` as it happens, feeding the phase-close
retrospective's §8 verdicts.

**Files to re-copy (manual task — exact paths):**

New in V4.2 (no V4.1 counterpart exists):
- `playbooks/session-recovery.md`
- `playbooks/design-handoff.md`
- `docs/06-components/design-handoff.template.md`
- `playbooks/visual-parity-review.md`
- `roles/security-reviewer.md`
- `playbooks/security-review.md`
- `docs/07-architecture/security.template.md`
- `roles/art-director.md`
- `playbooks/creative-direction-exploration.md`
- `docs/04-design-language/creative-direction.template.md`
- `playbooks/documentation-planning.md`
- `docs/07-architecture/documentation-plan.template.md`
- `playbooks/kit-release-review.md`

Changed in V4.2 (replace the V4.1 copy):
- `principles.md` (adds #9 external-content-as-evidence, #10
  artefacts-cross-boundaries-directly, #11 reader-docs-describe-
  verified-reality; #7 now carries the structurally-enforced
  checkpoint step — Trailhead's own commit-discipline finding,
  promoted on the severity justification)
- `orchestrator.md` (situational routing for the V4.2 additions;
  checkpoint step required in every task packet; "Decision habits"
  section, provisional)
- `playbooks/visualization-prompting.md` (credit-exhaustion fallback
  and tool-comparison methodology sections, provisional — both
  Trailhead findings)
- `README.md` (V4.2 provisional ledger; sizing/sub-slicing note)
- `CHANGELOG.md` — **currently unchanged upstream; carries no V4.2
  entry. Re-copy whenever the kit repo adds it; gap recorded above.**

**Consequences:**
- Every task packet this phase carries the checkpoint step and the
  V4.2 situational routing (session-recovery on abnormal ends;
  design-handoff/visual-parity around any screen work;
  security-reviewer on auth/sensitive-input work; documentation-
  planning at milestones).
- A provisional-items trail is maintained in `PROJECT-STATE.md` from
  this ADR forward; retrospective §8 may not be left blank.
- This project counts as a **same-codebase continuation** (project 2
  on the kit, project 1's codebase) — §8 verdicts and any promotion
  recommendations carry that qualifier explicitly.
- Kit changes mid-project remain prohibited; kit findings (including
  the missing-changelog-entry finding above) go to the retrospective.
