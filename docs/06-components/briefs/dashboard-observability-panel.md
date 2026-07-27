# Screen Brief: Dashboard — LLM Observability Panel (Upgrade retrofit)

**Retrofit brief:** this modifies the already-approved Dashboard
screen — it does not redesign it. Everything currently on the approved
Dashboard artifact stays exactly as approved; this brief adds one
panel and nothing else.

**Flow:** `ux-user-flows.md` — "View LLM observability (Upgrade
item 5)"

**Position in IA:** `information-architecture.md` — Upgrade additions:
Dashboard's per-area note. Global panel, zero navigation changes.

**User + job:** Either persona, glancing at the LLM layer's health and
usage while on the Dashboard. Passive read only — nothing to manage.

**Must include:**
- A single panel using the existing Card/section-container convention
  (surface `#12161F`, border `#232838`, 8px radius), placed so the
  repository list remains the screen's primary content — the panel is
  secondary, compact, above or beside the list, not dominating it.
- Three glanceable values: **requests made**, **failures**, **provider
  status**. Numeric values in JetBrains Mono (code-literate typography
  convention); labels in the StateCaption register (text-xs, uppercase
  tracking, muted `#8A94A6`).
- Provider status rendered with the existing status-color vocabulary:
  operational → ready-green `#3FB950`; degraded/erroring →
  failed-red `#E5484D`; unknown → muted `#8A94A6`. Pill treatment
  consistent with StatusPill.
- **Honest states, each visually distinct:** (a) true zeros shown as
  real zeros — a valid state, not an error; (b) metrics-unavailable
  shown as an explicit unavailable treatment (muted em-dash + caption),
  never fake zeros or stale values presented as current.

**Must not include:**
- No enforcement or budgeting UI of any kind — no quota bars, limit
  warnings, thresholds, or "upgrade" prompts (PRD item 5's explicit
  exclusion).
- No per-repository breakdown — the metrics are global.
- No charts, sparklines, or history visualization — three current
  values only.
- No interactive controls beyond what already exists on Dashboard —
  no refresh button, no settings, no links out (panel updates on
  load; anything more is invented scope).
- No changes to any existing Dashboard element — header, list rows,
  modals, empty states all stay as approved.

**Design principles to apply:** utilitarian, information-dense but
scannable, status as first-class visual concern, honest states.

**Tokens in effect:** unchanged Dashboard set — bg `#0B0E14`, surface
`#12161F`, border `#232838`, primary `#4C8DFF`, text `#E6E9EF` /
muted `#8A94A6`, status colors as above, Inter + JetBrains Mono,
4/8/12/16/24/32/48 spacing, 4px controls / 8px cards / pill badges.

---
=== EVERYTHING BELOW THIS LINE IS FOR THE EXTERNAL TOOL ===
=== EVERYTHING ABOVE IS INTERNAL — DO NOT PASTE IT IN ===
---

## Working mode note (code-first, no compiled generation prompt)

Per the fork-(a) decision and the established credit-exhaustion
working mode: this retrofit is applied by directly editing the
approved Dashboard artifact's source (`read_artifact_files` →
`write_artifact_files`), not by prompting AI regeneration. The
"must include / must not include" lists above are the compliance
checklist the edited code is reviewed against.
