# Task09 handoff: attribute names and suffixes

Contract: [Task09](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543544998).
Dependencies: Tasks03 and 04. Apply the [shared guide](./pre-emission-implementation-guide.md).

## Scope

Prepare accepted qualified/simple attribute heads and Attribute-suffix omission,
including the existing return/parameter/lambda targets. Qualification shortening
and suffix omission are separate choices: a legal shorter qualifier may still
require the suffix.

Do not rewrite constructors or arguments, activate unrelated ordinary cleanup
inside attribute arguments, or create a general attribute rebinding engine.

## Minimal mechanism

Own the whole attribute occurrence. Capture its actual type/constructor, argument
map, constants/conversions and named field/property assignments, together with
target grammar and escaping. A suffix/name match or constructor intent alone is
insufficient.

AttributeStatement currently has no exact generated constructor contract or target
marker; its AttributeData projection flattens arrays and represents enums as literal
values. Do not treat that as lossless whole-attribute serialization. Decide the
minimal accepted array/null/named-argument/target representation before coding;
escalate broader projection or emitter repair.

Prepare head/suffix alternatives before writing from explicit contracts and
already loaded symbols. Serialized XML/C# or a fragment compiler cannot become
the production authority. Keep Task04-owned operand permissions separate from
the attribute-head permission.

## First checkpoint

Reproduce an original head-shortening/suffix positive and a same-named or
grammar-sensitive counterpart that must retain the suffix. Use the actual
attribute producer and target. Assert prepared/raw head, native constructor and
named-assignment binding, constants, diagnostics and emitted attribute behavior.

## Remaining accepted coverage

- All accepted declaration/return/parameter/lambda target forms.
- Enum/array/null constants, conversions and named assignments.
- Qualified-to-simple changes that cannot also drop the suffix.
- Same-name/alias/keyword escaping, source exclusions and token/serialized grammar.
- Independent attribute occurrences and stale producer/contract changes; named
  constructor arguments versus named field/property assignments, @FlagAttribute,
  Unicode/keyword escapes, Fixtures.Flag shadowing and unchanged typeof argument text.

Anchors: StructuralAttributeTests and StructuralAttributeSafetyTests.

## Stops and completion

If the target grammar or whole-attribute contract is unavailable, retain that
occurrence and identify its bounded prerequisite. Do not parse generated fragments,
infer a winning constructor from a hint, or broaden ordinary argument rewriting.
Complete the original head/suffix and binding/grammar controls under shared gates.
