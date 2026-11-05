# Task03 acceptance and next-slice selection

Source baseline: `92713ff0b` (code checkpoint `b317c10cf`). The docs-only
`2de4105f5` update replaces the old completion contract with R1–R4; it changes
none of the five C# files validated here. Follow the
[remaining-work handoff](./pre-emission-task03-scope-review.md) and
[scoped checklist](./pre-emission-task03-checklist.md).
Adopted code revision:
[`305048a0812c1d6e6d1b24e6de31dec38cc35cbb`](https://github.com/live1206/typespec/commit/305048a0812c1d6e6d1b24e6de31dec38cc35cbb).

This maps the existing **15-row / 44-source original inventory**, not a new
feature checklist. Producer evidence is not occurrence permission or raw-writer
acceptance. “Partial” below preserves the other accepted positives as pending.
Original fixture names refer to the frozen original POC inventory; current test
names are under `generator/Microsoft.TypeSpec.Generator/test/Writers/`.

## Evidence and disposition

| Row / original anchor | Task and actual consumer | Current evidence / missing stages | Disposition and incremental cost |
| --- | --- | --- | --- |
| 1. Ordinary calls — `UnobservedCallSourceAllowsNamespaceReduction(0–8)` | Task03 shared facts; Task04 expression spelling; declaration/type/creation writers | `OriginalTypeOfHostAcceptance` proves actual instance `Pass`, physical inputs, raw seed/typeof shortening, binding/diagnostics/emit/runtime. Other operand families lack raw permission. | Partial. **Next candidate: case 0's independent unused declaration**, not constructor spelling. Reuses current lifetime, lookup, whole-owner envelope and fallback. |
| 2. Maps/overrides — `ReorderedArgumentsUseParameterIdentityRatherThanEvaluationOrder`, `MultipleOmittedCaptureParametersProtectBothSources` | Tasks03/04; argument-containing writers | `NamedCallProofs` proves native maps and selective capture release. No faithful multi-argument raw permission pair. | Deferred accepted positives. Requires the selected multi-argument emission context, not another general mapping subsystem. |
| 3. Delegates — `DelegateInvokeCallerExpressionRemainsExact`, `DelegateContractNotImplementationAttributesControlsCapture` | Tasks03/04; invocation/operand writers | `ParameterDelegateProofs` proves parameter Invoke contracts/runtime, not the original local `PlainDelegate callback = Target`. | Deferred. Original local declaration/Invoke authority and raw counterparts remain necessary. |
| 4. Partial metadata — `PartialMethodCaptureAttributesAreReadFromCombinedSymbol` | Tasks03/04; captured operand writer | `LoadedSourceCallProofs`/`SourceInstanceConstructionProofs` cover source correspondence and partial observer controls. Original generated/custom raw pair missing. | Deferred. Reuse source-part facts when a selected consumer needs them. |
| 5. Extensions — `StructuralThisReceiverExtensionReceiverSourceObservation`, conditional reduced-extension receiver capture | Tasks03/06/07/13; receiver writers | `ReducedExtensionProofs` proves lookup, receiver formal and runtime; import purity controls retained. No receiver-edit raw permission. | Deferred to corresponding receiver/grammar slice; do not broaden all extension profiles first. |
| 6. Construction/initializers — `OrdinaryConstructorInitializerSourceCanReduce` | Tasks03/04; creation/initializer writers | `BaseInitializerProofs` proves actual base constructor/maps/runtime. Original construction spelling permission missing. | Deferred. The selected declaration candidate does **not** authorize shortening `new Exception()` or `base(...)`. |
| 7. Closures — `EnclosingCallProofCoversLambdaSource` | Tasks03/04/07; nested type/receiver/declaration writers | `LambdaCallProofs` proves bounded parent conversion/captures/shared edges. Original private-instance lambda raw permission missing. | Deferred. Generated-parent evidence and exact closure emission context add more cost than the selected declaration prerequisite. |
| 8. Enumeration — implicit collection capture/body independence | Tasks03/06/13; collection/body receiver writers | `EnclosingObservations` and `SourceOccurrences` cover barrier locality and distinct edges. Faithful raw/runtime pair missing. | Deferred; retain unknown collection hazards and unrelated body positives. |
| 9. Using/disposal — useful resource coverage and optional disposal caller-info | Tasks03/06/13; resource receiver writer | `ResourceObservationProofs` proves bounded synchronous disposal/text absence and runtime without inventing a winner. Receiver raw permission missing. | Deferred. No async/pattern/enumeration expansion solely to complete this row. |
| 10. Handlers — constructor caller-expression sibling-source regression | Tasks03/06/13; receiver writer | Conservative handler/forwarding barriers exist; actual handler sibling mappings and raw/runtime counterparts are absent. | Deferred. Requires the selected handler consumer's authoritative capture edges. |
| 11. Layout/caller line — `MultilineRemovedPrefixCannotShiftCallerLineNumber` and split-prefix LF/CRLF | Task03/G6 and Tasks04–07; deleting writers | Fixed native namespace deletion adds/removes no newline. Original split-prefix raw/native-line counterparts missing. | Partial safeguard, broader positives deferred. Current fixed-token slice must not imply multiline deletion support. |
| 12. Source policy — boundary comments, directives and captured block declarations | Task03/G4 and Task04; declaration/type writers | `SourceOccurrences` retains original flags. `OriginalTypeOfDocumentationPurity` proves legal alias escape retention, native positive and zero preparation formatter reads. | Partial. Preserve policy/purity controls; broaden provenance only for an adopted source-bearing context. |
| 13. Configuration/admission — branch trials and disabled/custom integration | Task03/G5 and Tasks11–16; admission/conditional consumers | `BodyOnlyHostLifetime` proves actual disabled/custom-writer/missing/stale-input rejection. Original branch-native raw counterparts missing. | Partial admission; branch expansion deferred to owning tasks. |
| 14. Occurrence/cache — captured call versus ordinary sibling | Task03/G7 and Task19; occurrence cursor | `OriginalTypeOfOutcomeControls` proves actual shared typeof IR, independent raw edges, native/runtime and used receipts. Original same-method construction sibling missing. | Partial. Carry identity/isolation onto adopted consumers; not an exhaustive combination matrix. |
| 15. Freshness/fallback — current field/body lifetime anchors | Task03/G7 and Task19; staged channel selection | `OriginalTypeOfOutcomeControls` and `BodyOnlyHostLifetime` prove shortened output before deep/physical invalidation, sticky restoration and same-pass fallback. | Partial active safeguard. Further permission families need affecting-dependency controls, not a second decision owner. |

The separate original `TypeOnlyExpressionContextsUseStructuralNamesWithoutChangingOperations`
fixture contains **Create/Kind/Zero/Array/Cast/Catch in one Clock**. Appending only
`Kind()` to a different owner is a narrower member experiment, not that full raw
counterpart. It is not being used to close the original mixed fixture.

## Benefit evidence and selection limits

- **Established previous checkpoint:** ordinary seed/typeof and captured seed
  shorten through actual complete-input standard writers; captured operand/text
  retain. This is bounded original-fixture evidence, not broad SDK applicability.
- **New declaration candidate:** the exact original `Pass(new Exception())`
  counterpart first passed native binding, relevant diagnostics, emit and runtime
  on both actual raw/qualified products, then failed the desired raw seed assertion.
  A two-file candidate reusing existing machinery now enables **one additional
  declaration occurrence in the original ordinary host**, plus one in a captured-call
  control adapted from the existing captured host. Both constructor operands remain
  qualified; the control's captured/runtime text stays exact. The eight-case
  new-scope gate and 158-case affected ownership/generic gate pass. Fresh
  unfiltered core **4,086/4,086** and client **2,696/2,696** pass with zero
  failures/skips. Formatting/Cop and all five changed C# hashes pass. Complete
  independent medium review of all seven changed files found no concrete defect;
  remote CI remains unverified.
- **Representative corpus counts remain unmeasured.** A temporary probe attempted
  existing Sample-TypeSpec/client-structure/bytes inputs. Setup errors were not
  measurements; the corrected run timed out before yielding valid counts. It was
  archived and removed. No eligible/enabled occurrence or file totals are inferred
  from certificate counts, IR counts or textual `global::` matches.
- Common declaration types are plausible, **not a measured winner**. Their used
  locals, multiple owners/files and additional descriptors require broader
  prerequisites than the current unused-default-local profile. The candidate
  above is selected **provisionally for low incremental cost and an exact original
  consumer**, not because corpus-wide benefit has been demonstrated.
- No file is being claimed to retire Simplifier. Current workspace processing
  retains the residual path; token shortening does not establish runtime savings.

## Shared boundary and Task04 handoff (R2)

The selected follow-on consumer is Task04's ordinary declaration/type-expression
work. The adopted shared core supplies the following boundaries; it does not
implement Task04's construction/role inventory:

- `PreparedFieldTypes.CreateForGeneration` owns admission from complete physical
  compiler inputs, the actual source model, standard writer/factory policy and
  finalized provider snapshots. Missing affecting evidence is unavailable.
- `PreparedSourceFile` and `PreparedSourceOccurrence` retain exact owner/root/edge
  identity, contextual facts, selected-call evidence, captures, source policy and
  currentness. Those are facts, not automatic permission to edit a name.
- The namespace lookup/finite-emission/permission objects admit only the supported
  native site in its audited whole-owner envelope. Declaration permission is
  independent of constructor spelling; no constructor selection is manufactured.
- `CodeWriter.TryWritePreparedNamespaceSite` consumes the actual occurrence cursor
  and records the permission used in the single standard-writer traversal.
- `CanCommitBodyNames(CodeFile)` checks actual used body permissions and receipts;
  `CanCommitSharedSnapshot()` supplies sticky shared invalidation. Field commit
  eligibility remains separate.
- `CodeFile.SelectPreparedNames(fieldAllowed, bodyAllowed)` selects the saved
  qualified alternatives without replaying callbacks. New consumers must preserve
  exact identity, source policy, observation boundaries and all affecting dependencies.

Current profiles remain one owner/source file, the unused default `Exception`
local plus return-call block, the supported descriptors, and audited native
`typeof` or zero-argument `new Exception()` argument. Constructor initializers,
nonempty arguments, custom reflection descriptors and constructor intents do not
borrow this new declaration permission. Parameter/local advertised types are not
binding authority; the finite block continues to withhold typed-parameter resolvers.
Fields, multiple owners, ordinary used SDK locals and broader descriptors remain
outside this body profile—not erased from their later accepted work.

Task04 can reuse these interfaces and evidence without waiting for the deferred
roadmap. Its role/construction consumers must supply their own occurrence-specific
permissions and necessary lookup/capture/emission envelopes. Broader asynchronous
`CSharpGen` or real field/body co-admission belongs to the task adopting that
profile and needs targeted integration evidence there.

## Required next evidence

Preserve the new original regression. Validate nonempty constructor arguments,
initializers and observed-mutation/restoration fallback where they affect this
new admission, alongside the existing active guards. No constructor-selection
proof or constructor-name permission is being added.

Direct preparation/writer/commit evidence is not the full asynchronous `CSharpGen`
staging/workspace path. Exercise that path before claiming adoption through it;
real field/body coexistence is required only when a profile admits both together.
The current finite profile still excludes fields and multiple owners.

This bounded checkpoint's fresh broader checks and independent review are
recorded above. Later scope requires fresh gates; report exact results, unresolved
original positives and CI. The historical 35 open items are deferred work, not
additional scoped Task03 completion gates. R1 remains open because representative
eligible/enabled counts and a demonstrated-benefit selection are unestablished;
R4 remains open pending exact later-owner reconciliation and scoped completion
publication. This checkpoint does not claim scoped Task03 completion, full issue
completion, default activation, performance, SDK adoption/regeneration, or original
PR/issue-comment work.
