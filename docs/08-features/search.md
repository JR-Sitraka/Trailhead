# Feature: Search

**Purpose:** Let a user find something by exact name or string across
a repository's contents — symbols, routes, env vars, or literal text —
without needing to know where it lives.

**User Story:** As a developer, I want to search a repository for a
known name or string, so that I can jump straight to it instead of
browsing.

**Functional Requirements:**
- Accept a query string and return exact + full-text matches with
  file path and line range.
- Filter results by file type and/or path prefix, combinable with the
  query.
- Show a ranked results list; each result reads as a jump target to
  File Explorer at that file/line.
- Explicit zero-results state including the required reminder that
  this is exact/full-text search only.
- A persistent note that skipped/not-analyzed files aren't included
  in results.

**Non-Functional Requirements:** Backed by PostgreSQL full-text
search (`tsvector`/GIN index on `File.content`) plus an exact-
substring pass, merged and ranked with exact matches prioritized
(`architecture.md`) — this ranking behavior should be verified with
real queries during implementation, not assumed correct from the
query design alone.

**Inputs:** Query string (required to see any results), file-type
filter (optional), path-prefix filter (optional).

**Outputs:** Ranked results list, or an empty/prompt state.

**Business Rules:**
- No semantic or fuzzy matching in MVP-A — the product must not imply
  otherwise anywhere in its copy (this was an explicit brief
  requirement, verified in the built screen's zero-results copy).
- Files with `File.skipped = true` are excluded from the underlying
  query entirely (their `content` is null) — not filtered out after
  the fact, structurally impossible for them to appear.

**Validation Rules:**
- Empty query → 400 if hit directly via API; the UI itself shows the
  quiet "start typing" prompt state rather than calling the endpoint
  at all for an empty string.

**Error States:**
- Repository not yet `ready` → 409.
- Empty query submitted directly to the API → 400.

**Edge Cases:**
- Query matches only in a skipped file → correctly returns zero
  results (not a partial/misleading match), since skipped files have
  no indexed content.
- Query matches an extremely common substring (e.g. a single common
  word) across many files → no result-count cap or "too many results"
  handling was specified or built; worth a real decision (a
  reasonable limit, e.g. top 50) before this becomes a real problem in
  a large repository, not assumed to be fine by default.
- **This screen's zero-results state was built to be genuinely
  reachable** (unlike Symbols' equivalent gap) — the real backend
  implementation should preserve that property, not regress to an
  unreachable/untested empty state.

**Accessibility:** Search input has `aria-label`; focus-visible rings
present throughout per the built source. Full keyboard flow (type →
tab into results → activate a result) remains Unverified, same as
every other screen — a real test needed before this is considered
done.

**Analytics:** None specified for MVP-A.

**Dependencies:** Depends on Repository Inventory/Structural Analysis
having populated `File.content` and its generated `contentSearchVector`.
Results are meant to jump into File Explorer (same cross-link
implementation task noted in that feature's spec).

**Acceptance Criteria:**
- [ ] A query matching known content returns correct, ranked results
      with accurate file path and line.
- [ ] File-type and path filters correctly narrow results, individually
      and combined with a query.
- [ ] A non-matching query shows the real zero-results state with the
      required exact/FTS-only reminder text.
- [ ] Skipped files never appear in results under any query.
- [ ] An empty query shows the prompt state, not an API call or an
      error.

**Out of Scope:** Semantic/fuzzy/AI-assisted search, full source
preview within a result row, saved searches, search history.
