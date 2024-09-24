---
changeKind: fix
packages:
  - "@typespec/openapi"
---

@info decorator failed to exclude unallow keys, it only allow fixed fields and start with "x-".