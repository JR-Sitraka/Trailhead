# Design Tokens — Repository Intelligence Platform (MVP-A + MVP-B Slice 1 + Slice 2a + Slice 2b)

**Draft status:** provisional throughout.

## Colors / Typography / Spacing / Radius / Shadows / Animation / Breakpoints
*(All unchanged from Slice 2a — Chat introduces zero new color, font,
or spacing tokens. Every visual need is covered by reuse, detailed
below.)*

## Chat-specific composition notes (Slice 2b — layout reuse, not new tokens)

```
Thread layout:        vertical stack of turn-pairs, same spacing
                       scale as every other stacked-section layout
                       in the product (Export's three-section spacing is
                       the direct precedent). Each turn-pair = one
                       user-question item + one assistant-answer item
                       (in whichever of AnswerBlock's existing states
                       applies: Generating / Answered / No-evidence /
                       Off-topic / Generation-failed).
User-question item:   NOT a chat bubble. Small muted label ("You
                       asked—", same typographic treatment as
                       StateCaption: text-xs, uppercase tracking,
                       textMuted color) followed by the question text
                       in textPrimary, Inter, no special background,
                       no alignment shift from the assistant items
                       below it — same left-aligned column as
                       everything else on this screen.
Assistant-answer item: Reuses AnswerBlock's existing states exactly
                       (Generating pulse, Answered prose+citations,
                       No-evidence/Off-topic EmptyState reuse,
                       Generation-failed Danger Card) — no new states,
                       no new tokens. Only difference from Ask: these
                       now render as one item within a growing thread,
                       not as the screen's sole content.
"New conversation"
action:                Small button, same control sizing/radius (4px)
                       and hover-to-primary convention as Export's
                       Download/Copy actions — consistent icon-button
                       pattern reused a third time, not a new style
                       invented for this specific button.
Turn independence:     A Generation-failed or No-evidence state on
                       one turn does not restyle or gray out earlier,
                       already-answered turns above it in the thread —
                       each turn's visual state is fully independent,
                       per design-language.md's extended honesty
                       principle above.
```

## Explicitly skipped
*(Unchanged — confidence indicators, graph-node categories, light
mode, chat-bubble UI (new, Slice 2b) all correctly out of scope.)*
