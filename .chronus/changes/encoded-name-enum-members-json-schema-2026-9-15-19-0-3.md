---
changeKind: fix
packages:
  - "@typespec/json-schema"
---

Enum members use their `application/json` `@encodedName` as their value, including members with an explicit value. An encoded integer member is emitted as a string.
