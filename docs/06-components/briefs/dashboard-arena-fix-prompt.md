# Fix prompt for arena.ai — Dashboard (Option 1)

Self-contained prompt — paste this directly into arena.ai's Option 1
project. It doesn't assume arena has seen anything outside this
message.

---

Make the following fixes to the Dashboard screen. Do not change the
overall layout, the color palette, typography, or spacing tokens
already in place — these are targeted corrections, not a redesign.

**1. Delete is currently non-functional — wire it up with a confirmation step.**
Clicking the delete (trash) icon on a repository row currently does
nothing at all. Fix this:
- Clicking delete should open a confirmation dialog (styled
  consistently with the existing "Add repository" modal — same dark
  surface, border, and radius as that modal).
- The dialog should name the specific repository being deleted and
  state that this is permanent.
- Cancelling (via a Cancel button, clicking outside the dialog, or
  pressing Escape) must leave the repository list completely
  unchanged.
- Only on explicit confirmation should the repository actually be
  removed from the list.

**2. Status filter chips are non-functional and don't match the actual status values — fix both.**
Currently clicking "Ready" / "In progress" / "Failed" does nothing,
and the filter labels don't match the status pills shown in the list
(the list shows "Ready," "Analyzing," "Queued," and "Failed" — but the
filters are "All," "Ready," "In progress," "Failed," with no way to
filter to Queued specifically, and "In progress" doesn't match the
"Analyzing" label it's supposed to filter).
- Rename "In progress" to "Analyzing" so it matches the status pill
  label exactly.
- Add a "Queued" filter chip.
- Make all filter chips actually filter the visible list to rows
  matching that status. "All" shows everything.

**3. Remove the automatic re-analysis claim in the footer — this product does not do that.**
The current footer text reads: "Analyses are re-run automatically when
a new commit is detected on the tracked branch." This is incorrect —
this product does not automatically re-analyze on new commits.
Analysis only happens (a) when a repository is first imported, or (b)
when a user explicitly clicks "Reanalyze." Replace that footer text
with something accurate, e.g.: "Reanalysis is manual — use the
Reanalyze action on a repository to refresh its analysis against the
latest commit." Or simply remove the footer line if no replacement
copy is needed.

**4. Confirm the branch selector actually appears for the GitHub URL tab.**
The "Add repository" modal's GitHub URL tab should show a branch
selector once a valid, reachable repository URL is entered (a
dropdown of the repository's branches, defaulting to the primary
branch). If this isn't currently implemented, add it. If it is
implemented but just wasn't visible in a prior screenshot, no change
needed — just confirm it's really there.

**5. Restrict the ZIP upload tab to .zip only — remove .tar.gz support.**
The upload tab currently accepts "ZIP or TAR.GZ, up to 150 MB." Change
this to accept .zip archives only (still up to 150 MB). Update both
the accepted file type validation and the displayed helper text (it
should read something like "ZIP, up to 150 MB" — no mention of
TAR.GZ).

Do not add any other features, chat interfaces, confidence scores, or
diagrams — this screen stays scoped to exactly what's listed above,
plus everything already working correctly.
