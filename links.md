# Magic Patterns links — approved screens

Compiled from this conversation's own record (Ask/Chat's history
specifically cross-referenced against `docs/06-components/
component-specs.md`; six of the seven links below are also still
directly present in the repo's `*-review.md` brief files, checked via
`grep`). All seven screens are **design mocks only** — none has been
ported into real Next.js code or wired to any of the real backend
endpoints built so far.

| Screen | Link | Verified against a file currently on disk? |
|---|---|---|
| Dashboard | https://www.magicpatterns.com/c/vp4t2zbgxnuknmjjzr6phd | Yes — `docs/06-components/briefs/dashboard-review.md` |
| Repository Overview | https://www.magicpatterns.com/c/qaxfyszvlwpqawbgcrakag | Yes — `docs/06-components/briefs/overview-review.md` |
| File Explorer | https://www.magicpatterns.com/c/5yhcw3merhxhwehzkg69eg | Yes — `docs/06-components/briefs/explorer-review.md` |
| Symbols | https://www.magicpatterns.com/c/cqqbwmty3fbapbqxdflsvi | Yes — `docs/06-components/briefs/symbols-review.md` |
| Search | https://www.magicpatterns.com/c/w1vdhkjhhrs8y8tft9dgnx | Yes — `docs/06-components/briefs/search-review.md` |
| Ask / Chat | https://www.magicpatterns.com/c/8xv4homjprpvqrnhkwnkdf | Yes — `docs/06-components/component-specs.md` |
| Export | https://www.magicpatterns.com/c/8oh5zypga1qqwcwlzvtsae | **No** — from this conversation's own record only; not currently findable in any tracked file via `grep -rn "magicpatterns.com/c/"` across the repo |

## Notes on the Ask / Chat entry specifically

Ask and Chat are the **same screen, evolved, not two separate
screens** — per the product decision that Chat supersedes Ask rather
than sitting alongside it. Ask's *original* code-first build used a
different URL, `https://www.magicpatterns.com/c/e7zkdfv83vsipzn8ef5fhg`
— that one is superseded and shouldn't be treated as a live, separate
reference. When the screen was rebuilt as Chat (multi-turn thread,
"New conversation" action, etc.), it got the new URL listed in the
table above, which is the one that's actually current and the one
`component-specs.md` still points to.

## Caveat on the Export link

Every other link in the table above I could re-confirm directly
against a file still present in the repo today. Export's link could
not be — it was consistently recorded across multiple `PROJECT-STATE.md`
rounds earlier in this conversation, but no currently-tracked file
still contains it (the review file for Export,
`docs/06-components/briefs/export-review.md`, exists but was never
written with a URL in it, same as Ask's and Chat's review files). If
this link matters for anything beyond casual reference, worth opening
it directly to confirm it still resolves to the right screen before
relying on it.
