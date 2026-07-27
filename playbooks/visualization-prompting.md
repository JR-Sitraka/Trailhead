# Playbook: Prompting a visualization tool

Load for any screen-generation task, and for any head-to-head
comparison of visualization/coding tools. These are procedures for the
`ui-designer` role — its invariants stay in `roles/ui-designer.md`.

**When a real reference image exists (a competitor site, a template, a
screenshot), attach it directly to the generation prompt alongside the
text brief** — visualization tools follow a combined prompt-plus-image
far more reliably than a text description of the same image. Don't
describe an image in prose when the image itself can just be sent.

**Every prompt sent to a visualization tool must be self-contained —
never reference something the tool has no access to see** (a different
page from this project, an earlier session, "the same as the
homepage"). If the tool's session has never been shown that content,
describe it directly and completely instead of pointing at it.

**When working from a reference image or template, extract the
reusable structural pattern and explicitly discard mismatched
content** — wording, tone, invented copy that doesn't describe this
project. Confirm with the person which parts of a reference are
structural (safe to reuse) versus content (needs their real words),
rather than assuming a whole reference should be adopted wholesale.
Literally copying a generic reference's copy risks shipping something
factually wrong about the actual person or product.

**When generating for an existing project, restate the target stack's
exact constraints (framework, router type, language, styling system)
in every single prompt — not just once at the start of a session.**
Tools default to their own scaffolding assumptions on every generation
unless told otherwise each time; they don't remember constraints from
an earlier prompt in the same conversation. This is what actually
prevents framework mismatches during merge, not switching tools.
(Canonical statement of this rule — `playbooks/ui-code-integration.md`
points here, it doesn't restate it.)

**When comparing multiple visualization or coding tools head-to-head,
check API/direct accessibility before assuming an equal comparison is
possible.** Some tools are directly queryable by the planning
assistant; others are login-walled and only reachable through the
person manually relaying screenshots. That asymmetry is real and
affects how much of the comparison can happen without the person in
the loop for every step — name it explicitly rather than let an
unequal comparison look like a fair one.

## If the tool's generation credits run out mid-project
*(provisional — observed four times across Trailhead's two phases)*

Generation quotas exhaust without warning and may not recover within
the project. The confirmed working fallback: switch to **code-first
editing** — write or edit the screen's source directly through the
tool's file-write path (or locally) instead of prompting for
regeneration, keeping the same brief, tokens, and review gates. Treat
the switch as a mode change to note in `PROJECT-STATE.md`, not an
incident: on Trailhead this became the standing working mode for three
consecutive screens, with the compliance pass catching real deviations
in the hand-written versions just as it did in generated ones — the
review discipline, not the generation path, is what protects quality.

## Comparing tools head-to-head
*(provisional — methodology from one real three-tool comparison)*

One compiled brief, used identically across every candidate. Then, per
candidate: a mechanical compliance pass against the brief, tokens, and
IA; a fix-and-retest loop for its failures; and **live interaction
testing, not screenshot review** — Trailhead's most significant
comparison findings (a dead delete button, non-functional filter
chips, UI copy claiming out-of-scope capabilities) were invisible in
static screenshots. Compare design quality and handoff quality as
separate scores: a tool can win the image and lose the handoff, and a
screenshot-only winner's reconstruction cost must be stated before
selection. Finally, reproduce the preferred output in whichever tool
has the better source access, rather than living with the worse
handoff. API-accessibility asymmetries between candidates (above)
apply to the whole comparison.
