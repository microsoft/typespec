---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fix import of `deprecated: true` on OpenAPI3 operations to generate `#deprecated "deprecated"` directive in converted TypeSpec output.
