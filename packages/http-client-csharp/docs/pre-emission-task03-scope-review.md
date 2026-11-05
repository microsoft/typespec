# Task03 remaining-work handoff

Tracking [issue #12454](https://github.com/microsoft/typespec/issues/12454) and the
[Task03 checklist](./pre-emission-task03-checklist.md) on
`feature/pre-emission-task03-continuation`.

This handoff reflects the review of
`b317c10cf22e7865819cdb98ce26d9404f1c1d9e`. Completed first-milestone work is
recorded in the checklist and removed from the implementation instructions here.
Do not rebuild that slice or rerun unchanged experiments as a prerequisite for
moving forward.

**Prioritize demonstrated reduction benefit over proof completeness.** The
[scoped completion checklist](./pre-emission-task03-checklist.md) now defines the
actual Task03 completion contract: its four remaining items govern closure.
The former 39-item inventory is a deferred roadmap, not an additional completion
gate. Original acceptance rows must remain covered or explicitly assigned to
later owning tasks; none is erased by scoped Task03 completion.

## 1. Map acceptance and select the next high-yield slice

**G3/V3 is the immediate priority.** Use the existing 15-row/44-source-file
inventory, not another exhaustive feature checklist or a general profiling
framework.

For each row, record:

| Evidence            | Required content                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Anchor and consumer | Original fixture, intended raw output, owning issue task and actual writer consumer.                                           |
| Current evidence    | Producer, occurrence permission, raw writer, binding/diagnostics/runtime and retained controls; identify missing stages.       |
| Benefit             | Distinct eligible and enabled occurrences/files in an identified representative corpus. Label estimates and unmeasured claims. |
| Incremental cost    | New semantic rules or emission contexts required, versus reuse of existing facts.                                              |
| Disposition         | Covered, selected next, deferred accepted positive, or genuinely outside the agreed acceptance surface.                        |

This mapping does not require implementing every row now. It must identify the
next bounded slice and explain why its additional reductions justify its cost.
Keep original instance calls, local delegates and omitted caller-expression
fixtures recognizable; do not substitute easier cases.

Start with existing raw-writer fixtures and available representative generated
inputs. Count actual reductions before legacy processing, not certificate objects,
test counts or textual `global::` matches. Do not start a full SDK regeneration
or performance campaign solely to populate the table.

Common declaration types are a plausible next target, not a measured winner. If
the objective includes retiring `Simplifier` cost, also identify files that can
stop invoking it; token shortening alone does not establish runtime savings.
This is selection evidence, not a new benchmark gate.

## 2. Confirm the shared boundary and fix only required core gaps

The current body permission has deliberate coverage limits: one owner/source
file, a specific two-statement declaration-plus-return-call shape, and supported
`Exception`/`Uri` descriptors. These bounds demonstrate a vertical slice, not
broad SDK applicability.

Use the acceptance/benefit map to decide which boundary, if any, to broaden next.
Do not remove restrictions blindly or extend all call, generic, delegate and
implicit-operation profiles merely because they appear in the historical inventory.
A new proof is justified only when it:

- Enables the selected raw reduction through an identified consumer.
- Protects a reduction already enabled.
- Supplies a shared prerequisite for a clearly identified high-yield next slice.

Reuse existing lookup, observation, permission, lifetime and alternative-spelling
machinery. Do not introduce another analysis framework or preparation lifecycle.
A missing fact remains unknown; defer the affected reduction rather than skipping
its proof and rewriting anyway.

Task04 owns its role/construction changes. Identify only its necessary shared
prerequisites and coordinate dependency changes explicitly. Another reduction
family is not required merely to close Task03; R2 requires a usable, documented
core boundary and fixes for identified core defects. Any added core prerequisite
must be bounded and validated. Do not make ordinary declaration work wait for the
deferred roadmap or implement other tasks as an untracked Task03 workaround.

## 3. Integration evidence when adopting later profiles

Carry existing admission, source-policy, import, identity, currentness and fallback
controls onto each selected expansion. Add only integration evidence made relevant
by the newly adopted behavior:

- Exercise the actual `CSharpGen` staging/workspace path when claiming adoption
  through that path; direct preparation/writer/commit tests alone do not establish
  the full asynchronous integration.
- When a profile admits real field and body permissions together, test their
  actual coexistence and fallback. Synthetic body appends validate output
  mechanics, not admitted production body permissions.
- Validate additional owners, source competitors, imports, partials or configured
  policies only where the selected profile supports them. Missing affecting facts
  retain locally or invalidate the dependent decision; unrelated safe decisions
  must not be lost.

Use faithful existing fixtures where possible. These are targeted evidence gaps
for the task adopting the profile, not unconditional Task03 closure requirements
or instructions to build a universal host or all-family combination matrix.

## 4. Validate and report the next stable checkpoint

Before production edits, reproduce the selected original failure and plan the
smallest sufficient validation. Iterate with focused regressions; run required
broader/unfiltered checks and independent review at stable scope. Repeat checks
invalidated by changes, not unchanged historical producer campaigns.

Report the source revision, actual results, unresolved original positives and
outstanding CI. Prior checkpoint passes do not validate new scope. Close scoped
Task03 only when the four checklist items are complete; this does not complete
the original broad roadmap, issue #12454 or default activation.
No SDK adoption/regeneration, performance claim, original PR or issue-comment
change is implicitly authorized by this handoff.

## Work deferred from scoped Task03

| Area                                    | Boundary                                                                                                                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G2 full role/parser inventory           | Implement with the corresponding type/receiver/grammar tasks, principally Tasks04-07. Keep lexical safeguards needed by active permissions now.                                               |
| G5 and conditional E2 expansion         | Full configuration/branch correspondence belongs to Tasks11-16. Preserve original conditional retention and unknown capture facts.                                                            |
| G7 exhaustive cross-family combinations | Task19 integration. Preserve callback-once, independent field/body choices and all safety checks for adopted permissions now.                                                                 |
| Broader B/C/D/E/F profiles              | Extend conversions, arrays, hierarchies, generics, constructors, delegates, initializers, local functions, resources and handlers only for selected reductions or active safety dependencies. |
| General custom dispatch support         | Audit affecting adopted maps/factories/getters; do not certify arbitrary plugins. Unsupported affecting inputs must not be ignored.                                                           |
| Final legacy removal                    | Task19. Preserve the existing residual migration path; do not add a new post-write decision owner or accept `global::` as final generated SDK spelling.                                       |

Deferred accepted positives stay explicitly pending in the historical inventory
and their assigned owning tasks, reconciled by R1/R4. A retention test does not
close their missing shortening counterpart. No complete
language-family support is required simply because a row says "complete required";
identify the original anchor, selected consumer and benefit first.

## Safeguards that remain mandatory

- Keep selected calls, contextual evidence, observation absence, source policy and
  editing permission distinct. Intended signatures or advertised types alone are
  not actual emitted binding evidence; unknown is not absent or safe.
- Preserve exact occurrence/owner/context identity, canonical IR/type identity,
  source provenance, sticky observed invalidation, and independent field/literal
  positives. Validate all dependencies affecting an enabled reduction.
- Do not replay callbacks, force lazy carriers, or execute user getters/equality
  while proving purity/currentness. No general binder/inference/CFG engine,
  fabricated symbols, generated-body parsing/compilation for production decisions,
  second preparation lifetime or weakened input/custom-writer/diagnostic gates.
- Preserve original regression anchors and expectations. Do not delete, mute,
  substitute or weaken accepted positives to obtain green tests. Do not remove
  existing proofs or guards merely because their incremental benefit is unmeasured.
- Preserve required validation and independent-review gates for adopted scope;
  broader deferred scope remains open, not silently reclassified as unsupported.

The next checkpoint should state which original raw reductions now work, their
additional coverage, reused versus new machinery, remaining/deferred cases and
exact validation evidence. If a selected case needs a new general analysis
subsystem, return with its benefit and bounded alternatives before expanding it;
continue independent authorized work instead of stalling the whole task.
