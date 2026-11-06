# Task06 handoff: ordinary static type receivers

Contract: [Task06](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543544118).
Dependencies: Tasks03 and 04. Apply the [shared guide](./pre-emission-implementation-guide.md).

## Scope

Cover ordinary static fields/properties/events, invocations and method groups,
including certified constructed, nested and aliased receivers with their actual
generic arguments. Prepare a shorter type receiver, not receiver elimination or
an unqualified static call.

Conditional calls belong to Task13 and its refinements. No general inference,
conditional-branch admission or broad member rewriting.

## Minimal mechanism

Extend shared lookup with this family's value-sensitive scope. A type-only
Task04 lookup cannot prove an expression receiver: values, members, aliases and
type parameters can capture the short name.

Capture the exact constructed receiver, actual static member and selected
ordinary callee/conversion where applicable. Use existing symbols and audited
generator contracts. A method name or intended signature is not selection.
Keep argument/child spellings and source observation occurrence-owned.

Use one receiver-choice plan with the existing input/currentness/use/fallback
lifetime. MemberExpression currently carries receiver/name, not an exact static
member contract; invocation intent/map hooks are not selected-call evidence.
Add narrowly owned facts for the adopted original cases, not a generated-body
binder, candidate-ranking engine, compiler host or repeated writer execution.

## First checkpoint

Start with the original Guid.Empty or DateTimeOffset.Now fixture and a competing
same-named value control; equal receiver value/type identity is not enough. Then
adopt Convert.ToString(42) separately with actual selected-call evidence and
caller-expression controls. Keep the original forms; assert raw receiver, exact
constructed member/callee, compiler/emit results and observed text.

## Remaining accepted coverage

- Fields, properties, events and method groups, not only direct invocations.
- Constructed/nested/alias targets and retained generic argument ownership.
- Value-sensitive collisions, source/token/parse/visibility exclusions.
- Enclosing capture, explicit overrides and independent safe sibling occurrences.
- Composition with type and grouping plans without changing member/call semantics.
- All six StaticReceiverQualifierPreservesTheCompleteMemberAndCall variants,
  nested/sibling lambda/query scope, await/@await and field/@field grammar.

Anchors: StructuralStaticReceiverTests, StructuralStaticReceiverSafetyTests and
StructuralStaticReceiverCompositionTests. The conditional reduced-extension
regression assigned to Task13 is not an ordinary static-property expansion here.

## Stops and completion

If selection is unavailable, identify the bounded fact needed by that accepted
case; do not add a universal resolver or claim the legacy simplifier supplies raw
acceptance. Complete the original ordinary inventory and relevant composition,
not every possible C# member/access pattern.
