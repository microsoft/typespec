---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Only emit the JSON Lines request helper when needed and use AOT-safe streaming deserialization.
