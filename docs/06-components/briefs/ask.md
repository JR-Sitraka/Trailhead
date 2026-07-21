# Screen Brief: Ask

**Flow:** `ux-user-flows.md` → "Flow: Ask repository" (MVP-B Slice 1)

**Position in IA:** `information-architecture.md` → "Ask" — sibling to
Search within Repository Workspace navigation.

**User + job:** Either of the two target personas, wanting a direct
answer to a direct question ("where is X handled," "what does this
module do") instead of assembling the answer themselves via
Search/Explorer/Symbols. Success = a correct, checkable answer without
the user needing to find anything themselves.

**Must include:**
- WorkspaceHeader, reused from Overview/Explorer/Symbols/Search — but
  the tab row now has 5 tabs (Overview/Explorer/Symbols/Search/Ask),
  Ask shown active/underlined on this screen. **Flag to `ui-designer`
  operating this brief: this is a shared-component change, not a
  screen-local one — the other four screens' headers will need the
  same 5th tab added when next touched, even though this brief only
  covers Ask.**
- StatusPill in the header, "Ready" variant only (Ask is unreachable
  below Ready, per `ux-user-flows.md`).
- AskInput (new): a single question-entry text input with a submit
  action. Placeholder copy should make clear this is natural-language
  Q&A, not a search-term field (distinct from Search's input).
- AnswerBlock (new), in three states:
  - **Generating:** primary-color pulse animation, 1400ms cycle, no
    shimmer/skeleton effect.
  - **Answered:** prose text (Inter, 1.6 line-height, 680px max-width)
    with inline citation links — citation color `#4FC7B8`, each
    citation is a basic file/line link, clickable through to Explorer.
    Any file path or code fragment referenced within the answer text
    switches to JetBrains Mono inline, consistent with every other
    screen's code-literate typography.
- EmptyState, "Empty-without-action" variant (already defined,
  reused exactly — dashed border, icon, heading, muted subtext, no
  CTA), for two distinct triggers: "no relevant evidence found" and
  "off-topic question." Both read the same visually; the heading/
  subtext copy differs per trigger to state the specific reason.
- Card, new "Danger tone" variant (border-danger/30, extending the
  existing Warning-tone pattern), for "generation call failed"
  (quota/timeout/provider error) — visually distinct from the two
  EmptyState triggers above, since this is a real failure, not the
  system correctly having nothing to say.

**Must not include:**
- No conversation history or multi-turn thread UI — each question is
  independent, no chat-thread visual pattern (Slice 2 scope).
- No confidence badges or scoring of any kind.
- No citation UI beyond a basic file/line link — no hover previews, no
  inline diff viewer, no separate footnote/sources panel. Citations
  are inline links only.
- No ranking/relevance controls, no filter chips (FilterChipGroup is
  not used on this screen).
- No cross-file relationship visualization or graph/diagram elements.

**Design principles to apply:** Utilitarian (no glossy loading
effects), code-literate (monospace for paths/fragments even inline in
prose), evidence-honest (citations, not confidence scores), status-
clear, and a hard visual split between "informational/muted" (no
evidence, off-topic) and "actual failure" (danger, generation-failed).

**Tokens in effect:**
```
background: `#0B0E14`      primary: `#4C8DFF`
surface: `#12161F`         secondary: `#7A8699`
citation: `#4FC7B8`        danger: `#E5484D`
text-primary: `#E6E9EF`    text-muted: `#8A94A6`
border: `#232838`
```
Fonts: Inter (UI chrome + answer prose), JetBrains Mono (paths/
symbols/citations' file references). Prose: 1.6 line-height, 680px
max-width. Pulse: 1400ms cycle, primary color. Radius/spacing/shadow
scale: same as every other screen (`design-tokens.md`, unchanged).

---
=== EVERYTHING BELOW THIS LINE IS FOR THE EXTERNAL TOOL ===
=== EVERYTHING ABOVE IS INTERNAL — DO NOT PASTE IT IN ===
---

## Compiled prompt for Magic Patterns

Design a dark-mode-only screen called "Ask" for a developer tool called
Trailhead, which lets developers explore an imported code repository.
This is a NEW screen in an existing product — describe it completely,
don't assume any other screen is visible to you.

**Overall theme (exact values, dark mode only):**
- background: #0B0E14, surface (card/panel background): #12161F
- primary/accent: #4C8DFF, secondary/muted text: #7A8699
- citation link color: #4FC7B8 (a muted teal, distinct from primary)
- danger: #E5484D, text-primary: #E6E9EF, text-muted: #8A94A6
- border: #232838
- Fonts: "Inter" for all UI chrome and for the generated answer's
  prose text; "JetBrains Mono" for any file path, symbol name, commit
  SHA, or line range, anywhere they appear (including inline within
  the answer prose).
- Border radius: 4px for small controls (buttons, inputs, badges),
  8px for cards, fully-round (9999px) for pill-shaped badges.
- The overall aesthetic is utilitarian and information-dense, like a
  code-hosting or log-explorer tool — NOT a glossy consumer SaaS
  product. No decorative illustration, no gradients, no marketing
  copy, no shimmer/skeleton loading effects.

**Layout, top to bottom:**

1. **Sticky header, two rows.**
   - Row 1: a small back-arrow + "Dashboard" link on the far left; a
     product icon + "Trailhead" wordmark next to it; on the far right,
     the repository name (e.g. "acme/checkout-service") in Inter,
     a short monospace commit SHA (e.g. "a3f9c21") in JetBrains Mono,
     and a status pill reading "Ready" — pill-shaped badge, small dot
     + label, colored with a green tint (#3FB950 text/dot, translucent
     green background, translucent green border).
   - Row 2: five tab links, left-aligned: "Overview", "Explorer",
     "Symbols", "Search", "Ask" — "Ask" is the active tab, shown with
     an underline in the primary accent color (#4C8DFF) and brighter
     text; the other four tabs are muted/inactive text.

2. **Main content area, centered column, max-width around 680px:**
   - A single-line text input styled as a question box (not a typical
     search bar — slightly taller, rounded 4px corners, placeholder
     text like "Ask a question about this repository, e.g. 'where is
     authentication handled?'"), with a small submit button/icon
     (e.g. an arrow or "Ask" label) at its right edge.
   - Below the input, show THREE separate example states, stacked
     with generous spacing between them so all three are visible at
     once for review purposes, each with a small muted caption above
     it identifying which state it is:

     **State A — "Generating" (caption above: "State: Generating"):**
     Below the input, a simple pulsing indicator — a small dot or bar
     in primary color (#4C8DFF) with a soft breathing/pulse opacity
     animation — next to muted text reading "Thinking..." No skeleton
     or shimmer bars, just a simple pulse.

     **State B — "Answered" (caption above: "State: Answered"):**
     A block of prose text, Inter font, generously line-spaced
     (line-height around 1.6), roughly 3-4 sentences, answering a
     sample question like "Where is authentication handled?" with an
     answer such as: "Authentication is handled in the auth module,
     which validates incoming tokens against [the session store] and
     rejects requests missing a valid [Authorization header]." — where
     the bracketed phrases are rendered as inline clickable links in
     the citation teal color (#4FC7B8), each followed by a small
     monospace file reference in JetBrains Mono, e.g.
     "(src/auth/middleware.ts:42)" also in the teal citation color.

     **State C — "No evidence found / off-topic" (caption above:
     "State: No evidence found"):** A centered empty-state block: a
     small icon in a subtly bordered circular container, a heading
     like "No relevant evidence found," and muted subtext like "This
     repository doesn't appear to contain anything related to that
     question — try rephrasing, or browse Explorer/Search instead."
     The whole block has a dashed border container around it. No
     button.

     **State D — "Generation failed" (caption above: "State:
     Generation failed"):** A bordered card with a distinctly reddish
     border tint (danger color #E5484D at low opacity, e.g.
     border-red-500/30) and a small warning/error icon in that same
     red, heading "Couldn't generate an answer," muted subtext
     explaining a generic cause like "The answer service is
     temporarily unavailable — try again in a moment." This should
     look visually distinct from State C — State C is calm/muted,
     State D has a visible red tint signaling something actually
     went wrong.

Keep the whole screen desktop-width (assume ~1280px viewport), no
mobile layout needed.
