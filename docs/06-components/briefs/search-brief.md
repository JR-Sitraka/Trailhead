# Screen Brief: Search

**Flow:** `ux-user-flows.md` — "Search repository." Steps: enter a
query (symbol name, route, env var, exact string), optionally filter
by path or file type, system returns exact/FTS results with file path
+ line range, select a result to jump to Explorer. Error/edge paths:
"Query returns zero results — explicit 'no matches' state, with a
reminder that this is exact/full-text search only (no fuzzy/semantic
matching in MVP-A)" and "Query targets a file that was skipped during
analysis — that file is excluded from results, and search does not
silently claim completeness it doesn't have."

**Position in IA:** `information-architecture.md` — Search, sibling
tab to Overview/Explorer/Symbols; "exact and full-text lookup only
(no semantic search in MVP-A, stated plainly in-product)."

**User + job:** Either MVP-A persona wants to find something by name
or exact string across the whole repository — a known symbol, route,
env var, or literal text — not browse structurally (that's
Explorer/Symbols' job).

**Must include:**
- Same repository workspace header as prior screens, Search now
  active
- A prominent, full-width search input (this screen's primary
  purpose) with placeholder text hinting at expected query types
- Filtering by path and/or file type (per PRD's search feature —
  "Search filtering by path and file type")
- Results as a ranked list: file path + line range per result (same
  visual language as Symbols' rows), reading as jump targets to
  Explorer
- A genuinely reachable zero-results state when a query matches
  nothing, including the explicit "exact/full-text only, no
  fuzzy/semantic matching" reminder from the flow doc — **this must
  actually be triggerable by typing a non-matching query, not just
  present as unreachable code** (Symbols' screen had this exact gap;
  don't repeat it here)
- A brief, honest note that skipped/not-analyzed files aren't included
  in results — consistent with `design-language.md`'s "honest about
  limitations" principle, doesn't need to be prominent, just present

**Must not include:**
- No semantic/fuzzy search toggle or suggestion — MVP-A is exact/FTS
  only, and the UI shouldn't imply otherwise
- No chat, confidence/evidence badges, diagrams — same exclusions as
  every other MVP-A screen
- No full source preview inline — a short matching-line snippet is
  fine (helps orient which result is relevant), full file content is
  Explorer's job

**Design principles to apply:** utilitarian, code-literate typography,
honest about limitations (both the zero-results reminder and the
skipped-files note are real design surface, not afterthoughts)

**Tokens in effect:** identical dark-mode set as prior four screens.
Reuse the established header/tab-bar pattern and Symbols' row style
for results — this is the fifth and final MVP-A workspace screen.

---
=== EVERYTHING BELOW THIS LINE IS FOR THE EXTERNAL TOOL ===
=== EVERYTHING ABOVE IS INTERNAL — DO NOT PASTE IT IN ===
---

## Compiled prompt for Magic Patterns

Build a Search screen for the same "Repository Intelligence Platform"
app (React + TypeScript + Tailwind, dark mode only) — full-text/exact
search across repository contents, reached from the "Search" tab.

**Reuse exactly:** the same header bar as the existing screens in
this project (back-to-dashboard link, product icon+name, repo name +
commit SHA + "Ready" status pill, and the 4-tab row — Overview /
Explorer / Symbols / Search — with Search now active).

**Layout:**
- Below the header: a large, full-width search input with a search
  icon, placeholder like "Search by symbol name, route, env var, or
  exact string…". Make it functional — typing filters a small mock
  dataset in real time (client-side substring match is fine).
- Below the input: two simple filter controls in a row — a file-type
  dropdown (options: "All types", ".ts", ".tsx", ".json") and a
  path-prefix text input (placeholder "Filter by path, e.g. src/lib")
  — both should actually narrow the results when used, combined with
  the search query.
- Results area: when the query is empty, show a quiet prompt state
  ("Start typing to search this repository"). When the query matches
  nothing, show a genuine zero-results state with this exact
  reminder text: "No matches. Search is exact and full-text only in
  this version — it won't find conceptually related results with
  different wording." When there are matches, show a list (same
  bordered-card, divided-row style as the Symbols screen) where each
  row shows: the file path + line range (monospace), and a short
  one-line snippet of the matching content with the matched query
  substring visually emphasized (bold or accent-colored) within the
  snippet.
- Below the results area (or as a small persistent note near the
  input), include a small muted line: "Files skipped during analysis
  aren't included in search results."

Populate the mock dataset with ~8 entries mixing symbol names, a
route declaration, an environment variable reference, and a plain
string — reusing the same fictional payments-service repo as other
screens in this project, e.g.:
- `getPayments` — src/lib/db.ts:12
- `POST /api/webhooks` (route) — src/app/api/webhooks/route.ts:9
- `STRIPE_SECRET_KEY` (env var reference) — src/lib/auth.ts:4
- `PaymentsRepository` — src/lib/db.ts:40
- `createPaymentIntent` — src/server/actions.ts:8
- `AuthSession` — src/lib/auth.ts:3
- a plain string match, e.g. "Failed to verify session" — src/lib/auth.ts:22
- `verifySession` — src/lib/auth.ts:15

**Visual style:** identical dark-mode tokens to the existing screens
in this project — background `#0B0E14`, surface `#12161F`, border
`#232838`, accent `#4C8DFF`, text `#E6E9EF`/`#8A94A6`, Inter for UI
chrome, JetBrains Mono for paths, line numbers, and snippet content,
4px controls / 8px cards.

Do not include: any fuzzy/semantic search toggle or suggestion, chat
interface, confidence scores, evidence citations, relationship/
architecture diagrams, or full source preview within a result row.
