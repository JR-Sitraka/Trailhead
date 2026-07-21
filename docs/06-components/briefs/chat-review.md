# Compliance Review: Chat

Checked against `design-tokens.md`, `information-architecture.md`, and
`docs/06-components/briefs/chat.md`'s must-include/must-not-include
lists.

| Check | Result |
|---|---|
| Colors match established token set, no invented values | ✅ Pass |
| Prose respects 680px max-width (AnswerCard) | ✅ Pass |
| Citation styling: teal (#4FC7B8), inline monospace file refs | ✅ Pass |
| WorkspaceHeader: 6 tabs, "Chat" (not "Ask") active/underlined | ✅ Pass |
| User-question treatment: no bubble, minimal muted label + plain text, left-aligned same column | ✅ Pass |
| "New conversation" button reuses Export's established icon-button pattern (muted → primary on hover) | ✅ Pass |
| Generating/No-evidence/Generation-failed states reused unchanged from Ask, zero new tokens | ✅ Pass |
| Turn independence: no visual coupling between one turn's state and another's | ✅ Pass |
| Follow-up turn demonstrates context blending correctly (doesn't repeat "auth" but answer stays on-topic) | ✅ Pass |
| Input has `aria-label`, focus ring uses established `/60` opacity | ✅ Pass |
| Brief "must not include": no chat-bubble styling, no history sidebar, no confidence scoring | ✅ Pass |
| No `ref`-prop collision or other real code defects | ✅ Pass (caught and fixed pre-publish, not a post-hoc find) |
| Full keyboard focus-order / screen-reader walkthrough | ⚠️ Unverified — same structural limitation as every other screen |

**Zero Fails.** One honest Unverified, consistent with every prior review — flagged, not blocking.
