# Visual Parity Evidence — LLM Observability Panel

Per `playbooks/visual-parity-review.md`. Reviewed 2026-07-30, branch
`upgrade/observability` @ `a25bb2b`.

## Comparison environment
| | |
|---|---|
| Browser | Chromium 148.0.7778.280 (Electron 42.7.0 in-app pane), Windows 10, DPR 1 |
| Viewports | 1440×900, 768×1024, 390×844 — all three canonical |
| Theme | Dark (project-wide, no `dark:` variants) |
| Fonts | JetBrains Mono ✔, Inter ✔ loaded (`document.fonts.check`) |
| App | `npm run dev` → `localhost:3000`, real `trailhead_dev` |
| Fixture | `sindresorhus/escape-string-regexp` (`188ab357…`, 15 real chunks) |
| Reference | Approved artifact `cfe1be53-07e0-4903-9e93-7e4412b45e06` — source + `tailwind.config.js` read via MCP, code-backed |

## Token equivalence
| Artifact token | Value | Real token | Value | Computed |
|---|---|---|---|---|
| border | #232838 | border-muted | #232838 | rgb(35,40,56) ✔ |
| muted | #8A94A6 | text-muted | #8A94A6 | rgb(138,148,166) ✔ |
| text | #E6E9EF | text-primary | #E6E9EF | rgb(230,233,239) ✔ |
| surface | #12161F | surface | #12161F | rgb(18,22,31) ✔ |
| card radius | 8px | --radius-card | 8px | 8px ✔ |

Mechanical source diff (comments stripped): the only differences
between the approved artifact and the shipped panel are 6 token-name
substitutions (all value-identical above) plus 3 non-rendering JSDoc
lines. Zero structural, layout, spacing, or color-value differences.

## Four states × three viewports — all reached by real means
| State | Method | 1440 | 768 | 390 | Key evidence |
|---|---|---|---|---|---|
| Populated | Real Chat turn | 1 row | 1 row | 2 rows | mono numerals; green pill #3FB950 @ 0.10/0.35 |
| True zeros | Real zero-day window | 1 row | 1 row | 2 rows | real mono 0/0, Unknown pill #8A94A6 @ 0.10/0.30 — not the unavailable state |
| Erroring | Real 401 Invalid API Key → 502 | 1 row | 1 row | 2 rows | red pill #E5484D @ 0.10/0.35, 6×6 dot; counts still shown |
| Unavailable | Real table rename → real 42P01 | 1 row | 1 row | 1 row | mono em-dash + caption, no pill, no fake zeros; height 48→39 |

Geometry identical in every capture: px-4 py-2.5 (10/16px), gap-x-6/
gap-y-2 (24/8px), mb-5 (20px), radius 8px, 1px border. `focusable: 0`
in all twelve captures — never in tab order, zero interactive
controls. Wrap at 390 is pure flex-wrap, no breakpoint rules.

## Classification
| # | Difference | Class |
|---|---|---|
| 1 | Inter not applied — Dashboard renders in the system stack | **Fail** |
| 2 | Token-name remap (value-identical) | Accepted deviation — explicitly allowed by the handoff |
| 3 | Populated used real counts, not the frozen 42/1 | Accepted deviation — task mandates real means |
| 4 | True zeros via reversible timestamp shift, not deletion | Accepted deviation — avoids an irreversible action |
| 5 | Panel caps at 1104px (max-w-6xl) at both 1280 and 1440 | Environment variance |
| 6 | Pixel appearance | Unverified — screenshot capture failed this session |

**Finding #1 root cause:** `Dashboard.tsx:207`'s root
`className="... font-sans"` resolves `--font-sans`, which
`globals.css`'s `@theme` never defines — Tailwind v4's default system
stack silently wins over `next/font`'s Inter. Confirmed project-wide
(h1, h2, repository-list header all affected identically). **Not
caused by this work; out of this task's scope to fix.**

**Finding #6 root cause:** the Browser pane didn't composite frames
this session; `screenshot` timed out every attempt. All evidence
above is computed-style + DOM geometry — the playbook's sanctioned
alternative, more precise for tokens/spacing but proves nothing about
actual rendered pixel appearance. **Human visual confirmation
required** (below).

## Restore confirmation
- Credential: real key restored, real Chat call returned a real cited
  answer, status back to `operational`. `.env` never edited.
- Table: `llm_request_logs` present, no leftover rows, HNSW index intact.
- Timestamps: shifted row restored byte-exact.
- Data: 3 real rows (success, induced failure, recovery) — the true
  history, not scrubbed.
- Git: HEAD unchanged, tree clean except the known
  `scripts/check-got.ts` deletion.

## Verdict
**Panel parity is clean on every dimension the panel controls** —
structure, hierarchy, typography scale, tokens, spacing, all four
state treatments, responsive wrap. The single Fail is a pre-existing,
project-wide defect, independent of this work.

**Tier: Agent-verified.** Human final quality validation (live look
at the running app) is the outstanding step per this playbook's own
requirement — not yet performed.
