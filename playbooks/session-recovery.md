# Playbook: Recovering an interrupted coding-agent session

> **Status: PROVISIONAL** — promoted from a single project's
> retrospective (Trailhead, 2026-07). Confirm, revise, or remove at
> the next project's retrospective (see its provisional-verdicts
> section). Provisional means loaded and used normally — the marker
> governs its future, not its present.

Load whenever a coding-agent session ends abnormally — API error,
context-compaction failure, hung build, or a silent stop with no error
at all. Trailhead's implementation session needed this exact procedure
eight to ten separate times; every step below traces to a real
incident, not a hypothetical.

## Before resuming any work

1. **Check for stray processes first.** Orphaned dev servers and build
   processes from the dead session can hold file locks or ports and
   make the next failure look unrelated. On Windows specifically:
   stray `node` processes plus a stale `.next/` cache produced either
   a silent multi-hour hang or an `EPERM` file-lock error, three
   separate times — kill the processes and delete the cache *before*
   the next build, not after it fails.
2. **Check `git status` and `git diff` before trusting any claim about
   what was saved.** A "committed" claim from before the interruption
   is a claim, not a fact — verify it the same way any agent claim is
   verified. Uncommitted work found here is the recovery's first
   priority, before resuming the task.
3. **Diagnose before resuming.** Identify what the interrupted task
   had actually completed (real evidence: files on disk, passing
   tests, migration state) versus what it had only claimed or
   started. Resume from verified state, never from the last report.
4. **Re-issue the task packet fresh** — the new session inherits
   nothing; a resumed task gets the same required context and
   preflight as a new one, plus one line stating what recovery found.

If the same interruption mode recurs, record its diagnosis and fix in
`KNOWN-GOOD.md` so step 1 gets project-specific teeth.
