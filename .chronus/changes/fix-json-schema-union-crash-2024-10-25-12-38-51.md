---
changeKind: fix
packages:
  - "@typespec/json-schema"
---

Fixes crash that occurred when a template instantiation's template argument was a union that references a declaration.
