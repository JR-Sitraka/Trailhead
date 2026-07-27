# Playbook: Kit release review

Run before any new kit version is published — by whoever (person,
planning assistant, or coding agent) assembled the version. This is
the kit's own pre-merge self-check. It exists because the pattern is
now confirmed across four versions: every release assembled without an
external audit fixed the previous version's defect while committing a
fresh instance of the same class — a research dump cured in V3 and
recreated in V4; splits claimed in V4 but not performed; the promotion
rule written in V4 and violated by the first V5 draft. Fifteen minutes
here is cheaper than the audit that otherwise follows.

## Checklist — all items, evidence required, tiers honest

1. **Diff every file against the prior version.** The changed-file
   list in the changelog must match the actual diff exactly — no file
   changed but unlisted, none listed but unchanged.
2. **Check the promotion table both directions.** Every addition
   traces to a retrospective finding at the required evidence level
   (two projects, or one with the severe-safety justification stated)
   or carries an explicit provisional/speculative marker. Every
   promote-now and strong-hold finding in the latest retrospective is
   either implemented or explicitly declined with a reason in the
   changelog.
3. **Check for deleted battle-earned content.** Grep the prior
   version for every mechanism a retrospective ever validated as
   working; confirm each survives or its removal is listed under
   "Removed" with a reason. Restructures delete silently — this is
   the check that caught Known-good-state's loss too late and the
   manual-vs-agent separation's loss on time.
4. **Changelog has full accounting:** every file, an explicit
   "Removed" section, an explicit "Considered and not adopted"
   section where applicable.
5. **Reasoning preserved.** No rule lost its why. A rewrite that
   compresses an earned rule to a bare imperative fails this check —
   the incident reasoning is what makes rules auditable and prunable
   later.
6. **Provisional ledger current.** Every provisional item from prior
   versions has a verdict (confirmed → marker removed; unused →
   removed entirely; revised → re-marked) — none ride along
   unexamined.
