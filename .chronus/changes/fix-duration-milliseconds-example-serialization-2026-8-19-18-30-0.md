---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix `duration` example values being serialized verbatim as an ISO 8601 string instead of a numeric value when encoded with `@encode("milliseconds", ...)`
