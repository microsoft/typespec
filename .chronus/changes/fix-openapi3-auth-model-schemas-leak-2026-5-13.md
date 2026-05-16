---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fix custom auth scheme models leaking into `components.schemas` when declared inside the service namespace. They are now emitted only under `components.securitySchemes` as expected.
