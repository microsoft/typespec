---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fix `@extension` being duplicated on both the parameter object and its `schema` in OpenAPI output. Parameter extensions are now emitted only on the parameter object.
