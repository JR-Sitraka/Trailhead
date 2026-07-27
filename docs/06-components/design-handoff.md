# Design Handoff — Dashboard: LLM Observability Panel

Produced per `playbooks/design-handoff.md` (PROVISIONAL — first live
run on this project), after human visual approval, before frontend
implementation.

**Timing note:** the panel is Upgrade item 5, so implementation of it
begins after items 1–4. This handoff is written **now**, immediately
after approval, deliberately — freezing the approved artefact's
inventory while it is fresh protects against drift over the
intervening work. The playbook's requirement ("after approval, before
implementation") is satisfied by writing it early, not late.

## Source of truth
- **Tool + exact approved artifact:** Magic Patterns, editor
  `vp4t2zbgxnuknmjjzr6phd`, artifact
  `cfe1be53-07e0-4903-9e93-7e4412b45e06`
  ("Observability panel + mock-only state-demo cycler").
  URL: https://www.magicpatterns.com/c/vp4t2zbgxnuknmjjzr6phd
- **Lineage:** approved MVP-A Dashboard `6af558a6-d68b-4e36-9aee-2c72a5f38102`
  → panel `3f49e44a-4cd2-4a06-8e72-4b9ae338e41e` → approved
  `cfe1be53…`. Earlier artifacts remain in version history.
- **Approved by / date:** Sitraka, 2026-07-27 (all four panel states
  cycled and confirmed visually).
- **Source type:** **code-backed** — the strongest artefact chain
  available (playbook step 6). The implementer reads the real source
  via Magic Patterns MCP; no prose re-description is used or
  permitted (`principles.md` #10).

## Frozen inventory — what the approved artefact actually provides
- **Code:** `components/ObservabilityPanel.tsx` (the deliverable) and
  `components/Dashboard.tsx` (integration point). Read them directly
  from artifact `cfe1be53…`; do not reconstruct from this document.
- **Structure:** panel is a sibling `<section>` rendered between the
  page-heading row and the repository-list section.
- **Tokens:** consumed via the artifact's `tailwind.config.js`
  (surface/border/muted/text/card-radius) plus inline status colors
  matching `StatusPill`'s CONFIG recipe exactly.
- **Assets/fonts:** none new. `ActivityIcon` from lucide-react
  (already a project dependency); Inter + JetBrains Mono already in
  use.
- **States captured:** all four — Populated, True zeros (provider
  `unknown`), Provider erroring, Metrics unavailable — viewable via
  the mock-only cycler.
- **Interaction notes:** the panel has **zero** interactions by
  design.
- **Implicit wrapper context (checked explicitly, per the playbook's
  hard-won step):** the panel renders inside Dashboard's
  `<main className="mx-auto max-w-6xl px-6 py-8">`. That container is
  Dashboard's own, NOT part of the panel — the panel supplies only
  its own `mb-5` bottom margin. Do not port the wrapper as if it
  belonged to the component; do not omit an equivalent container in
  the real Dashboard (it already exists there).

## Canonical comparison conditions (for visual-parity review)
- **Viewports:** 1440×900 (primary), 768 (tablet wrap behavior),
  390 (mobile wrap behavior) — the panel's only responsive behavior
  is flex-wrap, so these three exercise it fully.
- **Data states:** all four panel states above, each compared
  separately. Theme: dark only (project-wide).
- **Frozen values:** use the mock's demo figures (42 / 1 / Groq)
  for the populated comparison so numbers aren't a variable.

## Component mapping
| Visual element | Mapping |
|---|---|
| Panel container | **New component** — `ObservabilityPanel`, per its `component-specs.md` block |
| Label register (uppercase, muted, text-[11px]) | **Existing pattern** — same as Dashboard's list-header / StateCaption register; reuse, don't re-derive |
| Provider status pill | **Existing pattern** — `StatusPill`'s visual recipe (color + 10% fill + 35% border). Reuse the recipe; a shared component extraction is allowed but not required |
| Mono numerals | **Existing token** — `font-mono` (JetBrains Mono) |
| State cycler + `DEMO_STATES` const | **PROTOTYPE SHORTCUT — MUST BE REMOVED.** Mock-only review affordance. It is marked as such in the artifact's own comments and excluded from the component spec. Porting it would introduce an interactive control the brief explicitly forbids |
| Demo data const in Dashboard.tsx | **PROTOTYPE SHORTCUT — replace** with a real fetch of `GET /api/observability` (per `observability.md`) |

## Allowed adaptations / prohibited reinterpretations
**Allowed:** wiring `data` to the real endpoint and its loading/error
outcome (endpoint failure → the existing metrics-unavailable state,
no new state invented); project-conventional file placement and
import paths; TypeScript type location; extracting the pill recipe to
a shared component.

**Prohibited:** changing layout, spacing, typography, or color values;
adding any interactive control (refresh, settings, links, tooltips);
adding charts, history, per-repo breakdown, or any enforcement/
warning affordance; making the panel focusable or placing it in tab
order; rendering fake zeros when metrics are unavailable; showing
`operational` before any request has been observed (the approved
zero-state decision).

## Gaps and unresolved conflicts
- **Loading state is unspecified** — the approved artefact renders
  synchronously from a const; the real panel fetches. Resolution
  (decided here, not left to the implementer): on first load, render
  the **metrics-unavailable** treatment until data arrives — no
  spinner, no skeleton, no new visual state. If that reads badly in
  practice, it returns as a spec question, not an implementer's
  judgment call.
- No other conflicts between the artefact and
  `component-specs.md` / `observability.md`.

## Evidence and next step
- Compliance pass: `briefs/dashboard-observability-panel-review.md`
  (zero fails, zero unverified).
- Human visual approval: recorded above and in `PROJECT-STATE.md`.
- **Next after implementation:** `playbooks/visual-parity-review.md`,
  using the canonical conditions above; then human final validation.
