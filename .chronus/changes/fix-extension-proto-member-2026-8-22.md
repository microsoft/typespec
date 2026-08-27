---
changeKind: fix
packages:
  - "@typespec/openapi"
---

Fix `@extension` dropping object members with special names like `__proto__`. All members are now kept as plain own properties.
