# ADR-006: Backfill architecture.md's Data Model and API Contracts from implemented code

**Status:** Accepted

**Date:** 2026-07-21

**Context:** `architecture.md`'s "Data Model" section existed as a
header with no actual field-level content for `Repository`, `File`,
or `AnalysisJob`, and the `POST /api/repositories` contract shape was
never written in — discovered directly (not assumed) when Kilo Code
hit this gap implementing PREPROC-01–04 and correctly escalated it per
`principles.md` #1 rather than guessing silently. The schema and route
logic were implemented and passed real, agent-verified tests against
a real database before this gap was formally closed — meaning the
"backfill" here is documentation catching up to already-validated
reality, not architecture being invented after the fact to match
whatever got built.

While reconciling `architecture.md` against the real, pasted source
(`schema.ts`, `route.ts`), two real findings surfaced that a pure
documentation pass wouldn't have caught on its own — direct
cross-checking of spec against implementation is what found them:

1. **`commitSha` nullability contradicted the spec.**
   `repository-import.md`'s Business Rules state the commit SHA is
   captured from the GitHub HEAD for every GitHub import. The real
   code allowed `commitSha: null` if that specific API call failed
   while repo-existence still succeeded — meaning an import could
   silently "succeed" with an incomplete identity. **Resolved:** this
   must now fail the whole import (502) rather than create a
   Repository with a missing commit SHA. Logged here as the spec-drift
   fix `principles.md` #3 requires; implementation task tracked
   separately.
2. **Unordered `AnalysisJob` lookup in both GET endpoints.**
   `GET /api/repositories` and `GET /api/repositories/:id` each fetch
   a repository's associated job with no `ORDER BY createdAt` — this
   is a real, currently-dormant correctness gap. It causes no visible
   bug today because nothing yet creates more than one `AnalysisJob`
   row per repository, but `repository-dashboard.md`'s Reanalyze
   feature will do exactly that. **Not fixed now** — logged as a known
   gap to close specifically when Reanalyze is implemented, since
   fixing it in isolation now has no way to be meaningfully tested
   (no code path exists yet that creates a second job to order
   against).

**Decision:** `architecture.md`'s Data Model and API Contract sections
are updated to reflect the real, tested schema and route behavior
(see that file directly for the current content — not restated here
per this kit's own discipline against duplicating detail across
files). `commitSha` failure handling is corrected per finding 1. The
AnalysisJob ordering gap (finding 2) is explicitly deferred, not
silently accepted as fine.

**Consequences:**
- Every future backend feature (Ask, Chat, Export) can now read
  `architecture.md` directly for the real Repository/File/AnalysisJob
  shape instead of re-deriving it from feature docs, closing the
  exact gap that caused this ADR to exist.
- Whoever implements Reanalyze must address finding 2 as part of that
  work, not treat the existing GET endpoints as already correct.
- No stack, infrastructure, or tooling decision changes as a result of
  this ADR — scoped entirely to documentation accuracy and the one
  real code fix in finding 1.
