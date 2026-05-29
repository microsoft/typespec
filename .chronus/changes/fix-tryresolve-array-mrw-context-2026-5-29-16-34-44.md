---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix `TryResolve{Property}Array` helper to pass the generated `ModelReaderWriterContext` to `ModelReaderWriter.Write`, preventing AOT trimming errors.
