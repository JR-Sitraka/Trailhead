# Design Language — Repository Intelligence Platform (MVP-A + MVP-B Slice 1 + Slice 2a + Slice 2b)

**Draft status:** provisional throughout — react once Chat's screen is
generated.

## Design Principles

*(All prior principles unchanged. Slice 2b extends two directly:)*

- **Utilitarian, not marketing-glossy, extended (Slice 2b):** Chat's
  user-question display is deliberately **not** a chat-bubble pattern
  — no rounded asymmetric bubbles, no background tinting, no
  right-alignment. A small muted label ("You asked—") followed by
  plain text, same typographic register as every other muted label in
  the product (`StateCaption`'s existing pattern). Explicitly rejecting
  the conventional chat-app visual vocabulary here, even though "chat"
  is the feature name — consistent with this design language's
  standing rejection of consumer SaaS aesthetics, and with this
  product's "evidence tool that supports follow-ups" identity rather
  than a "conversational companion" identity.
- **Evidence is honest, not scored, extended (Slice 2b):** every turn
  in a conversation carries its own independent groundedness state —
  a validation failure on one turn never retroactively affects how
  earlier, already-validated turns are displayed. The thread is a
  sequence of independently honest turns, not one composite
  "conversation-level" confidence state (which doesn't exist and
  shouldn't be implied to).

## Reference points
*(Unchanged.)*

## What this design language explicitly rejects
*(Unchanged, plus:)* No chat-bubble UI convention (Slice 2b) — the
user's own question renders as plain, minimally-labeled text, not a
bubble, consistent with every other rejection of consumer-chat/
consumer-SaaS visual patterns already on this list.
