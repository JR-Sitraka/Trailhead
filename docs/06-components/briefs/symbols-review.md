# Screen Review: Symbols

Per `roles/design-review.md`: mechanical compliance only, no taste
calls. Built via code-first edit (Magic Patterns' AI-prompt path
remains credits-limited) —
https://www.magicpatterns.com/c/cqqbwmty3fbapbqxdflsvi

| Check | Result |
|---|---|
| Tokens match `design-tokens.md` exactly | ✅ Pass |
| Font: Inter (UI), JetBrains Mono (symbol names, paths) | ✅ Pass |
| Must include: reused header/workspace tabs, Symbols active | ✅ Pass |
| Must include: kind filter (Function/Class/Interface/All), reusing Dashboard's chip pattern | ✅ Pass — functional, verified from source (`filter` state actually narrows `filtered`) |
| Must include: symbol list with kind badge, name, path + line range | ✅ Pass |
| Must include: rows read as clickable jump targets | ✅ Pass — real `<button>` per row with hover state; does not actually navigate to Explorer (correctly out of scope per the brief — "doesn't need real navigation in this mock") |
| Must not include: free-text search input | ✅ Pass — none present, Search stays a separate screen's job |
| Must not include: chat, confidence/evidence, diagrams, inline source preview | ✅ Pass — none present |
| **Flow error/edge path: zero-symbols empty state** | ⚠️ **Honest gap, flagged in the brief itself, not discovered after the fact.** The code path exists (`filtered.length > 0 ? ... : <empty state>`) and renders correctly-styled empty-state copy, but with this screen's fixed mock data, no filter combination actually reaches zero results (Functions/Classes/Interfaces all have ≥2 matches) — so the empty state is present in code but **not interactively reachable or visually confirmed** in this mock. This is different from Explorer's not-analyzed state, which was genuinely clickable and confirmed. Unverified, not failed — the difference matters. |
| Baseline accessibility: focus-visible rings on filter chips and rows | ✅ Pass |

**Net: no Fails. One real, upfront-flagged gap** (the zero-symbols
empty state isn't demonstrably reachable in this mock) rather than a
compliance violation — worth deciding whether that's acceptable to
carry forward as-is, or whether it's worth a follow-up prompt to make
it reachable (e.g. an explicit "zero symbols" mock variant) before
calling this screen done.

**Verification tier: Agent-verified** (`playbooks/verification-tiers.md`)
— compiled clean, source re-read to confirm the filter logic is real,
not decorative. Not yet **Person-verified**.

## Update — 2026-07-19: renamed to Trailhead, width standardized, Import/Export added

Three changes applied in one edit, republished at the same URL:

- **Product renamed** to "Trailhead" in the header (was "Repository
  Intelligence Platform," the working name).
- **Container width standardized** to `max-w-6xl` (was `max-w-5xl`),
  per `component-specs.md`'s WorkspaceHeader resolution.
- **Import and Export added as filterable kinds**, closing the real
  gap flagged in `docs/08-features/symbols.md` (imports/exports were
  extracted per the PRD but had no display surface anywhere in
  MVP-A). 4 new mock entries added (2 imports, 2 exports), new muted
  color treatment for each kind consistent with the existing
  desaturated palette (not competing with status colors).

**Re-verified:** compiled clean; filter chips for the two new kinds
are real and functional (confirmed from source, same pattern as the
existing kinds). The zero-symbols empty-state gap noted above is
**unchanged** — adding two more populated kinds didn't create a
reachable zero-result state with this mock's fixed data; still an
honest Unverified, not newly resolved.

**Verification tier: Agent-verified.** Not yet **Person-verified** —
worth a fresh click-through given three real changes landed at once.
