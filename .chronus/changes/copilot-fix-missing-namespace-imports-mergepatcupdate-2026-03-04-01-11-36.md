---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Fix missing `using` namespace imports in C# files generated from `MergePatchUpdate<T>` when model properties reference enum or named types from a different namespace
