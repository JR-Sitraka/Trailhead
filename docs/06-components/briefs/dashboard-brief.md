# Screen Brief: Dashboard

**Flow:** `ux-user-flows.md` — "Import repository" (entry point), "Reanalyze
repository (manual)" and "Delete repository" (actions on this screen)

**Position in IA:** `information-architecture.md` — top-level, root
screen; leads into Repository Workspace

**User + job:** Either MVP-A persona (unfamiliar-repo dev or own-old-repo
dev), landing here to see what repositories they've already imported,
add a new one, or manage an existing one (reanalyze/delete/open).

**Must include:**
- List of imported repositories, each showing: name, analysis status
  (Queued / Analyzing / Ready / Failed — use the status color tokens),
  last-analyzed commit SHA (short form)
- Per-repository actions: Open, Reanalyze, Delete
- "Add repository" entry point supporting both GitHub URL and ZIP
  upload (can be a single action that opens a choice, doesn't need to
  be two separate buttons)
- Empty state for zero repositories imported yet — plain, not
  decorative (per design-language.md's rejection of stock-art empty
  states)

**Must not include:**
- No chat entry point, no "ask a question" affordance — MVP-A has no
  chat
- No confidence/evidence badges — those don't exist yet
- No architecture graph, relationship visualization, or any diagram —
  V1 territory
- No login/account UI — MVP-A has no auth
- No team/organization switcher — single local operator only

**Design principles to apply:** utilitarian (not marketing-glossy),
information-dense but scannable, code-literate typography (monospace
for commit SHAs), status as first-class visual concern

**Tokens in effect:** dark-mode only per `design-tokens.md` — background
`#0B0E14`, surface `#12161F`, primary `#4C8DFF`, status colors as
defined (queued/analyzing/ready/failed), Inter for UI text, JetBrains
Mono for commit SHAs, 4/8/12/16/24/32/48 spacing scale, 4px controls /
8px cards / pill-radius status badges

---
=== EVERYTHING BELOW THIS LINE IS FOR THE EXTERNAL TOOL ===
=== EVERYTHING ABOVE IS INTERNAL — DO NOT PASTE IT IN ===
---

## Compiled prompt for Magic Patterns / V0 / arena.ai

Build a Dashboard screen for a developer tool called "Repository
Intelligence Platform" (working name — not final). Stack: React +
TypeScript + Tailwind (this brief targets any React-based generator).

This is the landing/home screen. It lists repositories the user has
already imported for structural analysis, and lets them add a new one.

**Layout:**
- Header/toolbar at top with the product name (left) and a prominent
  "Add repository" button (right)
- Main area: a list (not cards-with-large-imagery — this is a dense,
  utilitarian developer tool, not a consumer SaaS product) of imported
  repositories. Each row shows:
  - Repository name
  - A status pill: "Queued" (gray), "Analyzing" (blue, with a subtle
    pulsing/spinner indicator), "Ready" (green), "Failed" (red)
  - Last-analyzed commit SHA in monospace, truncated to 7 characters
  - Three actions per row: "Open" (primary), "Reanalyze", "Delete"
    (the last one visually de-emphasized/muted, not a bright red button
    — it's a real but infrequent action)
- If there are zero repositories: a plain, text-first empty state
  ("No repositories yet — import one to get started" + the same "Add
  repository" button). No illustration, no marketing copy.
- "Add repository" opens a simple choice between "GitHub URL" (a text
  input for a public repo URL, plus a branch selector if the repo has
  multiple branches) and "ZIP upload" (drag-and-drop or file picker,
  with the 150 MB limit stated in the UI itself)

**Visual style — dark mode only, utilitarian developer tool:**
- Background: #0B0E14, surface/card background: #12161F, border:
  #232838
- Primary accent (buttons, links, active states): #4C8DFF
- Text: #E6E9EF primary, #8A94A6 muted
- Status colors: queued #8A94A6, analyzing #4C8DFF, ready #3FB950,
  failed #E5484D
- UI text font: Inter. Commit SHAs and any code-like text: JetBrains
  Mono, visually distinct from UI chrome
- Small controls (buttons, inputs): 4px border-radius. Cards/containers:
  8px border-radius. Status badges: full pill radius
- No gradients, no decorative illustration, no large hero imagery —
  dense, scannable, functional. Think a code-hosting or log-explorer
  tool's dashboard, not a marketing SaaS landing page.

Do not include: any chat interface, any AI "ask a question" input, any
confidence scores or evidence citations, any relationship/architecture
diagrams, any login or account switcher UI.
