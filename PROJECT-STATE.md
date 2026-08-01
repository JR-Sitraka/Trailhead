# Current Project State

**Read this file in full before doing anything else, per
`orchestrator.md`'s mid-project session handoff procedure.**

## Product
**Trailhead** — Repository Intelligence Platform. MVP-A/B shipped and
released. **THE TRAILHEAD UPGRADE PHASE IS COMPLETE**, pending this
round's final merge.

## Phase
**Upgrade phase COMPLETE — merge in flight. Next real work: the
kit-required phase-close retrospective.**

**Hash convention:** as of 2026-08-02, `main` HEAD `b0dab84`
(pre-merge). Branch `upgrade/item7-closeout` holds the final
commits: `1f5b19f`, `6b86504`, `fb88852`, `241241f`, `86f2300`,
`878abd0`, `aceb608`, `996a8ff`, `b55d811`.

## Upgrade phase — final status, all 7 items
| Item | Outcome |
|---|---|
| 1. Doc-drift fix | DONE — Gemini→Groq corrected everywhere real |
| 2. Golden benchmark suite | COMPLETE — real corpus, real ground truth, committed baseline |
| 3. Embedding model swap | **CLOSED: HELD** — q8 evaluated rigorously, 3/4 criteria decisively met, held on a real documentation-retrieval regression; preserved as leading candidate, not rejected |
| 4. Framework misdetection | CLOSED — premise didn't reproduce (re-scoped via ADR-010 to verify+guard); "Unknown" display shipped |
| 5. LLM observability | CLOSED, merged — real implementation, real visual parity, human-confirmed |
| 6. Screen-reader accessibility | CLOSED, merged — 7 real defects found via live NVDA audit, all fixed and live-reconfirmed |
| 7. Testing closeout | CLOSED — this round. One scoped deferral (IMPORT-04), documented honestly, not rounded up |

## Real, durable artifacts this phase produced
- **10 ADRs** added or amended (005 amended twice, 006-011 new/amended)
- A real, committed golden benchmark (31→40 queries across two
  manifest versions, real ground truth, locked comparison parameters)
- **5 confirmed instances** of "documentation described architecture
  never built" — a structural finding for the framework-review track
- A complete NVDA accessibility audit-to-fix cycle, live-verified
  end to end by a first-time screen-reader user
- Real bugs found and fixed in production code that predated this
  phase entirely (boxen's NUL-byte import poisoning, got's orphaned
  state, the 500MB budget bypass)
- One deliberate, honestly-documented deferral (IMPORT-04) rather
  than a false "complete"

## Coding-agent policy — final state
Placement: always Claude Code, throughout, no exceptions except one
explicit person-authorized one-time deviation (later reversed).
Implementation: complexity-split, Kilo Code for scoped/simple work,
Claude Code for investigation/research/hard-gated work. Both agents
performed well under this split; real evidence collected across the
whole phase for the eventual retrospective.

## Provisional-items trail (V4.2) — FULL, ready for §8 verdicts
- `session-recovery.md` — triggered once for real (item 3's
  background-process interruption); diagnosis-before-resume worked as
  designed, turned an interruption into reinforcing evidence.
- `design-handoff.md` + `visual-parity-review.md` — used once, item
  5's panel; clean result; the timing/early-freeze finding logged.
- `roles/security-reviewer.md` + `security-review.md` — never
  triggered (auth explicitly deferred to V2/V3 throughout).
- `visualization-prompting.md`'s credit-exhaustion section — used by
  choice, not forced exhaustion; nuanced, not a clean confirmation.
- `orchestrator.md`'s "Decision habits" section — used dozens of
  times across every major fork this phase; zero regretted defaults.
- ADR-005's mixed coding-agent policy — adopted, refined, reaffirmed
  after one real deviation and its real (self-corrected) consequences.

## Open items, real and deliberately deferred (not part of this phase)
- Documentation-retrieval mitigation study (item 3's held decision)
- Cloud-embedding scoping (raised, explicitly held separate)
- IMPORT-04 branch selection (item 7's scoped deferral)
- FK indexes (add-and-measure, low priority)
- V1 blueprint items (structural graphs, impact analysis) — non-binding

## Current blocker
None — merge is this round's task.

## Last completed action
Item 7 fully closed; entire Upgrade phase complete — 2026-08-02.

## Next valid moves
1. Claude Code places testing.md's final content and merges
   `upgrade/item7-closeout` into `main` — this is the phase's closing
   merge.
2. **Compile `RETROSPECTIVE.md`** per `RETROSPECTIVE.template.md` —
   this project has an unusually rich record to draw from: the
   complete item-3 falsification arc, the complete item-6 audit-to-
   fix cycle, five structural documentation-drift findings, multiple
   real orchestrator/agent mutual error-catches, and a fully evolved
   mixed-agent policy. This is the next real piece of work, not a
   formality.
3. After the retrospective: a separate framework-review conversation
   updates the shared kit (principles.md, orchestrator.md, roles/,
   playbooks/) based on what this project actually found — per the
   kit's own two-project promotion rule.

## Files changed last round
- (pending this round's placement)
