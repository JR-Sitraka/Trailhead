# Screen Brief: Symbols

**Addendum, 2026-07-19:** This screen was extended after the original
brief below to add Import and Export as filterable kinds, closing a
real gap (imports/exports were extracted per the PRD but had no
display surface anywhere in MVP-A). The original brief is preserved
unmodified below for an accurate history; the built screen now
includes Import/Export beyond what's described here. See
`docs/08-features/symbols.md` for the current, authoritative
functional spec.

**Flow:** `ux-user-flows.md` — "Explore repository," Symbols path
("User browses/filters extracted symbols, selects one to view its
definition location (file + line range)"). Error/edge path: "User
navigates to Symbols for a repository with zero extracted symbols —
empty state explains why, not a blank screen."

**Position in IA:** `information-architecture.md` — Symbols, sibling
tab to Overview/Explorer/Search; "browsable index of what structural
analysis extracted, distinct from free-text search."

**User + job:** Either MVP-A persona wants to see what functions,
classes, and interfaces exist in this repository without reading
files directly — a structural index, not a text search.

**Must include:**
- Same repository workspace header as Explorer, Symbols now the
  active tab
- Filter by kind: Function / Class / Interface / All — reuse the
  Dashboard's filter-chip pattern for visual consistency
- A list of extracted symbols, each row showing: kind (icon or short
  label, visually distinct per kind), symbol name (monospace — this
  is code, not prose), file path + line range (monospace, muted)
- Each row should read as a link to that symbol's definition location
  in Explorer (doesn't need real navigation in this mock — Explorer
  is a separate screen — but should look and behave like a clickable
  jump target, consistent with the flow's stated behavior)

**Must not include:**
- No free-text search input on this screen — that's the dedicated
  Search screen's job (per IA: Symbols is "distinct from free-text
  search"); don't blur the two
- No chat, confidence/evidence badges, diagrams — same exclusions as
  every other MVP-A screen
- No inline source preview — a row shows where a symbol is, it
  doesn't show the symbol's code inline (that's what clicking through
  to Explorer is for)

**Known, honestly-flagged gap:** the flow doc's "zero extracted
symbols" empty state is a real requirement, but this mock uses fixed
populated data with no way to reach zero symbols interactively (there
was no natural trigger for it the way Explorer's not-analyzed file
click provided one). **This gap should be flagged in the review, not
silently built around or faked as demonstrated.**

**Design principles to apply:** utilitarian, code-literate typography
(symbol names and locations are the content, treat them as such),
consistent filter-chip pattern reused from Dashboard rather than
inventing a new filter UI

**Tokens in effect:** identical dark-mode set as prior three screens.
Reuse the established header/tab-bar pattern exactly — this is the
fourth screen of the same workspace.

---
=== EVERYTHING BELOW THIS LINE IS FOR THE EXTERNAL TOOL ===
=== EVERYTHING ABOVE IS INTERNAL — DO NOT PASTE IT IN ===
---

## Compiled prompt for Magic Patterns

Build a Symbols screen for the same "Repository Intelligence
Platform" app (React + TypeScript + Tailwind, dark mode only) — a
browsable index of extracted functions/classes/interfaces inside a
repository workspace, reached from the "Symbols" tab.

**Reuse exactly:** the same header bar as the existing
Overview/Explorer screens in this project (back-to-dashboard link,
product icon+name, repo name + commit SHA + "Ready" status pill, and
the 4-tab row — Overview / Explorer / Symbols / Search — with Symbols
now active).

**Layout:**
- Below the header: a row of filter chips — "All", "Functions",
  "Classes", "Interfaces" — styled identically to the Dashboard
  screen's status filter chips in this project (same active/inactive
  treatment). Make them functional: clicking filters the visible
  list.
- Below that: a list (bordered card container, divided rows — same
  style as the Dashboard's repository list) of ~10 mock symbols. Each
  row shows:
  - A small kind indicator on the left (e.g. "fn" / "class" /
    "iface" as a short monospace label in a subtle badge, each kind a
    slightly different muted color — don't invent a whole new color
    system, keep these desaturated/muted, not competing with the
    status-color palette used elsewhere)
  - The symbol name in monospace, medium weight
  - The file path + line range on the right side of the row, in
    monospace muted text (e.g. `src/lib/db.ts:12-24`)
  - The whole row should have a hover state suggesting it's clickable
    (it doesn't need to actually navigate anywhere in this mock)

Populate with realistic mock data for the same fictional payments
service used in other screens in this project — e.g.:
- Function `getPayments` — src/lib/db.ts:12-24
- Interface `PaymentRecord` — src/lib/db.ts:5-11
- Class `PaymentsRepository` — src/lib/db.ts:40-88
- Function `createPaymentIntent` — src/server/actions.ts:8-30
- Function `verifySession` — src/lib/auth.ts:15-27
- Interface `AuthSession` — src/lib/auth.ts:3-9
- Function `Button` — src/components/Button.tsx:6-18
- Function `Header` — src/components/Header.tsx:5-22
- Function `POST` — src/app/api/webhooks/route.ts:9-35
- Class `WebhookValidator` — src/app/api/webhooks/route.ts:1-8

**Visual style:** identical dark-mode tokens to the existing screens
in this project — background `#0B0E14`, surface `#12161F`, border
`#232838`, accent `#4C8DFF`, text `#E6E9EF`/`#8A94A6`, Inter for UI
chrome, JetBrains Mono for symbol names and file paths, 4px controls
/ 8px cards.

Do not include: any free-text search input (a separate Search screen
exists for that), any chat interface, confidence scores, evidence
citations, relationship/architecture diagrams, or inline source-code
preview within a row.
