---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fixes issue in tsp-openapi3 that resulted in component schemas and parameters with the same name being merged into a single TypeSpec data type.