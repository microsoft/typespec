# Scoped Task03 completion checklist

Tracking [issue #12454](https://github.com/microsoft/typespec/issues/12454) on
`feature/pre-emission-task03-continuation`.

Use the [remaining-work handoff](./pre-emission-task03-scope-review.md) for implementation detail.

## Scope and completion rule

The user-approved scope adjustment replaces the previous 39-item checklist as the
**Task03 completion contract on this continuation branch**. Task03 delivers the
bounded shared source-observation, occurrence-permission and writer-lifetime core,
with explicit coverage and a handoff to the subsequent reduction tasks. It does
not have to implement every source-observation family before those tasks proceed.

**Finish scoped Task03 when the four remaining items below are complete.** The
separate deferred roadmap is not an additional Task03 completion gate. Finishing
Task03 does not finish issue #12454, establish default activation or SDK adoption,
or authorize final legacy removal.

The original accepted positives, retention anchors and safety requirements remain
binding for their owning implementation work. Deferral changes ownership and
sequencing; it does not erase a requirement, turn an accepted positive into an
unsupported case, or permit weaker regression expectations. This document does
not itself change the original GitHub issue/PR comments.

## Reviewed baseline — do not reimplement

The first bounded end-to-end slice is implemented at
[`b317c10cf`](https://github.com/live1206/typespec/commit/b317c10cf22e7865819cdb98ce26d9404f1c1d9e):
actual body-only admission, occurrence-owned permission, the two original raw
`typeof` outcomes, shared-edge isolation and sticky same-pass fallback.

The independent focused run passed **888 tests, zero failures/skips**. The
checkpoint also reports unfiltered **4,078 core / 2,696 client** passes and
independent review of the formatter-purity fix; those broad results are
checkpoint-reported, not a second independent run. Remote CI is not established
by local results.

The core remains deliberately bounded: one owner/source file, the supported
declaration-plus-return-call shape, and `Exception`/`Uri` descriptors. This is not
broad SDK coverage. The baseline is evidence to reuse, not a request to rebuild
G1 or expand every producer profile.

## Remaining work required to finish Task03

- [ ] **R1 — Reconcile acceptance and reduction benefit.** Use the existing
      15-row/44-source-file inventory to record each original anchor, actual writer
      consumer, current producer/permission/raw-output evidence, retained controls,
      and remaining gaps. Assign each row either to the adopted Task03 core or to an
      explicit later owner with the required original tests retained. Record eligible
      and enabled raw occurrences/files in an identified representative corpus and
      incremental implementation cost; label estimates and unmeasured claims. Select
      the next high-yield slice from that evidence. Do not implement every row merely
      to complete this mapping.
- [x] **R2 — Confirm the shared boundary and next-task handoff.** Document the
      facts, permission/lifetime interfaces, supported profiles and explicit unknowns
      that the selected next consumer can reuse. Assign role/construction work to its
      owning task, such as Task04, without making it wait for the deferred roadmap.
      Fix any identified defect in the adopted core. Add a new shared prerequisite
      only when its bounded necessity is established for the selected consumer; do
      not require another reduction family or a general analysis framework just to
      close Task03.
- [x] **R3 — Reconcile validation for the final adopted core.** Record the exact
      source revision, executed focused regressions, required broad/unfiltered
      results, independent-review findings and dispositions, and outstanding CI.
      Verify both original raw outcomes and relevant input/currentness/capture/fallback
      controls remain covered. Reuse valid unchanged-source checkpoint evidence;
      rerun checks invalidated by new changes. Do not rerun old producer campaigns or
      add SDK/performance work solely because the handoff documents changed. No
      unresolved defect or required validation failure in adopted scope may be hidden.
- [ ] **R4 — Publish the scoped completion and follow-up ledger.** State exactly
      what Task03 provides, its limitations, and the selected next consumer. Link
      every deferred original acceptance row to an explicit owning task and retained
      regression anchor; obtain agreement on any ownership not already established.
      Report scoped Task03 completion separately from the still-open overall issue
      and deferred roadmap. Do not claim default activation, broad SDK coverage,
      performance improvement or complete `Simplifier` replacement.

### Current reconciliation checkpoint

The [acceptance and handoff map](./pre-emission-task03-acceptance-map.md) records
all 15 original rows, current evidence, remaining gaps and the reusable core
interfaces. R2's selected follow-on consumer is Task04 ordinary declaration/type
work; construction spelling remains Task04-deferred. The bounded declaration
prerequisite is validated, not a request to implement another language family.

The original `Pass(new Exception())` seed now shortens; the construction operand
stays qualified. A captured-call control preserves exact constructor CAE/runtime
text while shortening only the seed. The new eight-case gate, 158-case affected
ownership/generic gate and 15-case surrounding guard run pass. Fresh unfiltered
**4,086 core / 2,696 client** pass with zero failures/skips; formatting/Cop and all
five C# hashes pass. Complete independent medium review of the five C# files and
two checkpoint documents found no concrete production defect. The subsequent
R1–R4 docs-only contract update and reconciliation do not invalidate those source
results. Exact adopted source revision:
[`305048a0812c1d6e6d1b24e6de31dec38cc35cbb`](https://github.com/live1206/typespec/commit/305048a0812c1d6e6d1b24e6de31dec38cc35cbb).
This result-record update changes only documentation; all five C# source hashes
remain identical to the final validated and independently reviewed code.

R1 is **partial**: the acceptance map is present, but representative eligible/enabled
counts and a demonstrated-benefit winner are still unmeasured. The temporary
probe failed and was removed; this declaration slice is provisional low incremental
cost. R4 remains **open**: the row map retains deferred anchors and proposed task
groupings, but exact row-level ownership/agreement and scoped completion publication
are not established. Remote CI is unverified. Scoped Task03 is not yet complete;
its historical deferred roadmap is not an additional completion gate.

R1 and R4 reconcile requirements; they are not instructions to create another
proof-completeness checklist. Start with existing raw-writer fixtures and available
representative generated inputs. Count real reductions before legacy processing,
not proof objects, passing-test totals or textual `global::` matches. If assessing
`Simplifier` cost, distinguish files that can stop invoking it from token counts;
no new benchmark gate or regeneration campaign is required here.

## Deferred roadmap — not required to close scoped Task03

The previous full inventory remains available in the
[historical checklist](https://github.com/live1206/typespec/blob/92713ff0bcf4ee6efb81c4fd4964e1d49723b15b/packages/http-client-csharp/docs/pre-emission-task03-checklist.md).
The identifiers below refer to that inventory. R1/R4 must supply the exact
acceptance-row ownership; broad grouping alone is not enough to lose a case.

| Historical area                                                                | Owning work and boundary                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G2 complete role/parser inventory                                              | Corresponding type/receiver/grammar tasks, principally Tasks04-07. Keep the lexical checks needed by the adopted core.                                                                                                                |
| G5 and conditional E2 expansion                                                | Tasks11-16 for supported configuration/branch correspondence. Keep original conditional retention and explicit unknown capture facts.                                                                                                 |
| G7 exhaustive cross-family combinations                                        | Task19 integration. Preserve safety and independence of currently adopted channels.                                                                                                                                                   |
| Broader B/C/D/E/F profiles                                                     | Assign to the reduction task whose selected consumer needs the conversion, hierarchy, generic, delegate, constructor, initializer, local-function, resource or handler support. No automatic broadening for theoretical completeness. |
| A1-A3, G4/G6 support for additional emission shapes                            | Owning adoption work. All dependency, provenance, diagnostic and layout safeguards affecting the current core remain mandatory now.                                                                                                   |
| Broader custom factory/map/getter support                                      | Owning adoption work for specifically selected real contracts; no arbitrary-plugin dispatch framework. Unknown affecting inputs cannot be ignored.                                                                                    |
| Full asynchronous staging and real field/body coexistence for broader profiles | The task adopting that integration. Add targeted `CSharpGen` and real-permission combination evidence when those profiles become supported; synthetic output mechanics alone do not prove adoption.                                   |
| Final legacy removal, broader activation and full-issue composition            | Task19 and the separately authorized consumer-input/activation work. Preserve the existing residual migration path until its families are migrated.                                                                                   |

A deferred original positive remains required by the overall issue and its assigned
owner. A retention test does not satisfy its missing shortening counterpart. Do
not accept `global::` as the final generated SDK spelling or add a new post-write
decision owner as an escape from the scoped plan.

## Safety rules for adopted work

- Keep selection, argument/context evidence, observation absence, source policy
  and editing permission distinct. Intended signatures or advertised types alone
  do not prove actual emitted binding; unknown is not absent or safe.
- Preserve exact occurrence/owner/context and canonical IR/type identity, original
  source provenance, sticky observed invalidation, and independent safe
  field/literal decisions. Validate every dependency affecting an enabled reduction.
- No callback replay, forced lazy carriers, user getter/equality dispatch during
  purity/currentness proof, general binder/inference/CFG engine, fabricated method
  symbols, generated-body parsing/compilation for production decisions, second
  preparation lifetime, or weakened input/custom-writer/diagnostic gates.
- Preserve original regression anchors and expectations. Do not delete, mute,
  substitute or weaken tests to mark an item complete. Do not remove existing
  proofs or guards just because their incremental benefit is unmeasured.
- A proof is worth new implementation when it enables a selected reduction,
  protects an active reduction, or is a justified shared prerequisite for a
  high-yield consumer. Otherwise defer expansion, not the safety check.

Required validation and independent review apply to the adopted scope. Further
adoption must provide its own fresh evidence; Task03 completion does not waive
later tasks' correctness, regression, CI or authorization gates.
