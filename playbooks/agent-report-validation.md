# Playbook: Making context-loading verifiable, not just claimed

When a task packet lists required context (role file, docs, playbooks),
don't just trust a coding agent's claim that it read them — asking "did
you read the file" invites a cheap yes. Build the check into the task
itself.

**Require a context preflight before implementation starts:**

```
## Context preflight
- [x] frontend-engineer.md
- [x] component-specs.md
- [ ] responsive-css-debugging.md — file not found
```

Do not begin implementation when a required file is missing — this
turns an invisible failure (silently skipping a file) into an
observable one (a checkbox nobody can pretend isn't there).

**Go one step further when a task depends on a playbook's specific
content, not just its existence:** require the agent to extract, not
just confirm.

```
After reading the required files, summarize only the constraints from
each that affect THIS task. Do not provide a general summary.
```

A generic restatement is easy to fake; naming the specific constraint
that applies to the specific task in front of it is a much harder thing
to produce without having actually engaged with the content.

**Known limit, confirmed by direct testing (2026-07), not theoretical:**
even a model that engages with a playbook's content correctly — quoting
it accurately, reasoning about edge cases it raises — can still apply
it imprecisely in the actual fix. Content-grounding and execution
precision are separate things to verify; a good preflight extraction
doesn't guarantee a correct diff. Check the actual change, not just the
agent's account of it — same standard as
`playbooks/verification-tiers.md` everywhere
else.
