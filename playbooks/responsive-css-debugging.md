# Playbook: Diagnosing responsive CSS that doesn't respond

When a media query looks syntactically correct but never seems to
apply, check for an inline `style` attribute setting the same CSS
property first — before assuming the media query logic itself is
wrong.

**Why:** inline styles always win over any stylesheet rule, regardless
of specificity or whether it's inside a `@media` block. A property set
both inline and inside a media query will silently never respond — no
error, no warning.

**How to confirm:** check whether the same property (`flexDirection`,
`gap`, `gridTemplateColumns`, etc.) appears in both the component's
inline `style={{}}` object and the CSS class it also uses.

**Fix precisely, not broadly:** move the base value into the CSS
class's unconditional rule, remove only the specific conflicting
property from the inline style object, and leave every other inline
property unchanged. Don't strip the whole inline style object as a
blanket fix — a property that isn't actually conflicting may be inline
for a real reason, and removing it isn't the task.

**Note from real testing (2026-07):** even with this exact instruction
present and read, a real run still applied an overly broad fix on the
first attempt before self-correcting mid-reasoning. Treat this as a
place worth double-checking the actual diff, not just confirming the
diagnosis was correct.
