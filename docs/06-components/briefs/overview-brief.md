# Screen Brief: Repository Overview

**Flow:** `ux-user-flows.md` — "Explore repository," step 1 ("User
lands on repository Overview (templated facts table)")

**Position in IA:** `information-architecture.md` — first stop inside
a repository workspace; sibling tabs are Explorer, Symbols, Search

**User + job:** Either MVP-A persona, having just opened a "Ready"
repository from the Dashboard, wants a fast, honest read of what this
codebase is before going deeper — stack, entry points, structure,
and (just as important) what wasn't analyzed.

**Must include:**
- Repository identity header: name, status (should always read
  "Ready" here — other statuses don't reach this screen), last-
  analyzed commit SHA, a way back to the Dashboard
- Workspace sub-navigation: Overview (active) / Explorer / Symbols /
  Search — persistent across all repo-workspace screens, not just
  this one
- Templated facts table (explicit facts, not LLM prose — per PRD MVP
  Scope and `design-language.md`'s "honest about limitations"
  principle):
  - Detected stack (language(s), framework, package manager, build
    tool, test framework)
  - Entry points (file paths)
  - Module/package list
  - Config files found
  - Testing approach (what test framework/pattern was detected)
  - Explicit "Not analyzed" section — skipped/oversized/unparseable
    files, truncation if the repo hit the 5,000-file or per-file 1MB
    limits (per PRD's confirmed size limits)

**Must not include:**
- No chat or "ask a question" affordance — MVP-A has no chat
- No confidence/evidence badges — MVP-B territory
- No architecture graph or diagram — V1 territory
- No dedicated "Routes" section — per `information-architecture.md`'s
  explicit scope note, route declarations surface inside this facts
  table, not as their own nav area or section header
- No editable fields — this is a read-only report of what analysis
  found, not a form

**Design principles to apply:** utilitarian, information-dense but
scannable, code-literate typography (monospace for paths/stack
values), honest about limitations (the "Not analyzed" section is
real design surface, not an afterthought)

**Tokens in effect:** same dark-mode token set as the Dashboard
screen — background `#0B0E14`, surface `#12161F`, border `#232838`,
primary `#4C8DFF`, text `#E6E9EF`/`#8A94A6`, Inter (UI) + JetBrains
Mono (paths/stack values/commit SHA), 4px controls / 8px cards,
4/8/12/16/24/32/48 spacing. Reuse the Dashboard's established header
bar, column-header table style, and status-pill treatment for visual
consistency — this is the second screen of the same workspace, not a
fresh product.

---
=== EVERYTHING BELOW THIS LINE IS FOR THE EXTERNAL TOOL ===
=== EVERYTHING ABOVE IS INTERNAL — DO NOT PASTE IT IN ===
---

## Compiled prompt for Magic Patterns

Build a Repository Overview screen for the same "Repository
Intelligence Platform" dashboard app (React + TypeScript + Tailwind,
dark mode only). This is the screen a user lands on after clicking
"Open" on a repository from the Dashboard.

**Reuse exactly, don't redesign:** the top toolbar bar style (product
icon + name, left-aligned), the dark token palette, Inter for UI text
and JetBrains Mono for code-like values, 4px/8px radius scale, and the
overall utilitarian density of the Dashboard screen already built in
this project.

**Layout:**
- Top toolbar: same as Dashboard, but add a "← Back to repositories"
  link/button on the left before the product name, and show the
  current repository's name + short commit SHA + a "Ready" status
  pill on the right side of the toolbar (replacing the Dashboard's
  search bar, which doesn't apply here)
- Below the toolbar: a row of 4 tabs — "Overview" (active/highlighted),
  "Explorer", "Symbols", "Search" (the latter three are non-functional
  placeholders for now, just render them as inactive tabs)
- Main content: a single-column stack of clearly-labeled sections,
  each a bordered card matching the Dashboard's card style:
  1. "Stack" — language(s), framework, package manager, build tool,
     test framework, each as a labeled row (label in muted text,
     value in monospace)
  2. "Entry points" — a short list of file paths (monospace)
  3. "Modules & packages" — a short list of package/module names with
     their paths
  4. "Configuration files" — list of detected config file paths
     (monospace)
  5. "Testing" — one line describing the detected test approach
  6. "Not analyzed" — visually distinct (subtle warning-adjacent
     styling, not alarming — muted amber accent at most), listing
     specific skipped files/reasons (e.g. "3 files exceeded the 1MB
     parse limit", "2 files use an unsupported syntax extension")

Populate every section with realistic mock data for a Next.js +
TypeScript project (e.g. entry points like `src/app/layout.tsx`,
`src/app/page.tsx`; config files like `next.config.js`,
`tsconfig.json`, `.env.example`; a couple of plausible "not analyzed"
entries).

**Visual style:** identical dark-mode tokens to the existing Dashboard
screen — background `#0B0E14`, surface `#12161F`, border `#232838`,
accent `#4C8DFF`, text `#E6E9EF`/`#8A94A6`, warning accent `#D4A72C`
(use sparingly, only in the "Not analyzed" section), Inter/JetBrains
Mono, 4px controls/8px cards.

Do not include: any chat interface, any AI "ask a question" input, any
confidence scores or evidence citations, any relationship/architecture
diagrams, any editable form fields, a "Routes" section as its own
card.
