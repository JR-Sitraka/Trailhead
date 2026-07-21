# Playbook: Failure-path testing

Happy-path testing, however thorough, structurally cannot find certain
bugs — only actually breaking something for real can. Deliberately
induce real failures and confirm the system handles them gracefully,
rather than only adding debug-only bypass code to simulate one:

- **Revoke or corrupt a real credential** (e.g. an API key) and confirm
  the failure is caught and surfaced clearly — not silently swallowed
  into a false "success," and not left uncaught to crash into a raw
  framework error page.
- **Take a real dependency offline** (stop the database, the backend, a
  third-party service) and confirm the resulting error state is clear —
  not a raw error string bleeding into the UI, and not silently shown
  alongside a contradictory "empty" state at the same time.
- **Remove something out from under a page that's already loaded**
  (delete a row directly, revoke access mid-session) and confirm it
  fails cleanly rather than crashing.
- **Attempt an authorization bypass specifically** — access a resource
  the current user shouldn't be able to reach, not just an
  authentication check. Being logged in and being allowed to access
  *this* resource are different checks; test both.

On every case: also confirm real recovery — that normal operation
actually resumes correctly once the failure condition is lifted, not
just that the failure itself was handled.
