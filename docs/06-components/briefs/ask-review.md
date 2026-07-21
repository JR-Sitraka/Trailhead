# Compliance Review: Ask

Checked against `design-tokens.md`, `information-architecture.md`, and
`docs/06-components/briefs/ask.md`'s must-include/must-not-include
lists. Four real deviations were found and corrected in this same
round (see below) — this table reflects the corrected state, not the
first draft.

| Check | Result |
|---|---|
| Colors match Slice 1 token additions (citation, danger, primary, secondary, textPrimary, textMuted, borderMuted) | ✅ Pass |
| Prose typography: Inter, 1.6 line-height, 680px max-width | ✅ Pass |
| Citation links use `#4FC7B8`, inline monospace file refs | ✅ Pass |
| Generating state: primary color, plain pulse (no shimmer), 1400ms cycle | ✅ Pass |
| WorkspaceHeader: 5 tabs, Ask active/underlined, matches IA sibling-to-Search position | ✅ Pass |
| StatusPill: Ready variant only (Ask unreachable below Ready per flow) | ✅ Pass |
| EmptyState reuse ("Empty-without-action" variant) for no-evidence/off-topic: dashed border, `bg-surface`, `py-16`, icon, heading, muted subtext, no CTA | ✅ Pass (corrected — was `py-10`, missing `bg-surface`) |
| Card "Danger tone" variant matches Warning-tone pattern exactly (border only, no added background tint) | ✅ Pass (corrected — was `bg-danger/5`, not present in the Warning-tone pattern it extends) |
| No-evidence/off-topic visually distinct from generation-failed (muted vs. danger) | ✅ Pass |
| Brief "must not include": no conversation-history/thread UI, no confidence badges, no citation UI beyond basic links, no filter chips, no cross-file graph elements | ✅ Pass |
| AskInput has `aria-label` | ✅ Pass (corrected — was missing) |
| Focus ring opacity matches existing product convention (`/60`) | ✅ Pass (corrected — was `/50`) |
| Icons (SearchX, AlertTriangle) — no ARIA needed, consistent with EmptyState/StatusPill precedent (status/meaning conveyed by text, not icon alone) | ✅ Pass |
| Keyboard navigation: input and submit button are real, tab-reachable elements | ✅ Pass |
| Full keyboard focus-order / screen-reader walkthrough | ⚠️ Unverified — same structural limitation noted on every other MVP-A screen review; static code review can't confirm this, needs a real test |
| Container max-width (`max-w-6xl` header, matching WorkspaceHeader precedent) | ✅ Pass |

**Zero Fails remaining.** One honest Unverified (keyboard/screen-reader walkthrough) — per `principles.md` #2 and `design-review.md`'s own definition of done, this doesn't block the human pass; it's flagged for you to look at directly.
