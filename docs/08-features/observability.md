# Feature: LLM Observability (Upgrade item 5)

**Purpose:** Give the operator glanceable, honest visibility into the
LLM layer's usage and health — with explicitly no enforcement.

**User Story:** As a Trailhead operator, I want to see how many LLM
requests have been made, how many failed, and whether the provider is
healthy, so that I understand my usage of the shared free-tier quota
without leaving the product.

**Functional Requirements:**
- Persist a counter record for every LLM generation request the
  system makes (Chat turns and Export's REPOSITORY_CONTEXT.md — every
  call through the existing shared generation abstraction, no path
  exempted), recording at minimum: timestamp, outcome
  (success/failure).
- Provide a read endpoint returning: requests made **today** (UTC
  day), failures today, provider status, provider name.
- Provider status is **derived from observed evidence only**: last
  request succeeded → `operational`; last request failed →
  `erroring`; no request yet observed today → `unknown`. No
  synthetic health-check call is ever made (it would spend real quota
  to ask "am I spending quota?").
- Dashboard renders the ObservabilityPanel (per its component spec)
  from this endpoint, fetched on page load only.

**Non-Functional Requirements:**
- Counting must never break generation: a failed counter write is
  logged and swallowed — the user's Chat/Export request proceeds.
- Counter write adds no perceptible latency to generation calls.

**Inputs:** Generation-call outcomes (internal, from the shared
abstraction). No user input.

**Outputs:** `GET` metrics payload: `{ requests, failures,
providerStatus: 'operational'|'erroring'|'unknown', providerName }`.

**Business Rules:**
- "Today" = UTC calendar day, matching how free-tier quotas reset;
  the exact reset semantics get confirmed against Groq's documented
  behavior during item 1's doc sweep and recorded in architecture.md.
- providerName comes from configuration (currently Groq), never
  hardcoded in the UI.
- **No enforcement:** metrics never block, warn-modal, or gate any
  action anywhere in the product.

**Validation Rules:** No user-facing inputs. The endpoint takes no
parameters; unknown query params are ignored.

**Error States:**
- Metrics endpoint fails or returns malformed data → panel renders
  its metrics-unavailable state (per component spec); Dashboard's
  repository list is unaffected.
- Counter store unavailable at write time → generation proceeds;
  failure logged server-side; subsequent reads reflect only what was
  recorded (undercounting is possible and accepted — stated honestly
  here rather than hidden).

**Edge Cases:**
- Zero requests today → true zeros + provider `unknown` (approved
  decision 2026-07-27).
- Day boundary crossing while Dashboard is open → values are
  as-of-load; no live rollover (on-load-only refresh is the spec).
- Mixed outcomes: status reflects the **latest** request only —
  42 requests with 1 old failure and a recent success shows
  `operational`.

**Accessibility:** Per component spec: labeled non-interactive
landmark, never in tab order. Included in item 6's screen-reader
pass.

**Analytics:** None beyond the counters themselves.

**Dependencies:** The existing shared generation abstraction (single
choke point — this is why no path can bypass counting); Postgres/
Drizzle (light-pass conclusion: existing stack, no new ADR); the
ObservabilityPanel component spec.

**Acceptance Criteria:**
- [ ] OBS-01: A successful Chat turn increments today's request count
      by exactly 1 (verified via real call + real DB row).
- [ ] OBS-02: A failed generation call increments requests AND
      failures, and status becomes `erroring`.
- [ ] OBS-03: An Export REPOSITORY_CONTEXT.md generation increments
      the same counters (shared-abstraction coverage, not just Chat).
- [ ] OBS-04: With zero requests today, endpoint returns 0/0/`unknown`
      and the panel renders true zeros (not the unavailable state).
- [ ] OBS-05: With the metrics store unreachable, the panel shows
      metrics-unavailable AND a Chat request still succeeds
      (failure-path test per playbooks/failure-path-testing.md —
      proves the never-break-generation NFR).
- [ ] OBS-06: Status reflects the latest outcome (success after
      failure → `operational`).
- [ ] OBS-07: Rendered panel matches the approved artifact
      (visual-parity review at implementation).

**Out of Scope:** Enforcement/budgeting of any kind; per-repository
breakdown; history/charts; live refresh; configurable time windows;
non-generation calls (embedding is local and free — deliberately not
counted, so the panel measures exactly the constrained resource).
