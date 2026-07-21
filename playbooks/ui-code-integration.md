# Playbook: Integrating generated UI code into an existing project

**Port the actual generated code — never re-describe it in prose for a
coding agent to reimplement.** A prose re-description reliably drifts
from the original on layout, spacing, and structure. This risk is
specific to merging into something that already exists — a greenfield
project has no existing code to drift *from*, so this doesn't apply
there.

**Stack constraints must have been restated in every generation
prompt** — canonical rule and reasoning in
`playbooks/visualization-prompting.md`; if generated code arrives with
a framework mismatch, that rule upstream is the first suspect.

**Translate the styling system deliberately, don't merge it raw.**
Generated code commonly uses a different convention than the target
project (e.g. shadcn-style Tailwind utility classes vs. a project's raw
CSS custom properties) — map explicitly, class by class if needed,
rather than dropping the generated classes in and hoping they resolve
to something sensible.

**After merging, run `frontend-merge-checks.md` and
`responsive-css-debugging.md` before reporting done** — don't treat
"it builds and matches the mockup visually" as sufficient on its own.
