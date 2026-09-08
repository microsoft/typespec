---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix object values passed to decorators dropping members with special names like `__proto__`. All members are now defined as plain own properties.
