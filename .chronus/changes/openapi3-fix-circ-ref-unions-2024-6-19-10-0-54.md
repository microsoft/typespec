---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fixes bug where circular references in unions caused an empty object to be emitted instead of a ref.