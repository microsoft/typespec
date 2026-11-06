# Task07 handoff: supported field/property this receivers

Contract: [Task07](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543544409).
Dependencies: Tasks03, 04 and 05. Apply the [shared guide](./pre-emission-implementation-guide.md).

## Scope

Omit the containing-instance receiver only for supported instance fields and
non-indexer properties, including certified inherited/custom-partial and
constructed-owner relationships.

Retain invocation-target data members, methods, events, indexers, explicit-interface properties, fixed buffers and the Object/raw-field workarounds.
Unsupported conditional/static/initializer/default contexts and primary-constructor shadow-warning risks are not new admission profiles.

## Minimal mechanism

Prepare exact containing-instance, selected member and storage contracts plus
unqualified lookup at the actual occurrence. Identical value types do not prove
identical storage, ref behavior, property binding or evaluation.

Reuse Task04 scope/catalog facts and Task05 grammar, but keep this omission
permission distinct from type/parenthesis choices. Capture parameter/local/member
shadowing and final identifiers; preserve source and prefix-trivia policy.

Provider conversions currently create name-based MemberExpression values; a field
declaration reference alone is not a full containing-instance/member/storage
certificate. Add the smallest retained contract needed by the original anchors,
not general method-call this removal, flow/storage analysis or workaround deletion.

## First checkpoint

Use the original four field/property by read/write cases and a parameter-shadow
counterpart through the standard writer. Check raw omission/retention, exact selected field,
assignment/ref semantics, diagnostics and runtime. Include independent sibling
and stale-scope controls instead of a type-name-only fixture.

## Remaining accepted coverage

- Non-indexer property cases and inherited/custom-partial/constructed owners.
- Reads, writes, ref storage/returns/arguments, readonly and volatile fields.
- Original converted/dynamic behavior and retention controls; no broader admission.
- Explicit/omitted caller-expression observations, extension-receiver capture and
  outer-lambda capture, without substituting a name-only extension result.
- Source/trivia/line boundaries and required grouping; escaped @field versus the
  retained raw field workaround and primary-constructor warnings even with equal binding.

Anchors: StructuralThisReceiverTests, StructuralThisReceiverSafetyTests and
StructuralThisReceiverSourceTests. Task06 owns ordinary static qualifiers.

## Stops and completion

Do not replace an unsupported this context with a workaround deletion or expand
to all invocation targets. A requested new member kind requires a concrete scope
decision. Complete all accepted field/property positives and retained storage,
source and grammar controls under the shared validation gates.
