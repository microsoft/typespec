# Task10 handoff: retained SDK-shaped interface casts

Contract: [Task10](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543547008).
Dependencies: Tasks03, 04, 05 and 06. Apply the
[shared guide](./pre-emission-implementation-guide.md).

## Scope

Prepare only the recorded `IPersistableModel<T>`-shaped retained receiver: interface
head and recorded enclosing SELF-model argument spellings. Preserve the cast,
its exact composed type, conversion/operator/callee and required grouping.

Do not revive the historical broad cast experiment, remove arbitrary casts or
admit foreign-model argument shortening. Ordinary protected-cast type slots and
this recorded SDK family have distinct owning contracts.

## Minimal mechanism

Use the producer's recorded interface/SELF relationship, actual constructed target
and conversion/callee facts, not an advertised expression type or name heuristic.
Reuse type-child plans, static/call facts and grouping policy; keep this cast's
conversion and parentheses intact.

ClientModel's MrwSerializationTypeDefinition already builds This.CastTo(interface)
followed by GetFormatFromOptions invocation. Use those real edges, not a new cast
subsystem. Name-based calls still need actual selected-callee evidence. A generated
SELF identity can use its retained provider relationship and metadata definition/
substitution facts; do not fabricate symbols or compile generated declarations.

Permit the accepted head-only shortening while foreign/unrecorded arguments stay
qualified. Keep original visibility/source guards and surviving parameter/import
witnesses; do not activate an unused framework import.

## First checkpoint

Use the original unconditional SDK-shaped cast/call fixture. Prove raw head/SELF
choices, preserved cast/grouping, exact reference conversion/callee and runtime.
Pair it with a foreign/unrecorded argument and lost-import-witness control; do not
substitute an easier ordinary cast.

## Conditional phase and dependencies

Implement the unconditional slice first. Task11 supplies stable-owner/configuration
facts for conditional cases; until then those cases remain open or on existing
migration scaffolding. Task11 can consume the unconditional capability without
waiting for Task10's entire conditional phase, avoiding a circular completion gate.

No post-write cast certificate is a finished implementation.

## Remaining coverage and completion

Anchors: StructuralSdkCastTypeQualificationTests, including head-only, SELF,
foreign/unrecorded argument retention, conversion/callee, grouping, import/source
and both original conditional variants. Keep ImportedModelArgumentRetainsUnusedImport
with its original `Contracts.I<Models.Model>` fixture and expected
`I<global::Models.Model>` result; do not substitute a framework-only cast.

Complete all accepted phases with prepared/raw/native evidence. Do not broaden
the family merely because the same generic type plan can print another cast.
