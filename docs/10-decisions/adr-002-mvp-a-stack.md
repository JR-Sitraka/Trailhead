# ADR-002: MVP-A stack — mono-stack Node/TypeScript, WASM tree-sitter

**Status:** Accepted

**Date:** 2026-07-19

**Context:** Blueprint §14 recommends a two-service architecture: a
Next.js/TypeScript product application plus a separate Python/FastAPI
analysis service (tree-sitter, static analysis, retrieval, summary
generation). Per this project's Project instructions, that split —
including the two-language decision specifically — is contested by
default, not inherited silently. `roles/software-architect.md` also
requires a targeted search on any stack pairing before finalizing it.

MVP-A's actual scope (per `docs/01-product/product-prd.md`) is
narrower than the blueprint's own MVP: no LLM summaries, no embeddings,
no chat, no agent-context export. The blueprint's stated reasons for a
Python service — orchestrating LLM calls, running embedding/summary
pipelines — don't apply to anything MVP-A actually builds. The one
piece of the Python service's job that *does* apply — tree-sitter
parsing — has solid, actively-used JavaScript/TypeScript bindings.

**Targeted search performed:** `node-tree-sitter native bindings
Vercel serverless deployment issues` (2026-07-19). Findings:
- `node-tree-sitter` compiles native C++ bindings via `node-gyp`.
  Multiple current, open issues (tree-sitter/node-tree-sitter #268;
  tree-sitter/tree-sitter #2867; salesforce/agentscript #7) document
  native builds failing across Node major versions (missing prebuilds,
  "compiled against a different Node.js version," C++20-vs-C++17
  mismatches on Node 24) — an active, unresolved fragility class, not
  a one-off.
- Vercel's own knowledge base independently confirms native-dependency
  packages are a common, distinct cause of "works locally, fails when
  deployed" serverless function failures.
- `web-tree-sitter` (WASM) sidesteps this whole class of problem by
  avoiding native compilation entirely — same parsing capability
  (tree-sitter grammars), different binding layer.

This is a real, documented gotcha found *before* committing — exactly
the case `roles/software-architect.md`'s quality standard exists to
catch cheaply, rather than debugging it after implementation.

**Decision:**
1. MVP-A uses a **mono-stack Node/TypeScript** architecture (Next.js
   app handles both frontend and backend/analysis logic) — no separate
   Python service.
2. Parsing uses **`web-tree-sitter` (WASM bindings)**, not
   `node-tree-sitter` (native bindings).

This decision is scoped to MVP-A. It is explicitly **not** a permanent
rejection of Python for this project — see `architecture.md`'s
"Explicitly rejected alternatives" for the condition that would reopen
it (MVP-B's LLM/embedding tooling needs).

**Consequences:**
- No cross-service API contract to design or maintain during MVP-A —
  one runtime, one deployment unit.
- Solo builder runs one local process instead of two.
- Parsing performance ceiling is whatever WASM tree-sitter achieves —
  acceptable for MVP-A's 5,000-file/1MB-per-file limits (PRD), but
  worth a real measurement once analysis jobs exist for real repos,
  not assumed.
- `docs/07-architecture/architecture.md`'s Stack table reflects this
  decision directly; `docs/10-decisions/` should be re-checked at the
  MVP-B architecture pass to see whether this ADR needs superseding.
