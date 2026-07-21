# Screen Review: Repository Overview

Per `roles/design-review.md`: mechanical compliance only, no taste
calls. Single candidate this time — Magic Patterns is the committed
tool as of the Dashboard round, so no comparative trial was run.

Built via code-first edit (Magic Patterns' AI-prompt path is still
credits-limited) — https://www.magicpatterns.com/c/qaxfyszvlwpqawbgcrakag

| Check | Result |
|---|---|
| Background/surface/border/accent/text tokens match `design-tokens.md` exactly | ✅ Pass — verified from source, identical values to Dashboard's `tailwind.config.js` |
| Font: Inter (UI), JetBrains Mono (code/paths/values) | ✅ Pass |
| Radius: 4px controls / 8px cards | ✅ Pass |
| Must include: repository identity header (name, status, commit SHA, back-to-dashboard) | ✅ Pass |
| Must include: workspace sub-nav (Overview active, Explorer/Symbols/Search present but disabled) | ✅ Pass |
| Must include: Stack section (language, framework, package manager, build tool, test framework) | ✅ Pass |
| Must include: Entry points, Modules & packages, Configuration files sections | ✅ Pass |
| Must include: Testing section | ✅ Pass |
| Must include: explicit "Not analyzed" section, visually distinct | ✅ Pass — muted amber accent (`#D4A72C`) on border/icon/label only, not overused, matches the brief's "at most" instruction |
| Must not include: chat, confidence/evidence badges, diagrams, dedicated Routes card, editable fields | ✅ Pass — none present |
| Visual consistency with Dashboard (header bar style, card style, spacing) | ✅ Pass — same header structure, same card/border treatment, same spacing scale |
| Baseline accessibility: tab disabled-state semantics | ⚠️ Unverified — Explorer/Symbols/Search tabs use `disabled` with a muted style, but full keyboard/screen-reader behavior wasn't tested (same structural limit noted on every prior screen — a static compile can't confirm this) |

**Net: fully clean on first pass.** No Fails, one honest Unverified
(interactive accessibility, which no code-read can settle — needs a
real click/keyboard-through same as every prior screen).

**Verification tier: Agent-verified** (`playbooks/verification-tiers.md`)
— compiled clean, source re-read to confirm every brief requirement is
actually present. Not yet **Person-verified** — worth your own look,
same standard applied to every screen so far.
