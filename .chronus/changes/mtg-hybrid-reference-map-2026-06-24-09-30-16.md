---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Preserve generated types that are kept because their base type is reachable when removing unreferenced C# types.
