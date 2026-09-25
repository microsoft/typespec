---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Enum members use their `application/json` `@encodedName` as their serialized value, including members with an explicit value.
