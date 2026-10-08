---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Enum members use their `application/json` `@encodedName` as their value, and an encoded integer member is emitted as a string. A server variable is validated on those values, so an integer enum whose members are all encoded can be used as one.
