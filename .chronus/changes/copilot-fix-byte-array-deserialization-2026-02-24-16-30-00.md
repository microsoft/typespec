---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix deserialization code for `byte[]` properties to use `GetBytesFromBase64` instead of incorrectly treating them as JSON arrays
