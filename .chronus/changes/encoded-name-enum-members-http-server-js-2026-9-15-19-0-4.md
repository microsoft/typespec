---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

Enum members use their `application/json` `@encodedName` as their value, including members with an explicit value.
