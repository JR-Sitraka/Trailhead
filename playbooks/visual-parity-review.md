# Playbook: Visual parity review

> **Status: PROVISIONAL** — promoted from a single project's
> retrospective (Trailhead, 2026-07). Confirm, revise, or remove at
> the next project's retrospective (see its provisional-verdicts
> section). Provisional means loaded and used normally — the marker
> governs its future, not its present.

Load after an approved visual artefact has been implemented, and after
any later production adaptation that can change rendering.

**Why this playbook exists:** Trailhead's most significant visual
findings — a never-built dashboard header, a doubled header on another
screen — were caught only by directly comparing the real running
screen against the approved mock. No automated test was looking,
because none had been asked to. Automated testing reliably caught
logic bugs and caught visual-fidelity loss zero times across the whole
project; this comparison is the check that class of problem requires.

## Procedure

1. Record the comparison environment: browser/version, viewport,
   device scale, fonts, theme, data fixture, and any frozen
   time-dependent values — parity claims are only as strong as the
   environment they were made in.
2. Render the approved reference and the implementation under the
   closest controlled conditions available; capture implementation
   screenshots for every required viewport and state.
3. Compare structure, hierarchy, typography, color/tokens, alignment,
   spacing, assets, states, and responsive behavior. Use screenshot
   diffs or overlays where practical; inspect computed browser values
   where available.
4. For complex screens, implement and lock incrementally — frame,
   navigation, header, primary content, secondary areas, components,
   typography, fine spacing, responsive layouts, then
   states/interactions — so a fidelity loss is caught at the layer it
   entered, not at the end.
5. Classify every difference: **Fail**, **Accepted deviation**,
   **Environment variance**, or **Unverified** — with evidence, per
   the tiers in `playbooks/verification-tiers.md`.
6. Correct failures and repeat.

## Output and boundary

An evidence report linked from `docs/09-testing/testing.md`. Parity
evidence settles objective fidelity only — the human performs final
quality validation after objective failures are cleared or explicitly
accepted (`principles.md` #2's split, applied to visuals).
