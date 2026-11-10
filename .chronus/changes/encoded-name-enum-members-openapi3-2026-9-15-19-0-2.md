---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Enum members use their `application/json` `@encodedName` as their value, including in a server variable; an encoded integer member is emitted as a string.
