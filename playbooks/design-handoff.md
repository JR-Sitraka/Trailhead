# Playbook: Direct design handoff

> **Status: PROVISIONAL** — promoted from a single project's
> retrospective (Trailhead, 2026-07). Confirm, revise, or remove at
> the next project's retrospective (see its provisional-verdicts
> section). Provisional means loaded and used normally — the marker
> governs its future, not its present.

Load after human visual approval of a screen and before frontend
implementation begins. Applies to greenfield and existing projects.

**Why this playbook exists:** porting an approved mock to a second
model through a text relay loses fidelity structurally, not
occasionally. Trailhead found repeated, real losses — an implicit
wrapper context the design tool provides but never exports, an entire
missing header section, a doubled header on another screen — all
tracing to the same cause: when the implementing agent has no direct
access to the design tool, every port is a regeneration from pasted
prose, not a copy. The fix is to hand over artefacts, never
re-descriptions (`principles.md` #10).

## Procedure

1. Record the originating tool, exact approved link/version, approval
   date and approver, and the source type: code-backed, structured
   design data, or screenshot-only.
2. Freeze and inventory everything the approved artefact actually
   provides: code, structure, assets, fonts, tokens, screenshots per
   viewport and state, interaction notes — including any implicit
   wrapper or page context the tool renders but does not export
   (found the hard way; check for it explicitly).
3. Define canonical viewports and deterministic content states for
   later parity comparison.
4. Map each visual element to an existing project component, a new
   component, or a prototype shortcut that must be replaced.
5. State allowed adaptations and prohibited reinterpretations.
6. Prefer the strongest artefact chain available: code + structure +
   screenshots > structured design data + assets > multi-viewport
   screenshots > a single screenshot. Never substitute prose where a
   stronger artefact exists. Where an exact-transcription mode is
   available in the porting tool, use it for the structural portion.
7. Confirm the compliance-pass and human-approval evidence, then hand
   the package to `frontend-engineer` — whose next step after
   implementation is `playbooks/visual-parity-review.md`.

## Output

`docs/06-components/design-handoff.md` (template provided).
