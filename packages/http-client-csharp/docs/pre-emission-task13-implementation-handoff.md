# Task13 handoff: conditional static invocations

Contract: [Task13](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543548000).
Dependencies: Tasks03, 06 and 11. Apply the
[shared guide](./pre-emission-implementation-guide.md).

## Scope

Prepare accepted conditional ordinary static invocations only with a stable,
complete outer executable unit and occurrence across relevant active parses.
A stable nested local function alone is insufficient.

Include the accepted implicit-expression/resource/body cases and their capture
restrictions. No blanket inactive call admission, general static field/property
conditional expansion or Task16 branch-local relaxation.

## Exact user-agreed exception

Task13 owns BOTH original variants of
`StructuralConditionalStaticReceiverReducedExtensionReceiverCapture(false/true)`
in the frozen StructuralConditionalStaticReceiverSafetyTests.

- With omitted caller-expression text, preserve the original
  `global::System.DateTimeOffset.UtcNow.Capture()` receiver text.
- With explicit text, preserve the accepted shorter qualifier and its original
  binding/runtime/diagnostic expectations.

Keep both expectations and capture/retention controls unchanged. This one accepted
reduced-extension receiver case is not authority for general conditional property
expansion or other property/field cases. Do not drop it merely because the broad
property family is excluded.

## Scope reconciliation before broader implementation

The frozen anchors also contain other field/property positives, including
StableUnitUsesOccurrenceProof kinds 1/2 (DateTimeOffset.UtcNow and TimeSpan.Zero),
constructed `Comparer<T>.Default` and property-based safety fixtures. These cannot
be admitted automatically under an invocation-only contract. Some occurrences are
outside the actual directive in a document containing a conditional sibling and
may belong to ordinary Task06 with shared correspondence facts; classify by the
actual occurrence/profile, not the test filename. The exact user-agreed pair above
does not settle those other ownership cases.

Record them as an explicit ownership/scope decision before implementing them.
Do not silently expand Task13, weaken/drop their expectations, or move them to
Task16. Continue the agreed invocation-only and exact exception work; do not claim
full Task13 completion while this acceptance conflict is unresolved.

## Minimal mechanism

Compose complete executable-unit/occurrence correspondence with actual constructed
receiver/member/callee facts, value-sensitive lookup, enclosing source captures and
implicit-operation regions. Reuse shared catalogs/lifetime; do not prebind generated
bodies, invent a method symbol or introduce a compiler lifecycle.

Map actual argument/receiver edges and the complete outer source/call closure.
Suitable foreach bodies or using resources can be eligible where accepted, while
implicit enumeration collection/capture regions retain their restrictions.
Preserve token/directive, visibility, line and original source policy.

## First checkpoint

Start with StructuralConditionalStaticReceiverStableUnitUsesOccurrenceProof
kind 0, Math.Abs(value), paired with variant-local shadow and outer captured-lambda
retention through the real writer. Check all relevant parses and raw spelling,
exact selected call/construction, diagnostics and runtime source. Do not replace a
captured constructor/resource or local-function case with an easier top-level call.

Then implement the exact agreed reduced-extension pair as a named acceptance row,
not a switch enabling conditional properties.

## Remaining accepted coverage

Anchors: StructuralConditionalStaticReceiverTests,
StructuralConditionalStaticReceiverSafetyTests,
StructuralConditionalStaticReceiverImplicitTests and
StructuralConditionalStaticReceiverImplicitSafetyTests.

Retain the original implicit enumeration/resource, outer-argument, local-function,
unit-cache/occurrence-order, token/directive and visibility counterexamples. Keep
the conditional handler sibling-capture direct/nested variants and their independent
useful positive. Existing optional-disposal caller info is not automatically
resource-expression capture, but it is not blanket disposal-absence evidence either. Keep
independently useful body invocations; an implicit-operation flag is not a
file-wide veto or an observation-absence certificate.

## Stops and completion

Optional namespace and affected-statement refinements are Tasks14/15. Whole-call
branch-local admission is Task16. Complete the Task13 profile and exact agreed pair
without implementing those later relaxations to force an otherwise vetoed case.
Native test parses may compile output; production preparation may not.
