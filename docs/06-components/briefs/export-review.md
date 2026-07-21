# Compliance Review: Export

Checked against `design-tokens.md`, `information-architecture.md`, and
`docs/06-components/briefs/export.md`'s must-include/must-not-include
lists. Four real deviations were found and corrected in this same
round — this table reflects the corrected state.

| Check | Result |
|---|---|
| Colors match Slice 1/2a token set (no invented values) | ✅ Pass (corrected — first draft invented an "inset" background color not in `design-tokens.md`) |
| REPOSITORY_CONTEXT.md prose respects 680px max-width | ✅ Pass (corrected — was unconstrained within the wider 800px screen container) |
| JSON block: JetBrains Mono, `bg-surface`, no syntax highlighting | ✅ Pass (corrected — was on an invented separate background) |
| WorkspaceHeader: 6 tabs, Export active/underlined, IA sibling-to-Ask position | ✅ Pass |
| StatusPill: Ready variant only | ✅ Pass |
| Three sections reuse Overview's existing `Section`/Card pattern, not a new layout component | ✅ Pass |
| Task-packet results reuse `ListRow` single-action variant (real clickable buttons, not static divs) | ✅ Pass (corrected — first draft used non-interactive divs) |
| Task-packet visually reads as a list (evidence), not prose — mechanism difference from REPOSITORY_CONTEXT.md visible in the UI | ✅ Pass |
| Download/Copy buttons: muted default, primary color on hover | ✅ Pass (corrected — was hovering to `textPrimary`/white instead of `primary`/blue) |
| Generating-state pulse consistent across all three sections (deliberate choice, not an inconsistency) | ✅ Pass |
| TaskInput has `aria-label`, multi-line, distinct from AskInput | ✅ Pass |
| Brief "must not include": no syntax highlighting, no confidence badges, no caching/history UI, no repo picker, no richer citation UI | ✅ Pass |
| Full keyboard focus-order / screen-reader walkthrough | ⚠️ Unverified — same structural limitation as every other screen; static code review can't confirm this |

**Zero Fails remaining.** One honest Unverified, consistent with every prior screen's review — flagged for a real test, not blocking the human pass.
