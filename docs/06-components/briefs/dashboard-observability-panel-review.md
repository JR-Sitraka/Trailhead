# Design Review — Dashboard: LLM Observability Panel (Upgrade retrofit)

**Screen:** Dashboard (approved artifact, retrofit)
**Artifact:** Magic Patterns editor `vp4t2zbgxnuknmjjzr6phd`, artifact
`3f49e44a-4cd2-4a06-8e72-4b9ae338e41e` ("Upgrade: LLM observability
panel (code-first retrofit)") — branched from approved
`6af558a6-d68b-4e36-9aee-2c72a5f38102`, published 2026-07-27.
**Reviewed against:** `dashboard-observability-panel.md` (brief),
`design-tokens.md`, `design-language.md`,
`information-architecture.md` (Upgrade additions), `principles.md` #5.
**Review basis:** direct source read of the edited files (code-reviewed
tier) — noted per check where a static/source review cannot confirm.

| Check | Result |
|---|---|
| Colors from existing token set only (surface/border via Tailwind tokens; status vocabulary #3FB950/#E5484D/#8A94A6 identical to StatusPill's CONFIG values) | ✅ Pass |
| No new tokens invented (radius `rounded-card`, spacing from existing scale, label register matches the list-header/StateCaption convention: text-[11px] uppercase tracking-wide muted) | ✅ Pass |
| Numeric values in JetBrains Mono (`font-mono`), code-literate typography convention | ✅ Pass |
| IA compliance: panel lives inside Dashboard; zero navigation/tab changes anywhere | ✅ Pass |
| Brief must-include: single Card-convention panel, secondary to the repository list (compact strip between heading row and list) | ✅ Pass |
| Brief must-include: three glanceable values (requests, failures, provider status) | ✅ Pass |
| Brief must-include: provider status uses existing status-color vocabulary with pill treatment | ✅ Pass |
| Brief must-include: honest states — metrics-unavailable rendered distinctly from true zeros | ⚠️ Unverified — the code path exists (`data === null` → em-dash + "metrics unavailable", structurally distinct from zero values) but the published mock renders only the populated demo state; the unavailable and zero states have not been visually exercised. Same class as the Symbols empty-state finding (MVP-A retro #6): code-present ≠ demonstrated. |
| Must-not: no enforcement/budgeting UI (no bars, limits, warnings, thresholds) | ✅ Pass |
| Must-not: no per-repository breakdown, no charts/sparklines/history | ✅ Pass |
| Must-not: no interactive controls added (panel is a passive `<section>`, zero buttons/links) | ✅ Pass |
| Must-not: no changes to existing Dashboard elements — diff limited to one import, one demo-data const, one panel insertion; header/rows/modals/empty states byte-identical | ✅ Pass |
| Accessibility baseline: landmark labeled (`aria-label="LLM observability"`); no interactive elements so focus order unaffected; muted-on-surface contrast identical to existing accepted usage | ✅ Pass (contrast/focus at code-review tier — real rendered check happens at implementation's parity review) |
| Demo provider name reflects shipped reality ("Groq", not Gemini) — consistent with Upgrade item 1 | ✅ Pass |

**Result: zero fails, one honest Unverified** → per `principles.md` #2
and this role's definition of done, the screen **moves to the human
quality pass with the Unverified item flagged** — it is not blocked.

**Flag for the human pass:** if you want the unavailable/zero states
visually demonstrated before approval (the stricter standard finding
#7 applied last phase — building states to be *reachable*), say so and
I'll add a state-cycling demo affordance to the mock; otherwise the
states are verified for real at implementation's visual-parity review.
