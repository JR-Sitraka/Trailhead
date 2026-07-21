# Screen Brief: Chat

**Flow:** `ux-user-flows.md` → "Flow: Chat with repository" (MVP-B
Slice 2b — supersedes "Ask repository")

**Position in IA:** `information-architecture.md` → "Chat" — same tab
position as "Ask" previously occupied, renamed, not moved.

**User + job:** Either target persona, wanting a direct answer to a
question and the ability to naturally follow up, instead of resetting
after every single exchange.

**Must include:**
- WorkspaceHeader, reused — 6 tabs, same count as Export's version,
  but the 5th tab's **label changes from "Ask" to "Chat"**. **Flag to
  `ui-designer`: this is a rename retrofit across all six screens'
  headers (Overview/Explorer/Symbols/Search/Export, plus this screen's
  own), not an addition — every other screen currently still says
  "Ask."**
- An explicit "New conversation" button, reusing the same icon-button
  pattern as Export's Download/Copy actions (muted default, primary on
  hover).
- A conversation thread: vertical stack of turn-pairs. Each pair =
  one user-question item (minimal label "You asked—" + plain text, NOT
  a chat bubble, per the locked design decision) + one assistant-
  answer item, reusing `AnswerBlock`'s existing states exactly
  (Generating / Answered / No-evidence / Off-topic / Generation-failed)
  with zero new states or tokens.
- `AskInput` (reused, unchanged component), now persistently available
  at the bottom of the thread for the next turn, not a one-time entry
  point.
- Demonstrate, for review purposes: a realistic 2-turn exchange (a
  first question, answered; a follow-up that only makes sense given
  the first question's context, answered) to show the thread pattern
  working — plus separate, clearly captioned single-turn examples of
  Generating, No-evidence, and Generation-failed states below the
  realistic thread, same "stacked state captions for review" pattern
  already established on Ask and Export.

**Must not include:**
- No chat-bubble styling — no rounded asymmetric containers, no
  background tint, no right-alignment for the user's question.
- No conversation history list/sidebar — no navigation concept of past
  conversations, since none are persisted.
- No confidence scoring anywhere.
- No visual distinction implying one turn's validity depends on
  another's — each turn's state is independent (per
  `design-language.md`'s extended honesty principle).

**Design principles to apply:** Utilitarian (explicitly non-chat-app
aesthetic despite being a chat feature), evidence-honest (per-turn
independence), consistent generating-state feedback (same pulse as
every other LLM-touching state in the product).

**Tokens in effect:**
```
background: `#0B0E14`      primary: `#4C8DFF`
surface: `#12161F`         secondary: `#7A8699`
citation: `#4FC7B8`        danger: `#E5484D`
text-primary: `#E6E9EF`    text-muted: `#8A94A6`
border: `#232838`
```
Fonts: Inter (chrome + prose + "You asked—" labels), JetBrains Mono
(citations, file refs). Prose: 1.6 line-height, 680px max-width.
Pulse: 1400ms cycle, primary color — identical to Ask/Export, third
reuse.

---
=== EVERYTHING BELOW THIS LINE IS FOR THE EXTERNAL TOOL ===
=== EVERYTHING ABOVE IS INTERNAL — DO NOT PASTE IT IN ===
---

## Compiled prompt for Magic Patterns

Design a dark-mode-only screen called "Chat" for a developer tool
called Trailhead, which lets developers explore an imported code
repository through conversation. This is a NEW screen in an existing
product (it replaces a prior single-question "Ask" screen with a
multi-turn version) — describe it completely, don't assume any other
screen is visible to you.

**Overall theme (exact values, dark mode only):**
- background: #0B0E14, surface: #12161F, primary/accent: #4C8DFF
- secondary/muted text: #7A8699, citation link color: #4FC7B8
- danger: #E5484D, text-primary: #E6E9EF, text-muted: #8A94A6,
  border: #232838
- Fonts: "Inter" for UI chrome and prose; "JetBrains Mono" for file
  paths, line ranges, and citation references.
- Border radius: 4px small controls, 8px cards, fully-round pills.
- Utilitarian, information-dense aesthetic — **explicitly NOT a
  typical consumer chat-app look**: no message bubbles, no rounded
  asymmetric containers, no right-aligned user messages, no colored
  background tints distinguishing speakers. No gradients, no
  decorative illustration, no shimmer/skeleton loading (use a simple
  pulsing dot instead).

**Layout, top to bottom:**

1. **Sticky header** (same structure as every other workspace screen):
   back-arrow + "Dashboard" link, product icon + "Trailhead" wordmark,
   repo name + monospace commit SHA + green "Ready" status pill. Below
   that, six tabs: "Overview", "Explorer", "Symbols", "Search",
   "Chat", "Export" — "Chat" is active (underlined in primary color,
   brighter text), the other five muted.

2. **Main content, centered column, max-width ~680px:**

   A small "New conversation" button (icon + text, muted default
   color, top-right of the content area, small/compact).

   Below it, a realistic two-turn conversation, each turn structured
   as: a small muted uppercase label reading "YOU ASKED" followed by
   the question in plain text (Inter, text-primary color, no
   background box, no bubble, no indent) — then below it, the answer
   in a card (border, rounded corners, surface background) with prose
   text (generous line-height) containing 2-3 inline teal (#4FC7B8)
   citation links each followed by a small monospace file reference in
   the same teal.

   Turn 1: "YOU ASKED / Where is authentication handled?" then an
   answer card explaining auth is handled in an auth module with 2
   citations.

   Turn 2 (a natural follow-up that doesn't repeat the word "auth"):
   "YOU ASKED / What about the tests for that?" then an answer card
   explaining test coverage for the auth module specifically, with 1-2
   citations — demonstrating the answer correctly understood "that"
   refers to authentication from the prior turn.

   Below the two-turn example, add a divider and three more clearly
   labeled single-turn examples, each with a small muted caption above
   it identifying the state, stacked with generous spacing:

   **"State: Generating"** — a small pulsing dot (primary color, soft
   breathing opacity animation) next to muted text "Thinking…"

   **"State: No evidence found"** — a dashed-border card with a small
   icon, heading "No relevant evidence found," muted subtext.

   **"State: Generation failed"** — a card with a reddish-tinted
   border (danger color at low opacity), warning icon in that red,
   heading "Couldn't generate an answer," muted subtext.

   At the very bottom, a persistent question-input box (rounded
   corners, border, taller than a typical text input) with placeholder
   text "Ask a follow-up…" and a small "Ask" submit button with a
   return-key icon at its right edge.

Keep the whole screen desktop-width (assume ~1280px viewport), no
mobile layout needed.
