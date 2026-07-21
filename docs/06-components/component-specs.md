# Component Specifications — Repository Intelligence Platform (MVP-A + MVP-B Slice 1 + Slice 2a + Slice 2b)

Compiled from the seven approved screens (Dashboard, Overview,
Explorer, Symbols, Search, Chat, Export) — Chat supersedes the prior
"Ask" screen/tab, renamed but not architecturally replaced.

**Honest caveat, upfront:** unchanged from prior rounds — seven
independent Magic Patterns source files, not literally shared
components yet. **Chat, Export were both built code-first**, same
flat-`App.tsx` structure noted previously.

---

## Component: StatusPill / FilterChipGroup
*(unchanged.)*

## Component: WorkspaceHeader

**Approved reference:** all seven screens now use this identically.

**Visual Description:** *(unchanged structure — two rows, six tabs.)*
**Tab labels, updated 2026-07-20:** Overview / Explorer / Symbols /
Search / **Chat** (renamed from "Ask") / Export. Tab count unchanged
(still six) — this was a rename retrofit, not an addition, applied to
all six screens including Search's related "no matches" copy (which
also referenced "Ask" by name and was updated to "Chat" in the same
pass, since it's the same underlying rename, not a separate content
change).

**Known Constraints / Limitations:** **Resolved 2026-07-20:** rename
retrofit complete across all six screens. No screen references "Ask"
as a tab name anywhere in the current mocks.

## Component: Card (Section Container)
*(unchanged — Chat's `AnswerCard` reuses this exactly, see AnswerBlock
note below.)*

## Component: ListRow / Modal / EmptyState
*(unchanged.)*

## Component: AskInput
*(Renamed in usage to `ChatInput` on the Chat screen — same component,
same tokens, `aria-label` updated to "Ask a follow-up question" and
placeholder to "Ask a follow-up…" reflecting its new persistent,
end-of-thread position rather than a one-time entry point. Not a
structural change — same input shape, same focus-ring convention.)*

## Component: AnswerBlock
**Reused directly and unchanged, Slice 2b:** all four of Ask's
original states (Generating, Answered, No-evidence/Off-topic,
Generation-failed) render identically within Chat's thread — the only
difference is composition context (one item in a growing list) rather
than the screen's sole content. Zero new states, zero new tokens.

## Component: UserQuestion (new, MVP-B Slice 2b)

**Approved reference:** Chat —
https://www.magicpatterns.com/c/8xv4homjprpvqrnhkwnkdf

**Purpose:** Display the user's own question within the conversation
thread — **deliberately not a chat bubble**, per the locked design
decision.

**Visual Description:** A small muted uppercase label ("You asked")
followed by the question in plain `textPrimary` text — no background,
no border, no alignment shift, same left-aligned column as every other
element on the screen.

**States:** None — static display only, not interactive.

**Design Tokens Used:** `textMuted` (label), `textPrimary` (question
text) — no new tokens, reuses the exact same label typography as
`StateCaption`.

**Known Constraints / Limitations:** None — deliberately the simplest
possible treatment.

## Component: New Conversation action (new, MVP-B Slice 2b)

**Approved reference:** Chat, same URL as above.

**Purpose:** Explicit reset action for the conversation thread — the
only way to reset without navigating away, per the PRD's locked
decision.

**Visual Description:** Identical pattern to Export's Download/Copy
buttons — small icon-button, muted default, primary color on hover.
Third reuse of this exact pattern (Export → Chat), not a new style.

**Design Tokens Used:** `textMuted`, `primary` (hover), `borderMuted`,
`control` radius — all reused, zero new tokens.

**Known Constraints / Limitations:** No real reset wiring yet — static
mock.

---

(This is the complete component set for all of MVP-A + MVP-B. No
components remain scoped to a future slice — Slice 2b was the last
piece of MVP-B's original scope.)
