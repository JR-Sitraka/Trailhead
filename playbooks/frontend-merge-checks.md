# Playbook: Frontend merge checks (existing-project work)

Run before declaring any merge into an existing codebase done. Real,
recurring bug categories from actual existing-project merges, not
hypothetical ones — this shifts discovery from "the person notices
visually and reports back" to "caught before it ships."

(Inline-style-vs-media-query conflicts have their own playbook —
`responsive-css-debugging.md` — since it's dense enough to warrant one;
load it alongside this one for existing-project frontend work.)

- **Leftover values inherited from a prior design version** — e.g. a
  sizing or position value tuned for a shape or layout that's since
  been replaced. Check values against the *current* spec, not against
  "it was already there."
- **Framework/stack mismatches** — TypeScript merged into a plain-JS
  project, App Router conventions merged into a Pages Router project, a
  styling system's utility classes merged into a project that doesn't
  have that system configured. Confirm the target project's actual
  conventions before treating merged code as compatible.
- **Every content field, checked against real project data** — not
  just whether the code's shape is correct. This is the
  structurally-correct-vs-correct-content rule in
  `playbooks/verification-tiers.md` (canonical there — load it
  alongside this playbook); check both, every merge.
- **If a browser-inspection tool is available** (MCP with direct
  DevTools/CDP access, not just source-reading), use it to confirm
  actual computed values before reporting complete — closing the loop
  that otherwise takes multiple rounds: claim done, human checks, human
  reports what's wrong, agent fixes, repeat.
