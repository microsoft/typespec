---
changeKind: fix
packages:
  - "@typespec/emitter-framework"
---

Make the C# `TypeExpression` handle every type kind instead of throwing

`Tuple`, `StringTemplate`, `EnumMember`, `ModelProperty`, `UnionVariant`, template parameters and the full `Intrinsic` set are now supported, and an unsupported type reports a diagnostic and falls back to `object` rather than throwing. The diagnostics now name the offending type instead of saying only "Unsupported scalar type":

```
warning emitter-framework/csharp-unsupported-scalar: Scalar 'Currency' has no C# equivalent, using 'object' instead. Extend a built-in scalar to control how it is emitted.
```

Also fixes the C# components reporting a TypeScript diagnostic for unsupported scalars, and corrects the C# expressions for the `null` and `never` intrinsics.
