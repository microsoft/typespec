# Task03 scope review and implementation handoff

Tracking [issue #12454](https://github.com/microsoft/typespec/issues/12454) and the
[Task03 checklist](./pre-emission-task03-checklist.md) on
`feature/pre-emission-task03-continuation`.

## Decision and authority

The user requested this scope adjustment after reviewing Task03's complexity:
**prioritize the reductions with the greatest demonstrated benefit, rather than
completing an increasingly general proof system first.**

This document governs the next implementation milestone on this continuation
branch. It changes sequencing and bounds new implementation work; it does not
remove the original issue/POC acceptance requirements. The existing checklist
remains the full inventory, including deferred work. Its open rows are not all
prerequisites for this narrower milestone. Do not equate completion of this
milestone with full Task03, issue completion, or readiness for default activation.

No original regression expectation, safety gate, or accepted positive is waived.
Deferred accepted positives remain explicitly pending, not newly "unsupported"
or silently covered by a retention test. Changes to the original PR, issue
comments, or public/default rollout require their separate approval gates.

## Review baseline

- Reviewed production source: `ba019d2820651fb577b9f07df71d83bf2ef5aaa1`.
- Reviewed checklist: `020319fa8ae49e63201ff5e1cd41bc60d41ffa41`, a documentation-only
  commit on top of that source.
- The continuation forks from `eed483571`, before PR #12462's later `3a1aa9358`
  simplification commit. Differences from `3a1aa9358` are not automatically
  regressions introduced by Task03.
- The continuation adds about 3,100 production lines and 10,300 test lines. It
  produces real bounded call-selection, observation-absence, contextual and
  enclosing-capture facts; it is not merely declaration metadata.
- The independent focused `PreparedFieldType` run at `ba019d282` passed 796 tests,
  with zero failures or skips. This is not an unfiltered/client/SDK result or
  completion of the checklist's final review gate.
- The checklist separately reports unpublished local code, focused results and
  an unfiltered core result of 4,067 passes and two unresolved raw `typeof`
  positives. Those local changes were not part of this source review. Reconcile
  current local state before acting; do not overwrite or discard that work.

The principal risk is a long tail of narrowly supported emission shapes, each
requiring more lookup, conversion, lexical, import and freshness machinery.
Existing shared header/documentation envelopes are useful and already reused;
this is not a request to replace them with another framework.

## First milestone: one genuine end-to-end reduction

**Continue G1 first, using existing producer support and the necessary G7
rendering mechanics. Do not expand producer breadth as a substitute for this.**

Use an existing accepted raw `typeof` shortening positive and its original
regression anchor. Demonstrate all of the following through the genuine
complete-input, body-only host:

1. Preparation establishes an occurrence-specific editing permission, not merely
   a selected call, contextual type, or observation-absence fact.
2. The real lifetime captures roots, validates inputs, attaches to the actual
   owners, tracks consumed permissions, and permits a valid commit without a
   dummy field. The published field-centric early return must not be bypassed by
   removing admission or freshness checks.
3. The designated raw writer output shortens before any legacy reduction. A
   synthetic helper-only or post-legacy success is insufficient.
4. Corresponding observed/unknown occurrences retain their required form;
   explicit caller-expression overrides do not erase independent ancestor
   captures, caller-line constraints or configuration constraints.
5. Safe field/literal decisions remain independent of an unavailable body
   decision. Callback-once behavior, canonical identity, owner/shared-node
   isolation and sticky invalidation continue to hold.
6. Tests compare actual binding, relevant compiler/emit diagnostics and
   observable captured values where applicable, not only internal flags.

Close the existing paired raw-shortening positives within this bounded slice
before starting a separate semantic family. If one needs significant new
machinery, explain the exact missing dependency and its reduction benefit first.
Do not replace an original instance/local-delegate/omitted-argument fixture with
an easier static or explicit-argument substitute.

## Next: select by reduction benefit

After the first end-to-end slice, use G3's existing 15-row/44-source-file inventory
as the acceptance map. Do not create a second exhaustive feature checklist or a
general profiling framework.

For each candidate slice, record a small evidence table:

| Evidence         | Required content                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Anchor and owner | Original accepted fixture/row, intended output, and owning issue task.                                                       |
| Consumer         | The actual writer reduction that will use the facts or permission.                                                           |
| Benefit          | Distinct raw-output occurrences/files enabled in an identified representative corpus. Label estimates and unmeasured claims. |
| Incremental cost | New semantic rules or emission contexts needed, versus reuse of existing facts.                                              |
| Safety           | Retained controls, input/currentness dependencies, and binding/diagnostic/runtime evidence.                                  |
| Status           | Active now, deferred accepted positive, or genuinely outside the agreed acceptance surface.                                  |

Start with existing raw-writer fixtures and available representative generated
inputs. Do not start a full SDK regeneration or performance campaign solely to
populate this table. Count actual prepared/raw reductions, not only certificate
objects, passing tests, or textual `global::` matches.

Prefer common type spellings and simple expression/receiver contexts that reuse
the established machinery. Ordinary declaration types may be a higher-yield next
slice than another complex callback context, but that ranking must be supported
by evidence. Task04 owns its role/construction implementation: identify the
minimal shared Task03 prerequisites instead of making it wait for every advanced
Task03 row. Coordinate any task-dependency changes explicitly; do not implement
other tasks as an untracked Task03 workaround.

If the objective is retiring `Simplifier` cost, also track files that can stop
invoking it. Many shortened tokens do not by themselves prove runtime savings
while the same whole-file simplifier still runs. This is prioritization evidence,
not a new benchmark gate or permission to claim performance improvements.

## Checklist disposition for this milestone

| Checklist area                       | Scope adjustment                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1, G3, necessary G7                 | Immediate priority: actual permission, genuine body-only lifetime, raw output, safe fallback and original positive/retention evidence.                                                                                                                                                                                                                                                        |
| A1-A3, G4, G6                        | Keep every dependency, source-policy and layout safeguard required by enabled reductions. Do not build general support for unrelated emission shapes first. An unknown dependency that could invalidate an active reduction still blocks that reduction.                                                                                                                                      |
| G5 and the conditional portion of E2 | Keep original conditional/capture retention and explicit unknown facts. Full configuration/branch correspondence belongs to Tasks11-16, not this milestone.                                                                                                                                                                                                                                   |
| G2                                   | Provide lexical evidence required by adopted producers. Full role-specific `nameof`, dynamic, contextual-token, backing-field and parser behavior belongs with the corresponding type/receiver/grammar tasks, principally Tasks04-07.                                                                                                                                                         |
| G7 beyond the first consumers        | Preserve callback-once, field/body independence and all safety checks for active permissions now. Exhaustive combinations of every eventual type/receiver/default/attribute/documentation family belong to Task19 integration.                                                                                                                                                                |
| B1-B4                                | Reuse completed B2. Add conversion/array/construction evidence when it unlocks a selected reduction. Treat `Array.Empty<T>()` as a candidate to measure, not an automatic reason to expand all argument semantics.                                                                                                                                                                            |
| C1-C4, D1-D4                         | Add only bounded source/generated/delegate/generic/access/constructor contexts needed by selected acceptance rows. Broader hierarchy, member, contextual and partial combinations are deferred unless their measured benefit justifies the cost. Original accepted local delegates and private-instance generic cases remain pending or validated as actually evidenced; they are not erased. |
| A2 and D5 general dispatch           | Audit factories/maps/getters that can affect active facts. Support specifically adopted real contracts, not arbitrary plugin dispatch or a universal non-dispatch framework. Unknown affecting inputs must retain locally or invalidate the dependent decision.                                                                                                                               |
| E1, E3-E6                            | Extend receiver, extension and implicit initializer/Add support on demand for selected rows. Do not complete every substitution, multi-owner or implicit-operation combination before the first raw-output wins.                                                                                                                                                                              |
| F1-F3                                | Reuse existing bounded producers and their tests. Do not broaden them simply to make the proof API more complete.                                                                                                                                                                                                                                                                             |
| F4-F7                                | Add lexical/local-function/closure/resource/handler/interpolation coverage only for identified reductions or required safety dependencies. Broader forms are deferred; unknown capture remains unknown.                                                                                                                                                                                       |
| V1-V3                                | Preserve required validation and independent-review gates. Report milestone evidence separately from the still-open full checklist and all unresolved accepted positives.                                                                                                                                                                                                                     |

"Deferred" here limits new work for this milestone; it does not declare a whole
language family permanently out of scope. Do not rewrite checked rows to imply
broader support, or close open accepted positives solely because they retain.
No speculative extension is required merely because a checklist row says
"complete required"; identify the original accepted case and current consumer.

## Which proofs to implement, defer, or keep

A proof earns implementation priority when it does at least one of these:

- Enables an identified, selected reduction with an actual output consumer.
- Protects the correctness of a reduction already enabled.
- Is a shared prerequisite for a clearly identified high-yield next slice.

A proof that only improves theoretical coverage, has no selected consumer, and
protects no active reduction should be deferred. Lack of a direct spelling change
does not make a safety proof useless: capture, freshness and import facts may be
essential indirect dependencies.

Do not remove existing tested proofs or guards merely because their incremental
benefit is unmeasured. Stop speculative expansion first; deletion or a claim of
redundancy requires its own regression-preserving assessment.

When facts are unavailable, defer that reduction or its migration. Never skip the
proof and perform the same rewrite anyway. During migration, preserve the existing
legacy residual path for families not yet migrated; do not add a new post-write decision
owner. Final legacy removal remains Task19 work. This is not permission to accept
`global::` as the final generated SDK spelling.

## Non-negotiable implementation safeguards

- Keep selection, argument/context evidence, observation absence, source policy
  and editing permission distinct. A method signature or advertised expression
  type alone does not establish what the writer actually emits or binds.
- Observation absence must cover the conservative candidate set with the required
  witness, not just one convenient candidate. Unknown is not absent or safe.
- Preserve occurrence/owner/context identity, canonical IR/type identity, original
  source provenance, sticky observed invalidation and independent safe decisions.
- Do not execute user callbacks, getters or equality as a side effect of proving
  purity/currentness. Do not replay callbacks or force lazy carriers to invent
  correspondence.
- No general binder/inference/CFG engine, fabricated method symbol, generated-body
  parsing/compilation for production decisions, second preparation lifetime, or
  weakened admission/custom-writer/rewriter/diagnostic gates.
- Preserve original regression anchors and expectations. Explain every deferred
  accepted positive; do not delete, mute, substitute or weaken its test to obtain
  a green result. An unsupported retention test is not its positive counterpart.

## Validation and handoff report

Before production changes, reproduce the selected original failure and plan the
smallest sufficient validation. Run focused regressions during iteration, then
required broader/unfiltered checks at stable scope. Record actual failing tests
and outstanding CI; prior focused producer results are not fresh full validation.
No new default activation, SDK adoption/regeneration or performance claim is
implicitly authorized by this handoff.

For each checkpoint, report:

1. Which original raw reductions now work, with before/after output and controls.
2. What additional coverage they provide and which shared facts were reused.
3. Which semantic machinery was added and why it was necessary.
4. What remains deferred, including original accepted positives and later-task
   ownership; do not present partial completion as full Task03 completion.
5. Exact source revision, tests/results and outstanding validation.

If the next selected case needs a new general analysis subsystem, return with the
concrete case, expected benefit and bounded alternatives before expanding it.
Continue independent authorized work rather than treating that escalation as a
reason to stall the whole task. The next checkpoint should demonstrate more
useful raw output, not merely a larger producer test matrix.
