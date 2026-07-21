# Screen Brief: Explorer

**Flow:** `ux-user-flows.md` — "Explore repository," Explorer path
("User browses file tree, opens a file to view its source with
preserved line metadata"). Error/edge path: "User opens a file that
was skipped during analysis — file tree still shows it, but it's
marked as 'not analyzed' with the specific reason, not silently
missing." Also the jump-target for "Search repository"'s result
selection ("User selects a result to jump to that file/line in
Explorer").

**Position in IA:** `information-architecture.md` — Explorer, sibling
tab to Overview/Symbols/Search within a repository workspace.

**User + job:** Either MVP-A persona, already inside a repository
workspace, wants to browse the actual file structure and read a
specific file's source with line numbers — either by browsing
directly or having arrived here from a Search result.

**Must include:**
- Same repository workspace header as Overview (back-to-dashboard,
  repo name + commit SHA + Ready pill), with Explorer now the active
  tab instead of Overview
- File tree (left pane): folders and files, expandable/collapsible,
  currently-open file visually highlighted
- Source viewer (right pane): the selected file's content with line
  numbers, monospace, a breadcrumb/path header showing which file is
  open
- Explicit "not analyzed" handling: at least one file in the tree
  visually marked as skipped (small distinct indicator, not full
  alarm styling — same restrained treatment as Overview's "Not
  analyzed" section), and selecting it shows an explanatory message
  in the source pane instead of code content — this is a real
  requirement from the flow doc's error/edge path, not optional
  polish

**Must not include:**
- No editing capability — this is read-only, a viewer not an editor
- No chat, confidence/evidence badges, diagrams — same exclusions as
  every other MVP-A screen
- No inline symbol extraction/annotation in the source view — that's
  the Symbols screen's job, not Explorer's

**Design principles to apply:** utilitarian, code-literate typography
(the source viewer is the one place JetBrains Mono should dominate
the screen, not just accent it), honest about limitations (the
not-analyzed state is real design surface)

**Tokens in effect:** identical dark-mode set as Dashboard/Overview —
background `#0B0E14`, surface `#12161F`, border `#232838`, accent
`#4C8DFF`, text `#E6E9EF`/`#8A94A6`, warning `#D4A72C` (for the
not-analyzed indicator only), Inter (UI) + JetBrains Mono (tree paths,
source content, line numbers), 4px controls / 8px cards. Reuse the
established header/tab-bar pattern from Overview exactly — this is
the third screen of the same workspace.

---
=== EVERYTHING BELOW THIS LINE IS FOR THE EXTERNAL TOOL ===
=== EVERYTHING ABOVE IS INTERNAL — DO NOT PASTE IT IN ===
---

## Compiled prompt for Magic Patterns

Build an Explorer screen for the same "Repository Intelligence
Platform" app (React + TypeScript + Tailwind, dark mode only) — the
file-browsing screen inside a repository workspace, reached from the
"Explorer" tab.

**Reuse exactly:** the same header bar as an existing Overview screen
in this project (back-to-dashboard link, product icon+name, repo
name + commit SHA + "Ready" status pill on the right, and a 4-tab
row below — Overview / Explorer / Symbols / Search — with Explorer
now the active/highlighted tab and the others shown as inactive).

**Layout — two-pane, below the header:**
- Left pane (~260px, bordered right edge): a file tree. Include
  folders like `src/app`, `src/lib`, `src/components`, `src/server`
  (some expanded showing nested files, some collapsed), plus
  root-level files like `package.json`, `next.config.js`,
  `tsconfig.json`. Make the tree interactive: clicking a folder
  toggles expand/collapse, clicking a file selects it and updates the
  right pane. One specific file (e.g. `src/generated/prisma-client.ts`)
  should show a small distinct marker (a subtle amber dot or icon,
  not alarming) indicating it wasn't analyzed.
- Right pane: a source code viewer. Show a breadcrumb/path header at
  the top with the currently-open file's full path. Below it, the
  file's content rendered with line numbers on the left (muted,
  monospace) and code content in monospace, syntax-appropriate but
  doesn't need real syntax highlighting colors — plain monospace text
  is fine. Default to showing `src/app/page.tsx` selected with a
  short, realistic React/Next.js component as its content (10-20
  lines is enough).
- When the marked "not analyzed" file is clicked in the tree, the
  right pane should switch to a distinct message state instead of
  code — e.g. "This file wasn't analyzed — it exceeds the 1MB parse
  limit" — styled with the same restrained amber accent as the tree
  marker, not a jarring error state.

**Visual style:** identical dark-mode tokens to the existing
Dashboard/Overview screens — background `#0B0E14`, surface `#12161F`,
border `#232838`, accent `#4C8DFF`, text `#E6E9EF`/`#8A94A6`, warning
accent `#D4A72C` (sparingly, only for the not-analyzed marker/message),
Inter for UI chrome, JetBrains Mono for the file tree paths and all
source-viewer content including line numbers, 4px controls / 8px
cards.

Do not include: any editing controls, chat interface, AI "ask a
question" input, confidence scores, evidence citations, or
relationship/architecture diagrams. No inline symbol highlighting or
annotation in the source view.
