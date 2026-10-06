---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Enum members use their `application/json` `@encodedName` as their value, including members with an explicit value. An encoded integer member is emitted as a string. A server variable is validated on the encoded values of its enum members: an integer enum whose members are all encoded as strings is accepted, and one with an unencoded member is rejected, including a member whose value is `0`. A discriminated union's default variant is mapped even when its discriminator value is an empty string.
