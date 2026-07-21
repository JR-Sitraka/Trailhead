# Screen Review: Explorer

Per `roles/design-review.md`: mechanical compliance only, no taste
calls. Built via code-first edit (Magic Patterns' AI-prompt path
remains credits-limited) —
https://www.magicpatterns.com/c/5yhcw3merhxhwehzkg69eg

| Check | Result |
|---|---|
| Tokens match `design-tokens.md` exactly | ✅ Pass — verified from source, identical to Dashboard/Overview |
| Font: Inter (UI), JetBrains Mono (tree paths, source content, line numbers) | ✅ Pass |
| Must include: reused header/workspace tabs, Explorer active | ✅ Pass |
| Must include: file tree, expandable/collapsible, selected file highlighted | ✅ Pass — real interactive state (`expanded` Set, click-to-toggle), not a static image |
| Must include: source viewer with line numbers, path breadcrumb | ✅ Pass |
| Must include: not-analyzed file marked in tree + explanatory message on open | ✅ Pass — `src/generated/prisma-client.ts` carries the marker; selecting it swaps the source pane to the message state instead of rendering code |
| Must not include: editing controls | ✅ Pass — read-only table rendering, no inputs/textareas |
| Must not include: chat, confidence/evidence, diagrams, inline symbol annotation | ✅ Pass — none present |
| Baseline accessibility: `aria-label` on file tree nav, `title`/`aria-label` on the not-analyzed marker | ✅ Pass — present |
| Baseline accessibility: keyboard navigation through tree/file list | ⚠️ Unverified — buttons are real `<button>` elements (tab-reachable by default), but full keyboard-only browsing wasn't tested end-to-end, same structural limit as every prior screen |

**Net: fully clean on first pass.** No Fails, one honest Unverified
(same category as every screen so far — needs a real keyboard
click-through, not something a code read can settle).

**Verification tier: Agent-verified** (`playbooks/verification-tiers.md`)
— compiled clean, source re-read to confirm both interactive behaviors
(expand/collapse, not-analyzed state swap) are actually implemented,
not just present in prose. Not yet **Person-verified**.
