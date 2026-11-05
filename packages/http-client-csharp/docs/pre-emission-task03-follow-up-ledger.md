# Task03 deferred acceptance owners and retained anchors

This is the R4 companion to the [acceptance map](./pre-emission-task03-acceptance-map.md)
and [scoped checklist](./pre-emission-task03-checklist.md). These are later-task
obligations, **not additional Task03 prerequisites**. Existing adopted core safety
remains mandatory; assignment does not waive an original shortening expectation.

## Retention and ownership rule

All **44 frozen original source files** were compared byte-for-byte by SHA-256
with committed blobs at
[`7ac8b2640bcfa42f96e1095fb208de83b911fe71`](https://github.com/live1206/typespec/commit/7ac8b2640bcfa42f96e1095fb208de83b911fe71).
The commit is publicly reachable. Links below are pinned to that source, not the
mutable continuation branch. A linked file plus exact method/case is the retained
original lookup identity. The complete retained collection is the `Structural*.cs`
set in that commit's [core test directory][original-directory].

Those tests establish structural-POC post-workspace behavior, not prepared raw
acceptance. Their owning consumer must preserve the original fixture/expectations
and add actual preparation/permission/raw-writer evidence before legacy processing,
then native binding, relevant diagnostics, emit/runtime and retained controls.
Do not substitute parameter delegates for original local delegates or easier
owners for the original mixed fixture.

**Established** assignments below follow the existing issue-task deliverables and
remaining-work handoff. The user explicitly agreed to the one narrow Task13
assignment below, preserving both variants and their original expectations and
capture/retention controls. Ownership is not permission to broaden that task's
implementation now.

## Row-level ledger

| Original row / retained anchor | Primary later owner | Required retained behavior / ownership status |
| --- | --- | --- |
| 1. [Namespace calls][namespace] — `UnobservedCallSourceAllowsNamespaceReduction(0–8)` | [Task04: type spellings][task04] | **Established.** Ordinary creation, typeof/default/array/cast/generic operand spellings remain required. The adopted typeof pair and independent unused-declaration prerequisite do not close the other operands. Task04 requests only shared facts needed by its selected roles. |
| 1, mixed sibling supplement. [Qualified contexts][qualified] — `TypeOnlyExpressionContextsUseStructuralNamesWithoutChangingOperations` | [Task04][task04] | **Established.** Preserve the whole Create/Kind/Zero/Array/Cast/Catch Clock; an extracted Kind member is not its full raw counterpart. |
| 2. [Namespace calls][namespace] — `ReorderedArgumentsUseParameterIdentityRatherThanEvaluationOrder`, `MultipleOmittedCaptureParametersProtectBothSources` | [Task04][task04] | **Established.** Retain actual parameter identity, named/default/explicit text maps, every observed source and required released positive. Wrong/unknown mappings retain. |
| 3. [Namespace calls][namespace] — `DelegateInvokeCallerExpressionRemainsExact`, `DelegateContractNotImplementationAttributesControlsCapture` | [Task04][task04] | **Established.** Keep the original local `PlainDelegate callback = Target`; the actual Invoke contract, not implementation CAE attributes, governs text observation. |
| 4. [Namespace calls][namespace] — `PartialMethodCaptureAttributesAreReadFromCombinedSymbol(false/true)` | [Task04][task04] | **Established.** Preserve either attribute placement and the original source-part relationship; source/provider facts alone do not establish raw permission. |
| 5a. [This receiver source][this-source] — `StructuralThisReceiverExtensionReceiverSourceObservation` | [Task07: this receiver removal][task07] | **Established.** Exact receiver capture/override positives and retention, not a name-only extension result. Task06 remains the separate ordinary static-qualifier owner. |
| 5b. [Conditional static safety][conditional-safety] — `StructuralConditionalStaticReceiverReducedExtensionReceiverCapture(false/true)` | **[Task13][task13] for this exact accepted case** | **Explicitly agreed by the user.** Retain `global::System.DateTimeOffset.UtcNow.Capture()` for omitted text and the accepted short qualifier for explicit text. Both variants keep their original expectations and capture/retention controls unchanged. Ownership is limited to this existing regression; general conditional property expansion remains excluded. This does not authorize broadening the conditional property family. |
| 6. [Namespace calls][namespace] — `OrdinaryConstructorInitializerSourceCanReduce` and original explicit/omitted constructor-text cases | [Task04][task04] | **Established.** Creation/initializer type spelling is Task04 work; required parentheses are [Task05][task05]. Do not infer constructor selection from intent or the adopted declaration edit. |
| 7a. [Namespace calls][namespace] — `EnclosingCallProofCoversLambdaSource` | [Task04][task04] | **Established.** Original private-instance Capture/lambda scope, explicit/omitted text, nested type operands and enclosure must remain recognizable. |
| 7b. [This lambda source][this-lambda] — `StructuralThisReceiverOuterCaptureProtectsNestedLambda(false/true)` | [Task07][task07] | **Established.** Receiver edits inside a captured lambda retain; independent unobserved receiver positives remain required. |
| 8. [Conditional implicit cases][conditional-implicit] — `StructuralConditionalStaticReceiverImplicitCollectionCaptureIsNotAnEmptyCallStack` and [safety counterparts][conditional-implicit-safety] | [Task13][task13] | **Established.** Implicit collection/resource capture retains; eligible body static qualifiers remain useful. Preserve async, nested, shared-factory and outer-capture counterexamples. Ordinary, nonconditional static-qualifier consumers remain [Task06][task06]. |
| 9. [Conditional implicit safety][conditional-implicit-safety] — `StructuralConditionalStaticReceiverUsingResourceKeepsUsefulCoverage`, optional disposal caller-info cases | [Task13][task13] | **Established.** Preserve accepted resource/body behavior and capture locality in the conditional profile. Nonconditional static-qualifier spelling is [Task06][task06]; required grammar is [Task05][task05]. No blanket pattern/async-disposal admission. |
| 10. [Handler sibling regression][handler] — `StructuralC5HandlerConstructorCallerExpressionPreservesSiblingSource(conditional,nested)` — all four combinations; `StructuralC5UnobservedStaticReceiverStillReduces(false/true)` | Direct forms: [Task06][task06]; conditional forms: [Task13][task13] | **Established by form.** Keep all direct/nested and conditional configurations, exact handler-captured sibling text and the independent useful positive. No single handler flag replaces argument/region mapping. |
| 11. [Namespace calls][namespace] — `MultilineRemovedPrefixCannotShiftCallerLineNumber`; [ordinary static safety][static-safety] and [this source][this-source] split-prefix cases | Type deletion: [Task04][task04]; parentheses: [Task05][task05]; static deletion: [Task06][task06]; this deletion: [Task07][task07] | **Established by deleting role.** Preserve LF/CRLF and actual caller-line values. The adopted fixed native prefix removes no newline; it does not certify split-prefix deletion. |
| 12. [Namespace trivia][trivia] — outer/trailing boundary comment positives; [qualified contexts][qualified] captured declarations; original directive/token boundaries | Type/declaration roles: [Task04][task04]; grouping roles: [Task05][task05]; static/this roles: [Task06][task06]/[Task07][task07] | **Established by edited role.** Retain original source ownership, trivia/directives/visibility, emitted identifier and compiler diagnostics. No reconstructed source-policy clearance. |
| 13a. [Namespace calls][namespace] — `ConditionalReceiverBindingCannotReuseOriginalCallProof`; [branch static trials][branches] — `BranchStaticReceiverTrial(3/4,false)`, `BranchStaticDisabledSourceCertificate(3/4,false)` and their declared positive/retention controls | Configuration correspondence: [Task11][task11]; branch-local static invocation consumer: [Task16][task16] | **Established by contract.** Missing active counterparts, varying binding/capture and unsupported options retain. Shared evidence is not universal inactive-source permission. |
| 13b. [Optional ancestor scope][optional-ancestor] — `OptionalAncestorScopeTrial`; [Optional affected-statement scope][optional-statement] — `OptionalStatementScopeTrial`, all declared cases | Actual-ancestor namespace refinement: [Task14][task14]; affected-statement refinement: [Task15][task15] | **Established by exact refinement.** Preserve namespace/import/extern/collision guards and the accepted later-nested-block variation. Task15 excludes wider document/scope-veto experimentation; this ledger assigns no such expansion to Task16. |
| 13b, grouping supplement. [Conditional parentheses][conditional-parentheses] and [safety counterparts][conditional-parentheses-safety] — original conditional-grouping positive/retention anchors | [Task12: conditional parentheses][task12] | **Established.** Task12 owns conditional grouping, not conditional type-name or receiver spelling. |
| 13c. [Integration][integration] — disabled/custom-writer/unknown-input admission and final policy controls | [Task19: integration][task19] | **Established.** Preserve default-off and actual input/factory/writer/rewriter safeguards while later consumers integrate. |
| 14a. [Namespace calls][namespace] — `CapturedCallDoesNotContaminateAnOrdinarySiblingCall` | [Task04][task04] | **Established.** Captured construction remains exact while the ordinary instance Pass counterpart still shortens. Current shared-typeof-IR tests do not replace this original same-method construction case. |
| 14b. [Integration][integration] — concurrent, later-unproven and shared-IR occurrence isolation | [Task19][task19] | **Established.** Final occurrence ownership, independent choices and one-writer consumption across adopted families. Keep active per-occurrence safeguards in the core now. |
| 15. Adopted-code lifetime/fallback tests, not an invented original Structural mutation fixture | [Task19][task19] | **Established for exhaustive integration.** Retain current `OriginalTypeOfUsedBodyDependencyStaysInvalidAfterExactNodeRestoration`, `BodyOnlyHostPhysicalInputChangeSelectsSamePassQualifiedFallback`, `OriginalConstructionDeclarationArgumentMutationStaysInvalidAfterRestoration`, and writer callback-once controls. Each later consumer validates its own affecting dependencies before adoption. |

The last row's current anchors are retained in adopted source
[`305048a0812c1d6e6d1b24e6de31dec38cc35cbb`](https://github.com/live1206/typespec/commit/305048a0812c1d6e6d1b24e6de31dec38cc35cbb)
and its [writer test directory][adopted-tests]. Final import/doc/cross-family
composition and complete residual-path replacement remain Task19 obligations.

R4 is complete with this reviewed ledger and scoped publication. **Scoped Task03
(R1–R4) is complete**; deferred accepted positives remain required in their
explicit owning tasks. No default activation, SDK adoption/regeneration,
performance claim, asynchronous `CSharpGen` adoption or full issue completion is
implied.

[original-directory]: https://github.com/live1206/typespec/tree/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test
[namespace]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralNamespaceSourceTests.cs
[qualified]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralTypeNameQualifiedContextTests.cs
[this-source]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralThisReceiverSourceTests.cs
[this-lambda]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralThisReceiverSourceTests.cs
[conditional]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralConditionalStaticReceiverTests.cs
[optional-ancestor]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralOptionalAncestorScopeTests.cs
[optional-statement]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralOptionalStatementScopeTests.cs
[conditional-parentheses]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralConditionalParenthesesTests.cs
[conditional-parentheses-safety]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralConditionalParenthesesSafetyTests.cs
[conditional-safety]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralConditionalStaticReceiverSafetyTests.cs
[conditional-implicit]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralConditionalStaticReceiverImplicitTests.cs
[conditional-implicit-safety]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralConditionalStaticReceiverImplicitSafetyTests.cs
[handler]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralC5HandlerCaptureRegressionTests.cs
[static-safety]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralStaticReceiverSafetyTests.cs
[trivia]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralNamespaceTriviaTests.cs
[branches]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralBranchStaticReceiverTests.cs
[integration]: https://github.com/live1206/typespec/blob/7ac8b2640bcfa42f96e1095fb208de83b911fe71/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/StructuralTypeNameIntegrationTests.cs
[adopted-tests]: https://github.com/live1206/typespec/tree/305048a0812c1d6e6d1b24e6de31dec38cc35cbb/packages/http-client-csharp/generator/Microsoft.TypeSpec.Generator/test/Writers
[task04]: https://github.com/microsoft/typespec/issues/12454#issuecomment-6543541243
[task05]: https://github.com/microsoft/typespec/issues/12454#issuecomment-6543541641
[task06]: https://github.com/microsoft/typespec/issues/12454#issuecomment-6543544118
[task07]: https://github.com/microsoft/typespec/issues/12454#issuecomment-6543544409
[task11]: https://github.com/microsoft/typespec/issues/12454#issuecomment-6543547354
[task12]: https://github.com/microsoft/typespec/issues/12454#issuecomment-6543547652
[task13]: https://github.com/microsoft/typespec/issues/12454#issuecomment-6543548000
[task14]: https://github.com/microsoft/typespec/issues/12454#issuecomment-6543549731
[task15]: https://github.com/microsoft/typespec/issues/12454#issuecomment-6543550062
[task16]: https://github.com/microsoft/typespec/issues/12454#issuecomment-6543550382
[task19]: https://github.com/microsoft/typespec/issues/12454#issuecomment-6543557177
