# Information Architecture — Repository Intelligence Platform (MVP-A + MVP-B Slice 1 + Slice 2a + Slice 2b)

Grouped by how the two human personas think about the product, plus
how the agent persona consumes it (via Export). This is the final IA
for MVP-B.

## Navigation Hierarchy
```
Dashboard
└── Repository Workspace (per repository, once "Ready")
    ├── Overview
    ├── Explorer
    ├── Symbols
    ├── Search
    ├── Chat (renamed from "Ask", MVP-B Slice 2b)
    └── Export
```

## Per-area notes

### Dashboard, Overview, Explorer, Symbols, Search
*(unchanged — see prior rounds)*

### Chat (MVP-B Slice 2b — renamed from "Ask")
- **Purpose:** The "explain this to me, and let me follow up" layer —
  unchanged job-to-be-done from Ask (direct question → grounded
  answer), now extended to sustained conversation instead of resetting
  after one exchange. Still distinct from Search: Search's success is
  "found the right file," Chat's success is "got a correct answer
  without needing to find anything" — now sustained across a
  back-and-forth, not just once.
- **Contains:** A conversation thread (any number of turns), each
  turn's answer citation-backed via inline file/line links into
  Explorer, an input for the next question, and an explicit "New
  conversation" reset action. No conversation is saved — reload or
  navigation resets the thread the same way the button does.
- **Accessed via:** Repository workspace navigation — **flag: the tab
  label changes from "Ask" to "Chat" across all six other screens'
  WorkspaceHeader instances (Overview/Explorer/Symbols/Search/Export,
  plus this screen's own header), not just this one.** Same
  cross-screen-update situation as the 5th-tab and 6th-tab additions
  earlier — a real retrofit task for `ui-designer`, not done by this
  document alone.

### Export
*(unchanged from Slice 2a — see prior round. Its own tab reference to
"Ask" in `component-specs.md`'s brief history should be understood as
now meaning "Chat" — not a re-litigation of Export's own design, just
a naming update flowing through.)*

## Explicitly not included (scope note)

*(Prior rounds' notes unchanged.)* Chat still has no persisted history
— no navigation concept of "past conversations" exists, since none are
saved, per the PRD's explicit Slice 2b exclusion.
