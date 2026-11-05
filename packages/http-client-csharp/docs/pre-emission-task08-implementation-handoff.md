# Task08 handoff: optional-parameter default literals

Contract: [Task08](https://github.com/microsoft/typespec/issues/12454#issuecomment-6543544709).
Dependencies: Tasks03, 04 and 05. Apply the [shared guide](./pre-emission-implementation-guide.md).

## Scope — not argument omission

Simplify eligible direct optional-parameter `default(T)` forms to the default
literal on the existing supported method, constructor, delegate and local-function
parameters. Do not remove the default clause, parameter or call argument.
Task04 still owns ordinary type-prefix spelling inside a retained default.

No factory `(T)default`, general default expression, parenthesized/non-direct
default, primary-constructor/indexer/extension-this expansion, or unsupported
ref/in/out/params/dynamic/ref-like profile.

## Minimal mechanism

Prepare exact parameter identity, declared/default operand type and nullability,
language/ref-kind restrictions, reflection default and effective caller-info
contracts. A conversion guessed from written output is not evidence.

Compose the decision with surviving import-use facts before emission. A rooted
outer type does not establish that generic children are import-independent.
Distinguish original witnesses from future selected spellings; never let a
default edit justify its own import through a circular witness.

Snippet.DefaultOf currently emits a casted default/null, not direct default(T).
The inspected local-function writer also omits parameter defaults/attributes.
Establish the smallest direct-default and local-function emission contracts before
coding; do not repurpose the factory form or repair the general local-function
writer as incidental work.

When an otherwise eligible default is vetoed, freeze the relevant subtree as the
original contract requires. Do not freeze independently eligible children merely
because their default was originally ineligible for literal conversion.

## First checkpoint

Start with the original method/constructor CancellationToken defaults plus
int? value = default(int) retention, and the reflection/caller-info/import-witness
counterparts through the actual parameter writer. Assert raw
`= default` versus retained `default(T)`, exact parameter/argument behavior,
reflection defaults and diagnostics. Do not use a normal expression default as a
substitute for the optional-parameter fixture.

## Remaining accepted coverage

- Supported method/constructor/delegate/local-function parameter ownership.
- Exact nullability, language and type restrictions; null/Missing/DBNull behavior.
- Effective caller-info values and unchanged omitted-argument semantics.
- Nested generic child import dependencies, vetoed subtrees and original
  ineligible-default child positives.
- Combined type/default/documentation witness decisions without circular admission.

Anchors: StructuralOptionalDefault*Tests and StructuralC5Cref*Tests.

## Stops and completion

Do not build a general constant-conversion or import-cleanup engine. Request only
the bounded missing fact for the selected original case. Complete accepted raw,
reflection, caller-info and witness behavior; focused syntax shortening alone is
not completion. Task18 owns its separate documentation import activation.
