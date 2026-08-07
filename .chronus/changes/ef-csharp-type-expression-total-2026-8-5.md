---
changeKind: fix
packages:
  - "@typespec/emitter-framework"
---

Make the C# `TypeExpression` handle every type kind instead of throwing

`Tuple`, `StringTemplate`, `EnumMember`, `ModelProperty`, `UnionVariant`, template parameters and the full `Intrinsic` set are now supported, and an unsupported type reports a diagnostic and falls back to `object` rather than throwing. Also fixes the C# components reporting a TypeScript diagnostic for unsupported scalars, and corrects the C# expressions for the `null` and `never` intrinsics.
