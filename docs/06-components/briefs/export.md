# Screen Brief: Export

**Flow:** `ux-user-flows.md` → "Flow: Export agent context" (MVP-B Slice 2a)

**Position in IA:** `information-architecture.md` → "Export" — 6th
tab, sibling to Ask, within Repository Workspace.

**User + job:** The AI coding agent (Slice 2a's first-class user) or a
human acting on its behalf, wanting one or more of: a readable
evidence-grounded summary, a stable structured fact contract, or a
task-scoped evidence packet — to hand to a coding agent as context.

**Must include:**
- WorkspaceHeader, reused — 6 tabs now (Overview/Explorer/Symbols/
  Search/Ask/Export), Export active/underlined on this screen. **Flag
  to `ui-designer` operating this brief: same cross-screen-update
  situation as Ask's 5th-tab addition — the other five screens will
  need this 6th tab added when next touched.**
- StatusPill, "Ready" variant only (Export unreachable below Ready,
  same full gate as Ask).
- Three independent Sections (Overview's existing Card+header-label
  pattern, reused exactly, not redesigned):
  1. **REPOSITORY_CONTEXT.md** — states: Idle (Generate button only) →
     Generating (primary pulse, "Generating…") → Generated (prose +
     inline citations, Inter/1.6/680px, citation color `#4FC7B8`,
     Download + Copy actions) → Failed (Danger-tone Card, same as
     Ask's Generation-failed state).
  2. **JSON** — states: Idle (Generate button only) → Generating
     (same pulse) → Generated (plain `JetBrains Mono` block on
     `bg-surface`, no syntax highlighting, Download + Copy actions).
     No failure state — deterministic, no external call.
  3. **Task-packet** — states: Idle (multi-line `TaskInput` textarea +
     Generate button, disabled while empty) → Generating (same pulse)
     → Generated (`ListRow` single-action list: file path + line range
     in `JetBrains Mono`, short snippet excerpt per row, Download +
     Copy actions for the whole packet). No failure state — heuristic,
     no external call.
- Each section is fully independent — generating one doesn't affect,
  require, or reset the others.

**Must not include:**
- No syntax highlighting on the JSON block.
- No confidence scoring or badges anywhere on this screen.
- No caching/history UI — nothing suggests a past export is being
  shown; every view is implicitly "current state, generate fresh."
- No cross-repository controls — task-packet is scoped to this one
  repository only, no repo picker on this screen.
- REPOSITORY_CONTEXT.md's citations: same basic file/line link
  treatment as Ask, nothing richer.

**Design principles to apply:** Utilitarian, code-literate (monospace
at document scale for JSON, not just inline), evidence-honest
(citations for the LLM summary, plain ranked list — not prose — for
the non-LLM task-packet, so the mechanism difference is visible),
consistent generating-state feedback across all three sections
regardless of mechanism (a stated, deliberate choice, not an
inconsistency).

**Tokens in effect:**
```
background: `#0B0E14`      primary: `#4C8DFF`
surface: `#12161F`         secondary: `#7A8699`
citation: `#4FC7B8`        danger: `#E5484D`
text-primary: `#E6E9EF`    text-muted: `#8A94A6`
border: `#232838`
```
Fonts: Inter (UI chrome + REPOSITORY_CONTEXT.md prose), JetBrains Mono
(JSON block, task-packet file/line refs, citations). Prose: 1.6
line-height, 680px max-width. Pulse: 1400ms cycle, primary color,
reused identically across all three sections.

---
=== EVERYTHING BELOW THIS LINE IS FOR THE EXTERNAL TOOL ===
=== EVERYTHING ABOVE IS INTERNAL — DO NOT PASTE IT IN ===
---

## Compiled prompt for Magic Patterns

Design a dark-mode-only screen called "Export" for a developer tool
called Trailhead, which lets developers explore an imported code
repository and export context for AI coding agents. This is a NEW
screen in an existing product — describe it completely, don't assume
any other screen is visible to you.

**Overall theme (exact values, dark mode only):**
- background: #0B0E14, surface (card/panel background): #12161F
- primary/accent: #4C8DFF, secondary/muted text: #7A8699
- citation link color: #4FC7B8, danger: #E5484D
- text-primary: #E6E9EF, text-muted: #8A94A6, border: #232838
- Fonts: "Inter" for UI chrome and prose; "JetBrains Mono" for any
  file path, line range, JSON content, or citation reference.
- Border radius: 4px small controls, 8px cards, fully-round pills.
- Utilitarian, information-dense aesthetic — no gradients, no
  decorative illustration, no marketing copy, no shimmer/skeleton
  loading effects (use a simple pulsing dot instead).

**Layout, top to bottom:**

1. **Sticky header, two rows** (identical structure to every other
   workspace screen): Row 1 — back-arrow + "Dashboard" link, product
   icon + "Trailhead" wordmark, repo name + monospace commit SHA +
   green "Ready" status pill. Row 2 — six tabs: "Overview", "Explorer",
   "Symbols", "Search", "Ask", "Export" — "Export" is active
   (underlined in primary color, brighter text), the other five muted.

2. **Main content, centered column, max-width ~800px, three stacked
   sections with generous spacing between them:**

   **Section 1 — "REPOSITORY_CONTEXT.md":** A card with a small
   uppercase muted header label reading "REPOSITORY_CONTEXT.MD". Show
   it in its "Generated" state: below the header, a short block of
   prose (3-4 sentences, Inter, generous line-height) describing the
   repository, with 2-3 bracketed phrases rendered as inline clickable
   links in teal (#4FC7B8), each followed by a small monospace file
   reference in the same teal (e.g. "(src/auth/middleware.ts:42)").
   Below the prose, two small icon-buttons: "Download" and "Copy".

   **Section 2 — "JSON":** A card with header label "JSON". Show it in
   its "Generated" state: a monospace (JetBrains Mono) block on a
   slightly darker inset background, showing a few lines of plausible
   JSON like:
   ```
   {
     "repository": "acme/checkout-service",
     "commitSha": "a3f9c21",
     "primaryLanguage": "TypeScript",
     "framework": "Next.js",
     "entryPoints": ["src/app/layout.tsx", "src/app/page.tsx"]
   }
   ```
   No syntax highlighting, plain monospace text. Below it, "Download"
   and "Copy" icon-buttons, same style as Section 1's.

   **Section 3 — "Task-packet":** A card with header label
   "TASK-PACKET". At the top, a multi-line text input (taller than a
   normal input, placeholder text like "Describe the task you're about
   to work on, e.g. 'add rate limiting to the payments API'") with a
   "Generate" button below it. Below that, show the "Generated" state:
   a short vertical list of 3 result rows, each showing a monospace
   file path + line range on the right (e.g. "src/lib/rateLimiter.ts:1–24")
   and a short one-line code-like snippet preview on the left, in a
   card with dividers between rows (same list style as a search-results
   list). Below the list, "Download" and "Copy" icon-buttons.

   Add a small muted caption above Section 3's Generate button area
   reading "State: Generated" and similar small muted captions above
   Sections 1 and 2 reading "State: Generated" as well, so all three
   sections are clearly labeled for review purposes.

Keep the whole screen desktop-width (assume ~1280px viewport), no
mobile layout needed.
