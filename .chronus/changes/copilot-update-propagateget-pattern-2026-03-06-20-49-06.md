---
changeKind: feature
packages:
  - "@typespec/http-client-csharp"
---

Generator now emits V2 `PropagateGet` pattern for list/array properties backed by CLR types: adds an `IsEmpty` check at the outermost array level and generates `TryResolve{PropertyName}Array` / `Active{PropertyName}` helpers to support `JsonPatch.EnumerateArray` on CLR-backed collections.
