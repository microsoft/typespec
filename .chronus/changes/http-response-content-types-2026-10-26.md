---
changeKind: fix
packages:
  - "@typespec/http"
---

Preserve every declared response content type when flattening HTTP operations, so generated clients accept content-type unions without changing the payload return type.
