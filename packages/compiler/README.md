# TypeSpec compiler and CLI

This package implements the core of the [TypeSpec](https://github.com/microsoft/typespec)
compiler and its command-line interface.

## Experimental optionality overrides (prototype)

Transforms can explicitly replace a derived property's inherited optionality:

```ts
import type { DecoratorContext, Model } from "@typespec/compiler";
import { unsafe_overridePropertyOptionality } from "@typespec/compiler/experimental";

export function $relaxed(context: DecoratorContext, target: Model) {
  for (const property of target.properties.values()) {
    unsafe_overridePropertyOptionality(property, true, context);
  }
}
```

`true` makes the property optional; `false` makes it required. Only mutate
properties owned by the transform, typically copied using a spread, `model is`,
the checker, or typekit. The source and sibling copies are not changed.

- Calling the API records intent even if `property.optional` already has that
  value. `@withOptionalProperties` (and therefore `OptionalProperties<T>`) uses
  this contract.
- Decorators must pass their context. Compiler/typekit clones preserve the
  override and its decorator provenance. Replaying an already-applied transform
  does not overwrite a later explicit transform or a version snapshot.
  Non-decorator transforms omit the context; the latest explicit override wins.
- Only optionality is replaced. Property presence, names, types, documentation,
  and unrelated metadata are unchanged.
- Libraries owning optionality metadata can store its `DecoratorContext` and
  consult `unsafe_getPropertyOptionalityOverride(property)?.supersedes(context)`.
  This distinguishes inherited annotations from newly authored annotations and
  augments on the transformed copy. It also works when state was recorded before
  the transform, without deleting decorators or unrelated library state.
- Versioning uses this contract for both inherited `@madeRequired` and
  `@madeOptional`. Newly authored history still applies and is still validated;
  invalid annotations on the original property still diagnose.

Custom optionality transforms must adopt this API to receive these semantics.
Arbitrary `property.optional = value` assignments cannot express same-value
intent. Direct assignments remain appropriate when **realizing** a version
snapshot: they do not establish a new semantic override.

This is an experimental, optionality-only prototype, not a general transform or
decorator replay framework. It does not add support for augment targets that
the name resolver cannot statically bind (for example, properties introduced
through template-parameter spreads). Use statically resolvable copies when
adding new augment metadata.

## See also

- [TypeSpec Getting Started](https://github.com/microsoft/typespec#getting-started)
- [TypeSpec Website](https://typespec.io)
